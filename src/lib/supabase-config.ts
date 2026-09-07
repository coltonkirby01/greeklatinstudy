export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function appUrl(path = "") {
  const base = import.meta.env.BASE_URL.replace(/^\//, "");
  return new URL(`${base}${path.replace(/^\//, "")}`, window.location.origin).toString();
}
