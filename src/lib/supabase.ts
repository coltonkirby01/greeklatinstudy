import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./supabase-config";

export { appUrl, isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./supabase-config";

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
