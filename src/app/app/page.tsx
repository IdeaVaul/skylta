import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";
import { limitsFor, PLANS, stripeEnabled, type PlanId } from "@/lib/plans";
import { logout } from "../login/actions";
import { Chat } from "./Chat";
import { PlanPicker, PortalButton, TrialStart } from "./Billing";
import { startTrial } from "./actions";

export default async function AppPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/login");

  // RLS ser till att vi bara får våra egna rader.
  const [{ data: profile }, { data: sites }] = await Promise.all([
    supabase.from("profiles").select("plan, subscription_status, current_period_end, stripe_customer_id").maybeSingle(),
    supabase.from("sites").select("id, slug, business_name, outreach_message, created_at").order("created_at", { ascending: false }).limit(50),
  ]);

  const limits = limitsFor(profile?.plan ?? "none", profile?.subscription_status ?? null, profile?.current_period_end);
  const paid = stripeEnabled();
  const planName = PLANS[profile?.plan as PlanId]?.name;

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-[960px] flex-wrap items-center justify-between gap-4 px-6 py-5">
        <Link href="/" aria-label="Skylta, startsida"><Logo size={32} /></Link>
        <div className="flex flex-wrap items-center gap-3 text-[15px]">
          {limits && planName && (
            <span className="rounded-full bg-[#DDEFE6] px-3 py-1.5 text-[13px] font-semibold text-[#0A5A3F]">
              {planName}{profile?.subscription_status === "trialing" ? " · testperiod" : ""}
            </span>
          )}
          {profile?.stripe_customer_id && paid && <PortalButton />}
          <form action={logout}>
            <button className="rounded-full border border-[#C9D1CC] bg-white px-4 py-2.5 font-medium">Logga ut</button>
          </form>
        </div>
      </header>

      <main className="mx-auto flex max-w-[960px] flex-col gap-12 px-6 pb-20">
        {limits ? (
          <Chat />
        ) : paid ? (
          <PlanPicker />
        ) : (
          <TrialStart expired={Boolean(profile?.subscription_status)} action={startTrial} />
        )}

        {sites && sites.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="font-display text-2xl font-extrabold tracking-tight">Dina sajter</h2>
            <ul className="flex flex-col gap-3">
              {sites.map((s) => (
                <li key={s.id} className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-semibold">{s.business_name}</span>
                    <a href={`/s/${s.slug}`} target="_blank" className="font-semibold text-forest underline">Öppna sajten</a>
                  </div>
                  <p className="text-[15px] text-body">{s.outreach_message}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

// Sidan beror på inloggning/databas och renderas vid varje anrop.
export const instant = false;
