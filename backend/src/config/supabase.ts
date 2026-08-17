import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabaseAuthEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

let client: SupabaseClient | undefined;

/**
 * Creates the Auth-only client lazily so database-only commands do not require
 * public Supabase settings. The publishable key is safe to expose to clients;
 * a service-role key is deliberately never used by the API.
 */
export function getSupabaseAuthClient(): SupabaseClient {
  if (client) return client;

  const config = supabaseAuthEnvSchema.parse(process.env);
  client = createClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return client;
}
