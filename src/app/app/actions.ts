"use server";

import { redirect } from "next/navigation";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripeEnabled, TRIAL_DAYS } from "@/lib/plans";

/**
 * Startar en gratis testperiod utan kort. Används bara så länge Stripe
 * inte är inkopplat, och bara en gång per konto.
 */
export async function startTrial() {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  if (stripeEnabled()) redirect("/app");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("subscription_status")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.subscription_status) {
    const end = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await admin
      .from("profiles")
      .upsert({ id: userId, plan: "start", subscription_status: "trialing", current_period_end: end });
  }
  redirect("/app");
}
