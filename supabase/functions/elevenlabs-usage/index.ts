import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function parseNamedKeys(raw: string | undefined) {
  if (!raw) return {} as Record<string, string>;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  } catch {
    return {};
  }
}

function publishableKeys() {
  const values = Object.values(parseNamedKeys(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS"))).map((value) => value.trim()).filter(Boolean);
  const legacy = Deno.env.get("SUPABASE_ANON_KEY")?.trim();
  if (legacy) values.push(legacy);
  return [...new Set(values)];
}

function serviceKey() {
  const secretKeys = parseNamedKeys(Deno.env.get("SUPABASE_SECRET_KEYS"));
  return secretKeys.default?.trim() || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() || "";
}

function suppliedProjectKey(request: Request) {
  const value = request.headers.get("apikey")?.trim() || "";
  return publishableKeys().includes(value) ? value : "";
}

type Subscription = {
  tier?: string;
  status?: string;
  character_count?: number;
  character_limit?: number;
  next_character_count_reset_unix?: number | null;
  billing_period?: string | null;
  character_refresh_period?: string | null;
  current_overage?: { amount?: string; currency?: string } | null;
};

type Usage = {
  tier: string;
  status: string;
  creditsUsed: number;
  creditsLimit: number;
  creditsRemaining: number;
  percentUsed: number;
  nextResetUnix: number | null;
  billingPeriod: string | null;
  refreshPeriod: string | null;
  currentOverage: { amount: string; currency: string } | null;
  updatedAt: string;
};

class ElevenLabsLookupError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

function safeInteger(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

function normalizeUsage(subscription: Subscription): Usage {
  const creditsUsed = safeInteger(subscription.character_count);
  const creditsLimit = safeInteger(subscription.character_limit);
  const updatedAt = new Date().toISOString();
  return {
    tier: typeof subscription.tier === "string" ? subscription.tier : "unknown",
    status: typeof subscription.status === "string" ? subscription.status : "unknown",
    creditsUsed,
    creditsLimit,
    creditsRemaining: Math.max(0, creditsLimit - creditsUsed),
    percentUsed: creditsLimit > 0 ? Math.min(100, Math.max(0, (creditsUsed / creditsLimit) * 100)) : 0,
    nextResetUnix: typeof subscription.next_character_count_reset_unix === "number" ? subscription.next_character_count_reset_unix : null,
    billingPeriod: typeof subscription.billing_period === "string" ? subscription.billing_period : null,
    refreshPeriod: typeof subscription.character_refresh_period === "string" ? subscription.character_refresh_period : null,
    currentOverage: subscription.current_overage ? {
      amount: typeof subscription.current_overage.amount === "string" ? subscription.current_overage.amount : "0",
      currency: typeof subscription.current_overage.currency === "string" ? subscription.current_overage.currency : "usd",
    } : null,
    updatedAt,
  };
}

async function isAdmin(request: Request, supabaseUrl: string, projectKey: string) {
  const authorization = request.headers.get("Authorization")?.trim();
  if (!authorization?.startsWith("Bearer ")) return false;
  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: authorization, apikey: projectKey },
  });
  if (!userResponse.ok) return false;
  const user = await userResponse.json() as { id?: string };
  if (!user.id) return false;

  const url = new URL(`${supabaseUrl}/rest/v1/admin_users`);
  url.searchParams.set("user_id", `eq.${user.id}`);
  url.searchParams.set("select", "user_id");
  url.searchParams.set("limit", "1");
  const adminResponse = await fetch(url, { headers: { Authorization: authorization, apikey: projectKey } });
  if (!adminResponse.ok) return false;
  const rows = await adminResponse.json() as Array<{ user_id?: string }>;
  return rows[0]?.user_id === user.id;
}

async function saveSnapshot(supabaseUrl: string, key: string, usage: Usage) {
  const response = await fetch(`${supabaseUrl}/rest/v1/elevenlabs_usage_snapshot?on_conflict=id`, {
    method: "POST",
    headers: {
      apikey: key,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      id: "current",
      tier: usage.tier,
      status: usage.status,
      credits_used: usage.creditsUsed,
      credits_limit: usage.creditsLimit,
      next_reset_unix: usage.nextResetUnix,
      billing_period: usage.billingPeriod,
      refresh_period: usage.refreshPeriod,
      current_overage_amount: usage.currentOverage?.amount ?? null,
      current_overage_currency: usage.currentOverage?.currency ?? null,
      updated_at: usage.updatedAt,
    }),
  });
  if (!response.ok) throw new Error(`Could not save ElevenLabs usage snapshot: ${await response.text()}`);
}

async function loadUsage(apiKey: string) {
  const response = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
    headers: { "xi-api-key": apiKey, Accept: "application/json" },
  });
  if (!response.ok) {
    const detail = await response.text();
    if (response.status === 401 && /user_read|missing_permissions/i.test(detail)) {
      throw new ElevenLabsLookupError(
        "missing_user_read",
        "The ElevenLabs API key can generate speech but cannot read subscription usage. In ElevenLabs, open Developers → API Keys → More Actions (…) → Edit, then enable User: Read for this key.",
      );
    }
    throw new Error(`ElevenLabs subscription lookup failed: ${response.status} ${detail}`);
  }
  return normalizeUsage(await response.json() as Subscription);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const projectKey = suppliedProjectKey(request);
  if (!projectKey) return json({ error: "Invalid project API key." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim() || "";
  const key = serviceKey();
  const apiKey = Deno.env.get("ELEVENLABS_API_KEY")?.trim() || "";
  if (!supabaseUrl || !key) return json({ error: "Supabase service credentials are unavailable." }, 500);
  if (!apiKey) return json({ error: "ELEVENLABS_API_KEY is not configured." }, 503);

  try {
    if (!await isAdmin(request, supabaseUrl, projectKey)) return json({ error: "Administrator access required." }, 403);
    const usage = await loadUsage(apiKey);
    await saveSnapshot(supabaseUrl, key, usage);
    return json({ ok: true, usage });
  } catch (error) {
    if (error instanceof ElevenLabsLookupError) return json({ ok: false, code: error.code, error: error.message });
    return json({ error: error instanceof Error ? error.message : String(error) }, 502);
  }
});
