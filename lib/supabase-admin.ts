import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Server-only Supabase client using the service_role key, which bypasses RLS.
 * Never import this from client code — `SUPABASE_SERVICE_ROLE_KEY` must never
 * reach the browser. The chat_logs table has RLS enabled with no policies, so
 * this key is the only way in or out of that table by design.
 *
 * Returns null when the env vars aren't configured, so chat logging degrades
 * to a no-op locally instead of crashing the request, the same pattern the
 * Gemini key uses for demo mode.
 */
let cached: SupabaseClient | null | undefined

export function getSupabaseAdmin(): SupabaseClient | null {
  if (cached !== undefined) return cached

  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    cached = null
    return cached
  }

  cached = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}
