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
  const { data: profile } = await admin
    .from("profiles")
    .select("plan, subscription_status")
    .eq("id", userId)
    .maybeSingle();
  const limits = limitsFor(profile?.plan ?? "none", profile?.subscription_status ?? null);
  if (!limits) {
    return done({ reply: "Du behöver välja en plan innan vi kör. Testperioden är gratis i 7 dagar." }, 402);
  }

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const [{ count: leadsThisMonth }, { count: siteCount }] = await Promise.all([
    admin.from("leads").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", monthStart.toISOString()),
    admin.from("sites").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  const leadsLeft = limits.leadsPerMonth - (leadsThisMonth ?? 0);
  const sitesLeft = limits.sites - (siteCount ?? 0);
  if (leadsLeft <= 0 || sitesLeft <= 0) {
    return say("Du har nått gränsen i din plan. Uppgradera under Betalning för att fortsätta.");
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

    // 4. Sålla: titta på upp till dubbelt så många som efterfrågat
    const considered = fresh.slice(0, Math.min(intent.count * 2, leadsLeft));
    const toBuild: Place[] = [];
    const skipped: { place: Place; reason: string }[] = [];
    const buildCap = Math.min(intent.count, sitesLeft);
    for (const place of considered) {
      const reason = skipReason(place, agent);
      if (reason) skipped.push({ place, reason });
      else if (toBuild.length < buildCap) toBuild.push(place);
      // Bra företag utöver taket sparas inte, så de kan komma med i nästa körning.
    }

    // 5. Bygg sajter parallellt
    const results = await Promise.allSettled(
      toBuild.map((p) => generateSite(p, intent.business_type!, intent.city!, agent)),
    );

    const built: RunResult["built"] = [];
    for (let i = 0; i < toBuild.length; i++) {
      const place = toBuild[i];
      const result = results[i];
      if (result.status !== "fulfilled") continue;

      const { data: lead, error: leadError } = await admin
        .from("leads")
        .insert({
          user_id: userId, agent, place_id: place.placeId, name: place.name, address: place.address,
          phone: place.phone, website: place.website, rating: place.rating, review_count: place.reviewCount,
          status: "built",
        })
        .select("id")
        .single();
      if (leadError || !lead) continue;

      const slug = makeSlug(place.name);
      const url = `${siteUrl()}/s/${slug}`;
      const raw = result.value.outreachMessage;
      const outreach = raw.includes("{LÄNK}") ? raw.replaceAll("{LÄNK}", url) : `${raw} ${url}`;
      const { error: siteError } = await admin.from("sites").insert({
        user_id: userId, lead_id: lead.id, slug, business_name: place.name,
        content: { ...result.value.content, phone: place.phone, address: place.address },
        outreach_message: outreach,
      });
      if (siteError) continue;
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

    const reply =
      built.length > 0
        ? `Klart! Jag byggde ${built.length} ${built.length === 1 ? "sajt" : "sajter"}${skipped.length ? ` och hoppade över ${skipped.length} företag` : ""}.`
        : `Jag hittade inget värt att bygga för den här gången${skipped.length ? `, men hoppade över ${skipped.length} företag` : ""}. Prova en annan bransch eller ort.`;

    return say(reply, {
      built,
      skipped: skipped.map((s) => ({ name: s.place.name, reason: s.reason })),
    });
  } catch (error) {
    console.error("Körningen misslyckades", error);
    return say("Något gick fel under körningen. Försök igen om en stund.", {}, 500);
  }
}
