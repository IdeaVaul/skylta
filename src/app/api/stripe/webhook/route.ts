import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { planForPriceId } from "@/lib/plans";
import { getStripe } from "@/lib/stripe";

/** Stripe meddelar här när ett abonnemang startar, ändras eller avslutas. */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature ?? "", process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Ogiltig signatur" }, { status: 400 });
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const sub = event.data.object;
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const item = sub.items.data[0];
    const ended = sub.status === "canceled" || sub.status === "incomplete_expired";
    const plan = ended ? "none" : (planForPriceId(item?.price.id) ?? "none");
    const periodEnd = (item as { current_period_end?: number } | undefined)?.current_period_end;

    const { error } = await createAdminClient()
      .from("profiles")
      .update({
        plan,
        subscription_status: sub.status,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      })
      .eq("stripe_customer_id", customerId);
    if (error) return NextResponse.json({ error: "Kunde inte spara" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
