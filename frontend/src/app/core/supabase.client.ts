import { createClient } from "@supabase/supabase-js";
import { environment } from "../../environments/environment";

if (!environment.supabaseUrl || !environment.supabasePublishableKey) {
  throw new Error("Supabase browser configuration is missing.");
}

export const supabase = createClient(
  environment.supabaseUrl,
  environment.supabasePublishableKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  },
);
