import { NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, siteUrl } from "@/lib/stripe";

/** Öppnar Stripes kundportal där användaren byter eller avslutar sin plan. */
export async function POST() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Inte inloggad" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("stripe_customer_id").eq("id", userId).maybeSingle();
  if (!profile?.stripe_customer_id) return NextResponse.json({ error: "Ingen plan ännu" }, { status: 400 });

  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${siteUrl()}/app`,
  });
  return NextResponse.json({ url: session.url });
}
