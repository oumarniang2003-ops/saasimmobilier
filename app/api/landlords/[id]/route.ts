import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currentMonthKey } from "@/lib/rent";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const agencyId = (session as any).agencyId;
  const month = currentMonthKey();

  const landlord = await prisma.landlord.findFirst({
    where: { id: params.id, agencyId },
    include: {
      leases: {
        include: {
          tenant: true,
          rentPayments: {
            where: { month },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!landlord) {
    return NextResponse.json({ error: "Bailleur introuvable" }, { status: 404 });
  }

  // Revenu total encaissé (tous les paiements PAID/PARTIAL, tous mois confondus)
  // pour ce bailleur, calculé séparément pour ne pas alourdir la requête principale
  const leaseIds = landlord.leases.map((l) => l.id);
  const allPayments = await prisma.rentPayment.findMany({
    where: { leaseId: { in: leaseIds }, status: { in: ["PAID", "PARTIAL"] } },
    select: { amountPaid: true, month: true },
  });

  const totalRevenueAllTime = allPayments.reduce((sum, p) => sum + Number(p.amountPaid), 0);

  const properties = landlord.leases.map((lease) => {
    const rp = lease.rentPayments[0];
    return {
      leaseId: lease.id,
      propertyLabel: lease.propertyLabel,
      tenantName: lease.tenant.name,
      tenantPhone: lease.tenant.phone,
      monthlyRent: Number(lease.monthlyRent),
      active: lease.active,
      currentMonthStatus: rp?.status ?? null,
    };
  });

  const expectedMonthlyTotal = properties
    .filter((p) => p.active)
    .reduce((sum, p) => sum + p.monthlyRent, 0);

  const collectedThisMonth = properties
    .filter((p) => p.currentMonthStatus === "PAID")
    .reduce((sum, p) => sum + p.monthlyRent, 0);

  return NextResponse.json({
    id: landlord.id,
    name: landlord.name,
    phone: landlord.phone,
    email: landlord.email,
    properties,
    expectedMonthlyTotal,
    collectedThisMonth,
    totalRevenueAllTime,
  });
}
