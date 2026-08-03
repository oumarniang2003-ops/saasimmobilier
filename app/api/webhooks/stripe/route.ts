import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

function getStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const legacy = (invoice as any).subscription;
  if (typeof legacy === "string") return legacy;
  const modern = (invoice as any).parent?.subscription_details?.subscription;
  if (typeof modern === "string") return modern;
  return null;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(body, signature!, webhookSecret);
  } catch (err: any) {
    console.error("Signature webhook invalide:", err.message);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const type = session.metadata?.type;

        // Cas 1 : un locataire vient de payer son loyer en ligne
        if (type === "rent_payment") {
          const rentPaymentId = session.metadata?.rentPaymentId;
          if (!rentPaymentId) break;

          const rentPayment = await prisma.rentPayment.findUnique({ where: { id: rentPaymentId } });
          if (!rentPayment) break;

          await prisma.rentPayment.update({
            where: { id: rentPaymentId },
            data: {
              status: "PAID",
              amountPaid: rentPayment.amountDue,
              paidAt: new Date(),
              paymentMethod: "CARD",
            },
          });
          break;
        }

        // Cas 2 : une agence vient de payer son abonnement SaaS
        const agencyId = session.metadata?.agencyId;
        const plan = session.metadata?.plan as "STARTER" | "PRO" | "AGENCY" | undefined;
        if (!agencyId || !plan) break;

        const subscription = await getStripeClient().subscriptions.retrieve(session.subscription as string);

        await prisma.subscription.update({
          where: { agencyId },
          data: {
            plan,
            status: "ACTIVE",
            stripeCustomerId: session.customer as string,
            stripeSubId: subscription.id,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        });
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = getSubscriptionIdFromInvoice(invoice);
        if (!subscriptionId) break;

        const sub = await prisma.subscription.findFirst({ where: { stripeSubId: subscriptionId } });
        if (!sub) break;

        const stripeSub = await getStripeClient().subscriptions.retrieve(subscriptionId);
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: "ACTIVE", currentPeriodEnd: new Date(stripeSub.current_period_end * 1000) },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = getSubscriptionIdFromInvoice(invoice);
        if (!subscriptionId) break;

        const sub = await prisma.subscription.findFirst({ where: { stripeSubId: subscriptionId } });
        if (!sub) break;

        await prisma.subscription.update({ where: { id: sub.id }, data: { status: "PAST_DUE" } });
        break;
      }

      case "customer.subscription.deleted": {
        const stripeSub = event.data.object as Stripe.Subscription;
        const sub = await prisma.subscription.findFirst({ where: { stripeSubId: stripeSub.id } });
        if (!sub) break;

        await prisma.subscription.update({ where: { id: sub.id }, data: { status: "CANCELED" } });
        break;
      }

      default:
        break;
    }
  } catch (err: any) {
    console.error(`Erreur en traitant l'événement ${event.type}:`, err.message);
  }

  return NextResponse.json({ received: true });
}
