import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { appUrl, isSupabaseConfigured } from "../../lib/supabase-config";

type AuthContextValue = { configured: boolean; loading: boolean; session: Session | null; user: User | null; isAdmin: boolean; recoveryMode: boolean; signInWithPassword(email: string, password: string): Promise<void>; signUp(email: string, password: string): Promise<void>; signInWithGoogle(): Promise<void>; sendPasswordReset(email: string): Promise<void>; updatePassword(password: string): Promise<void>; signOut(): Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);
type SupabaseModule = typeof import("../../lib/supabase");
let supabaseModulePromise: Promise<SupabaseModule> | null = null;

function loadSupabaseModule() {
  supabaseModulePromise ??= import("../../lib/supabase");
  return supabaseModulePromise;
}

async function requireSupabase() {
  const { supabase } = await loadSupabaseModule();
  if (!supabase) throw new Error("Cloud accounts have not been connected yet.");
  return supabase;
}

async function readAdmin(user: User | null) {
  if (!user || !isSupabaseConfigured) return false;
  const { supabase } = await loadSupabaseModule();
  if (!supabase) return false;
  const { data, error } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  return !error && data?.user_id === user.id;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null), [isAdmin, setIsAdmin] = useState(false), [loading, setLoading] = useState(isSupabaseConfigured), [recoveryMode, setRecoveryMode] = useState(false);
  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    let active = true;
    let unsubscribe: (() => void) | null = null;
    void loadSupabaseModule().then(({ supabase }) => {
      if (!active || !supabase) { if (active) setLoading(false); return; }
      void supabase.auth.getSession().then(async ({ data }) => {
        if (!active) return;
        setSession(data.session);
        const admin = await readAdmin(data.session?.user ?? null);
        if (!active) return;
        setIsAdmin(admin);
        setLoading(false);
      });
      const { data: listener } = supabase.auth.onAuthStateChange((event, next) => {
        if (!active) return;
        setSession(next);
        setRecoveryMode(event === "PASSWORD_RECOVERY");
        void readAdmin(next?.user ?? null).then((admin) => { if (active) setIsAdmin(admin); });
      });
      unsubscribe = () => listener.subscription.unsubscribe();
    }).catch(() => { if (active) setLoading(false); });
    return () => { active = false; unsubscribe?.(); };
  }, []);
  const signInWithPassword = useCallback(async (email: string, password: string) => { const supabase = await requireSupabase(); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; }, []);
  const signUp = useCallback(async (email: string, password: string) => { const supabase = await requireSupabase(); const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: appUrl("account") } }); if (error) throw error; }, []);
  const signInWithGoogle = useCallback(async () => { const supabase = await requireSupabase(); const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: appUrl("account") } }); if (error) throw error; }, []);
  const sendPasswordReset = useCallback(async (email: string) => { const supabase = await requireSupabase(); const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: appUrl("account?reset=1") }); if (error) throw error; }, []);
  const updatePassword = useCallback(async (password: string) => { const supabase = await requireSupabase(); const { error } = await supabase.auth.updateUser({ password }); if (error) throw error; setRecoveryMode(false); }, []);
  const signOut = useCallback(async () => { if (!isSupabaseConfigured) return; const supabase = await requireSupabase(); const { error } = await supabase.auth.signOut(); if (error) throw error; }, []);
  const value = useMemo<AuthContextValue>(() => ({ configured: isSupabaseConfigured, loading, session, user: session?.user ?? null, isAdmin, recoveryMode, signInWithPassword, signUp, signInWithGoogle, sendPasswordReset, updatePassword, signOut }), [isAdmin, loading, recoveryMode, session, signInWithPassword, signUp, signInWithGoogle, sendPasswordReset, updatePassword, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error("useAuth must be used within AuthProvider."); return context; }
