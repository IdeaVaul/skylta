import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { limitsFor } from "@/lib/plans";
import { parseIntent, generateSite } from "@/lib/ai";
import { searchPlaces, skipReason, type Place } from "@/lib/places";
import { makeSlug } from "@/lib/slug";
import { siteUrl } from "@/lib/stripe";

export const maxDuration = 300;

const Body = z.object({
  agent: z.enum(["nils", "saga"]),
  message: z.string().trim().min(1).max(500),
});

export type RunResult = {
  reply: string;
  built: { name: string; url: string; phone: string | null; message: string }[];
  skipped: { name: string; reason: string }[];
};

/** Tak för antal körningar per dygn, så att ett konto inte kan dra obegränsade kostnader. */
const RUNS_PER_DAY = { trial: 15, paid: 200 };

function done(result: Partial<RunResult>, status = 200) {
  return NextResponse.json({ reply: "", built: [], skipped: [], ...result }, { status });
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return done({ reply: "Du behöver logga in igen." }, 401);

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return done({ reply: "Skriv vad du vill att jag ska leta efter." }, 400);
  const { agent, message } = parsed.data;

  const admin = createAdminClient();
  const say = async (reply: string, extra: Partial<RunResult> = {}, status = 200) => {
    await admin.from("messages").insert([
      { user_id: userId, agent, role: "user", content: message },
      { user_id: userId, agent, role: "assistant", content: reply },
    ]);
    return done({ reply, ...extra }, status);
  };

  // 1. Plan och gränser
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("plan, subscription_status, current_period_end")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) {
    console.error("Kunde inte läsa profilen", profileError);
    return done({ reply: "Databasen svarar inte som den ska. Försök igen om en stund." }, 500);
  }
  const limits = limitsFor(profile?.plan ?? "none", profile?.subscription_status ?? null, profile?.current_period_end);
  if (!limits) {
    return done({ reply: "Du behöver starta en testperiod eller välja en plan innan vi kör." }, 402);
  }

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return done({ reply: "Företagssöket är inte påslaget än. Den som driver sajten behöver lägga in en nyckel för Google Places." }, 503);
  }

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [{ count: leadsThisMonth }, { count: siteCount }, { count: runsToday }] = await Promise.all([
    // Som lead räknas ett företag vi byggt för, inte de bortvalda.
    admin.from("leads").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "built").gte("created_at", monthStart.toISOString()),
    admin.from("sites").select("id", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("messages").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("role", "user").gte("created_at", dayAgo),
  ]);
  const maxRuns = profile?.subscription_status === "trialing" ? RUNS_PER_DAY.trial : RUNS_PER_DAY.paid;
  if ((runsToday ?? 0) >= maxRuns) {
    return done({ reply: "Du har kört många sökningar i dag. Försök igen i morgon." }, 429);
  }
  const leadsLeft = limits.leadsPerMonth - (leadsThisMonth ?? 0);
  const sitesLeft = limits.sites - (siteCount ?? 0);
  if (leadsLeft <= 0 || sitesLeft <= 0) {
    return say(
      profile?.subscription_status === "trialing"
        ? "Din testperiod räcker till en hemsida, och den är redan byggd. Du hittar den under Dina sajter."
        : "Du har nått gränsen i din plan. Uppgradera under Betalning för att fortsätta.",
    );
  }

  try {
    // 2. Tolka beställningen
    const intent = await parseIntent(message);
    if (!intent.business_type || !intent.city) {
      return say("Berätta vilken bransch och vilken ort, till exempel ”5 frisörer i Linköping”.");
    }

    // 3. Hitta företag, hoppa över dem vi redan har
    const places = await searchPlaces(intent.business_type, intent.city);
    const { data: known } = await admin
      .from("leads")
      .select("place_id")
      .eq("user_id", userId)
      .in("place_id", places.map((p) => p.placeId));
    const knownIds = new Set((known ?? []).map((k) => k.place_id));
    const fresh = places.filter((p) => !knownIds.has(p.placeId));
    if (fresh.length === 0) {
      return say(`Jag hittade inga nya ${intent.business_type} i ${intent.city}. Prova en annan bransch eller ort.`);
    }

    // 4. Sålla. Vi går igenom träffarna tills vi har så många som efterfrågats.
    const buildCap = Math.min(intent.count, sitesLeft, leadsLeft);
    const toBuild: Place[] = [];
    const skipped: { place: Place; reason: string }[] = [];
    for (const place of fresh) {
      if (toBuild.length >= buildCap) break;
      const reason = skipReason(place, agent);
      if (reason) skipped.push({ place, reason });
      else toBuild.push(place);
    }

    // 5. Bygg sajter parallellt
    const results = await Promise.allSettled(
      toBuild.map((p) => generateSite(p, intent.business_type!, intent.city!, agent)),
    );

    const built: RunResult["built"] = [];
    let failed = 0;
    for (let i = 0; i < toBuild.length; i++) {
      const place = toBuild[i];
      const result = results[i];
      if (result.status !== "fulfilled") {
        failed++;
        console.error("Kunde inte bygga sajt", place.name, result.reason);
        continue;
      }

      const { data: lead, error: leadError } = await admin
        .from("leads")
        .insert({
          user_id: userId, agent, place_id: place.placeId, name: place.name, address: place.address,
          phone: place.phone, website: place.website, rating: place.rating, review_count: place.reviewCount,
          status: "built",
        })
        .select("id")
        .single();
      if (leadError || !lead) {
        failed++;
        console.error("Kunde inte spara lead", leadError);
        continue;
      }

      const slug = makeSlug(place.name);
      const url = `${siteUrl()}/s/${slug}`;
      const raw = result.value.outreachMessage;
      const outreach = raw.includes("{LÄNK}") ? raw.replaceAll("{LÄNK}", url) : `${raw} ${url}`;
      const { error: siteError } = await admin.from("sites").insert({
        user_id: userId, lead_id: lead.id, slug, business_name: place.name,
        content: { ...result.value.content, phone: place.phone, address: place.address },
        outreach_message: outreach,
      });
      if (siteError) {
        failed++;
        console.error("Kunde inte spara sajt", siteError);
        continue;
      }
      built.push({ name: place.name, url, phone: place.phone, message: outreach });
    }

    if (skipped.length > 0) {
      await admin.from("leads").insert(
        skipped.map(({ place, reason }) => ({
          user_id: userId, agent, place_id: place.placeId, name: place.name, address: place.address,
          phone: place.phone, website: place.website, rating: place.rating, review_count: place.reviewCount,
          status: "skipped", skip_reason: reason,
        })),
      );
    }

    const skippedNote = skipped.length ? ` och hoppade över ${skipped.length} företag` : "";
    let reply: string;
    if (built.length > 0) {
      reply = `Klart! Jag byggde ${built.length} ${built.length === 1 ? "sajt" : "sajter"}${skippedNote}.`;
      if (failed > 0) reply += ` ${failed} gick inte att bygga den här gången.`;
    } else if (failed > 0) {
      reply = "Jag hittade företag men kunde inte bygga sajterna. Det är ett tekniskt fel hos oss, försök igen om en stund.";
    } else {
      reply = `Jag hittade inget att bygga för den här gången${skipped.length ? `, och hoppade över ${skipped.length} företag` : ""}. Prova en annan bransch eller ort.`;
    }

    return say(reply, {
      built,
      skipped: skipped.map((s) => ({ name: s.place.name, reason: s.reason })),
    });
  } catch (error) {
    console.error("Körningen misslyckades", error);
    const status = (error as { status?: number } | null)?.status;
    if (status === 401 || status === 402 || status === 403) {
      // AI-tjänsten nekar: nyckel saknas eller AI Gateway är inte aktiverat på Vercel-kontot.
      return done({ reply: "AI-tjänsten är inte påslagen än. Den som driver sajten behöver aktivera AI Gateway hos Vercel eller lägga in en egen AI-nyckel." }, 503);
    }
    return say("Något gick fel under körningen. Försök igen om en stund.", {}, 500);
  }
}
