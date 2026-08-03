import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function getStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
}

const PRICE_IDS: Record<string, string> = {
  STARTER: process.env.STRIPE_PRICE_STARTER!,
  PRO: process.env.STRIPE_PRICE_PRO!,
  AGENCY: process.env.STRIPE_PRICE_AGENCY!,
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { plan } = await req.json();
  const priceId = PRICE_IDS[plan];
  if (!priceId) return NextResponse.json({ error: "Plan invalide" }, { status: 400 });

  const checkoutSession = await getStripeClient().checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=1`,
    client_reference_id: (session as any).agencyId,
    metadata: { agencyId: (session as any).agencyId, plan },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
