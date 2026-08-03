import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
}

// Génère un lien de paiement Stripe pour le montant EXACT dû sur ce loyer
// (contrairement aux abonnements SaaS, chaque loyer a un montant propre,
// donc on crée un prix à la volée plutôt que d'utiliser un Price ID fixe).
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const agencyId = (session as any).agencyId;

  const rentPayment = await prisma.rentPayment.findUnique({
    where: { id: params.id },
    include: { lease: { include: { tenant: true } } },
  });
  if (!rentPayment || rentPayment.lease.agencyId !== agencyId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const remainingAmount = Number(rentPayment.amountDue) - Number(rentPayment.amountPaid);
  if (remainingAmount <= 0) {
    return NextResponse.json({ error: "Ce loyer est déjà payé." }, { status: 400 });
  }

  const checkoutSession = await getStripeClient().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur", // adaptez si vous facturez dans une autre devise
          product_data: {
            name: `Loyer ${rentPayment.month} — ${rentPayment.lease.propertyLabel}`,
            description: `Locataire : ${rentPayment.lease.tenant.name}`,
          },
          unit_amount: Math.round(remainingAmount * 100), // Stripe attend des centimes
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/rent?paid=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/rent?canceled=1`,
    metadata: {
      type: "rent_payment",
      rentPaymentId: rentPayment.id,
    },
  });

  await prisma.rentPayment.update({
    where: { id: rentPayment.id },
    data: { stripeCheckoutId: checkoutSession.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
