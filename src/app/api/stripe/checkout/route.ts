import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { priceIdFor } from "@/lib/plans";
import { getStripe, siteUrl } from "@/lib/stripe";

const Body = z.object({ plan: z.enum(["start", "proffs", "byra"]) });

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Inte inloggad" }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Okänd plan" }, { status: 400 });
  const price = priceIdFor(parsed.data.plan);
  if (!price) return NextResponse.json({ error: "Planen saknar pris-ID i miljövariablerna" }, { status: 500 });

  const stripe = getStripe();
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("stripe_customer_id, subscription_status").eq("id", user.id).maybeSingle();

  let customerId = profile?.stripe_customer_id as string | null | undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } });
    customerId = customer.id;
    await admin.from("profiles").upsert({ id: user.id, stripe_customer_id: customerId });
  }

  // Testperiod bara första gången.
  const hadSubscription = Boolean(profile?.subscription_status);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price, quantity: 1 }],
    subscription_data: hadSubscription ? undefined : { trial_period_days: 7 },
    automatic_tax: { enabled: false },
    locale: "sv",
    success_url: `${siteUrl()}/app?betalning=klar`,
    cancel_url: `${siteUrl()}/app`,
  });

  return NextResponse.json({ url: session.url });
}
