import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const agencyId = (session as any).agencyId;
  const body = await req.json();
  const { paymentMethod, amount } = body as { paymentMethod?: string; amount?: number };

  // Sécurité : vérifie que ce loyer appartient bien à un bail de cette agence
  const rentPayment = await prisma.rentPayment.findUnique({
    where: { id: params.id },
    include: { lease: true },
  });
  if (!rentPayment || rentPayment.lease.agencyId !== agencyId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const paidAmount = amount ?? Number(rentPayment.amountDue);
  const isFullyPaid = paidAmount >= Number(rentPayment.amountDue);

  const updated = await prisma.rentPayment.update({
    where: { id: params.id },
    data: {
      status: isFullyPaid ? "PAID" : "PARTIAL",
      amountPaid: paidAmount,
      paidAt: new Date(),
      paymentMethod: paymentMethod || "CASH",
    },
  });

  return NextResponse.json(updated);
}
