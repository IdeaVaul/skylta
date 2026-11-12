// Körs före varje produktionsbygge (se "build" i package.json).
// 1. Kör nya filer i supabase/migrations mot databasen, en gång var.
// 2. Ger ägarens konto en plan om SKYLTA_OWNER_EMAIL är satt.
// 3. Provar att AI-anropet fungerar (bara loggning, stoppar inte bygget).
//
// Hoppas över när ingen databasadress finns (t.ex. lokalt).

import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const log = (msg) => console.log(`[skylta] ${msg}`);
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "supabase", "migrations");

async function migrate() {
  const raw = process.env.POSTGRES_URL_NON_POOLING;
  const wanted = process.env.VERCEL_ENV === "production" || process.env.RUN_MIGRATIONS === "1";
  if (!raw || !wanted) {
    log("Hoppar över databasmigrering (ingen databasadress eller inte produktion).");
    return;
  }

  // Adressen anger själv sslmode. Tolka den som libpq gör, så att
  // "require" betyder krypterad anslutning på det sätt Supabase avser.
  const url = new URL(raw);
  if (url.searchParams.has("sslmode")) url.searchParams.set("uselibpqcompat", "true");

  const client = new pg.Client({ connectionString: url.toString() });
  await client.connect();
  try {
    await client.query("create schema if not exists private");
    await client.query(
      "create table if not exists private.schema_migrations (name text primary key, applied_at timestamptz not null default now())",
    );

    const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
    const { rows } = await client.query("select name from private.schema_migrations");
    const applied = new Set(rows.map((r) => r.name));

    // Om grundschemat redan är kört för hand: markera det som klart i stället för att köra om.
    if (applied.size === 0 && files.length > 0) {
      const { rows: existing } = await client.query("select to_regclass('public.profiles') as t");
      if (existing[0].t) {
        await client.query("insert into private.schema_migrations (name) values ($1)", [files[0]]);
        applied.add(files[0]);
        log(`Grundschemat fanns redan, markerar ${files[0]} som kört.`);
      }
    }

    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = await readFile(path.join(dir, file), "utf8");
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("insert into private.schema_migrations (name) values ($1)", [file]);
        await client.query("commit");
        log(`Körde migrering ${file}.`);
      } catch (error) {
        await client.query("rollback");
        throw new Error(`Migreringen ${file} misslyckades: ${error.message}`);
      }
    }

    const { rows: tables } = await client.query(
      "select count(*)::int as n from information_schema.tables where table_schema = 'public' and table_name in ('profiles','leads','sites','messages')",
    );
    log(`Databasen har ${tables[0].n} av 4 tabeller.`);

    const owner = process.env.SKYLTA_OWNER_EMAIL?.trim().toLowerCase();
    if (owner) {
      const res = await client.query(
        `insert into public.profiles (id, plan, subscription_status)
         select id, 'start', 'active' from auth.users where lower(email) = $1
         on conflict (id) do update set plan = 'start', subscription_status = 'active'
         where public.profiles.stripe_customer_id is null`,
        [owner],
      );
      log(res.rowCount ? "Ägarkontot har planen Start." : "Ägarkontot finns inte än (ingen har registrerat sig med den adressen).");
    }
  } finally {
    await client.end();
  }
}

async function checkAi() {
  if (process.env.ANTHROPIC_API_KEY) {
    log("AI: använder ANTHROPIC_API_KEY.");
    return;
  }
  const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  if (!token) {
    log("AI: ingen nyckel och ingen Vercel-token i bygget.");
    return;
  }
  try {
    const res = await fetch("https://ai-gateway.vercel.sh/v1/messages", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "anthropic/claude-haiku-5.5",
        max_tokens: 60,
        tools: [{ name: "svar", description: "Svara", input_schema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"] } }],
        tool_choice: { type: "tool", name: "svar" },
        messages: [{ role: "user", content: "Svara ok." }],
      }),
    });
    const text = await res.text();
    log(`AI via Vercel AI Gateway: HTTP ${res.status}${res.ok ? " (fungerar)" : ` – ${text.slice(0, 300)}`}`);
  } catch (error) {
    log(`AI via Vercel AI Gateway kunde inte nås: ${error.message}`);
  }
}

// Provsökning mot Google Places. Kostar en sökning, så den körs bara när
// SKYLTA_SMOKE_TEST=1 är satt.
async function checkPlaces() {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    log("Företagssök: GOOGLE_PLACES_API_KEY saknas.");
    return;
  }
  if (process.env.SKYLTA_SMOKE_TEST !== "1") {
    log("Företagssök: nyckel finns (provsökning avstängd).");
    return;
  }
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.id,places.websiteUri,places.nationalPhoneNumber",
      },
      body: JSON.stringify({ textQuery: "frisörer i Linköping", languageCode: "sv", regionCode: "SE", pageSize: 20 }),
    });
    if (!res.ok) {
      log(`Företagssök: HTTP ${res.status} – ${(await res.text()).slice(0, 400)}`);
      return;
    }
    const places = (await res.json()).places ?? [];
    const noSite = places.filter((p) => !p.websiteUri).length;
    const noSiteWithPhone = places.filter((p) => !p.websiteUri && p.nationalPhoneNumber).length;
    log(`Företagssök fungerar: ${places.length} träffar, ${noSite} utan hemsida, varav ${noSiteWithPhone} med telefonnummer.`);
  } catch (error) {
    log(`Företagssök kunde inte nås: ${error.message}`);
  }
}

await migrate();
await checkAi();
await checkPlaces();
