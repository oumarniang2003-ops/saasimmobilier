import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateRentPaymentsForMonth, markOverdueRentPayments, currentMonthKey } from "@/lib/rent";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const agencyId = (session as any).agencyId;
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || currentMonthKey();

  // Génère automatiquement les lignes manquantes pour ce mois (idempotent),
  // et met à jour les statuts en retard, avant de renvoyer la liste.
  await generateRentPaymentsForMonth(agencyId, month);
  await markOverdueRentPayments(agencyId);

  const leases = await prisma.lease.findMany({
    where: { agencyId, active: true },
    include: {
      tenant: true,
      rentPayments: { where: { month } },
    },
    orderBy: { createdAt: "asc" },
  });

  const rows = leases.map((lease) => ({
    leaseId: lease.id,
    tenantName: lease.tenant.name,
    tenantPhone: lease.tenant.phone,
    propertyLabel: lease.propertyLabel,
    monthlyRent: Number(lease.monthlyRent),
    rentPayment: lease.rentPayments[0]
      ? {
          id: lease.rentPayments[0].id,
          status: lease.rentPayments[0].status,
          amountDue: Number(lease.rentPayments[0].amountDue),
          amountPaid: Number(lease.rentPayments[0].amountPaid),
          dueDate: lease.rentPayments[0].dueDate,
          paidAt: lease.rentPayments[0].paidAt,
          paymentMethod: lease.rentPayments[0].paymentMethod,
        }
      : null,
  }));

  const totalDue = rows.reduce((sum, r) => sum + (r.rentPayment?.amountDue ?? 0), 0);
  const totalCollected = rows.reduce((sum, r) => sum + (r.rentPayment?.amountPaid ?? 0), 0);
  const overdueCount = rows.filter((r) => r.rentPayment?.status === "OVERDUE").length;

  return NextResponse.json({ month, rows, totalDue, totalCollected, overdueCount });
}
