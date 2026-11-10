import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Klient med secret key. Går förbi RLS – får BARA användas på servern,
 * och bara efter att användaren är kontrollerad.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
