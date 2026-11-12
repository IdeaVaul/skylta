import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripeEnabled } from "@/lib/plans";

/**
 * Visar vilka delar som är inkopplade. Inga hemligheter och inga anrop
 * som kostar pengar, så den kan vara öppen.
 */
export async function GET() {
  let database = false;
  try {
    const { error } = await createAdminClient().from("profiles").select("id", { count: "exact", head: true });
    database = !error;
  } catch {
    database = false;
  }

  return NextResponse.json(
    {
      databas: database,
      foretagssok: Boolean(process.env.GOOGLE_PLACES_API_KEY),
      ai: process.env.ANTHROPIC_API_KEY ? "egen nyckel" : "vercel ai gateway",
      betalning: stripeEnabled(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
