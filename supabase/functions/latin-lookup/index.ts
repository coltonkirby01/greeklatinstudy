const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const PROVIDERS = ["https://latin.30twelve.org", "https://latin.71m.us"] as const;
const memoryCache = new Map<string, { expiresAt: number; matches: LookupMatch[] }>();
const CACHE_MS = 24 * 60 * 60 * 1000;

type ProviderTranslation = {
  forms?: unknown;
  definitions?: unknown;
};

type ProviderPayload = {
  translations?: unknown;
  data?: { translations?: unknown };
};

type LookupMatch = {
  headword: string;
  definition: string;
  source: string;
  sourceRef: string;
};

function normalizeLatin(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLocaleLowerCase()
    .replace(/æ/g, "ae")
    .replace(/œ/g, "oe")
    .replace(/[^a-z]/g, "");
}

function json(body: unknown, status = 200, maxAge = 86400) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge}`,
    },
  });
}

async function requestedWord(req: Request) {
  if (req.method === "GET") return new URL(req.url).searchParams.get("word") ?? "";
  if (req.method === "POST") {
    const payload = await req.json().catch(() => ({}));
    return typeof payload?.word === "string" ? payload.word : "";
  }
  return "";
}

function toMatches(payload: ProviderPayload): LookupMatch[] {
  const raw = Array.isArray(payload?.translations)
    ? payload.translations
    : Array.isArray(payload?.data?.translations)
      ? payload.data.translations
      : [];

  const output: LookupMatch[] = [];
  const seen = new Set<string>();
  for (const item of raw as ProviderTranslation[]) {
    const forms = Array.isArray(item?.forms)
      ? item.forms.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      : [];
    const definitions = Array.isArray(item?.definitions)
      ? item.definitions.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      : [];
    if (!definitions.length) continue;

    const headword = forms.join(", ") || "Latin dictionary entry";
    for (const definition of definitions) {
      const key = `${headword}\u0000${definition}`;
      if (seen.has(key)) continue;
      seen.add(key);
      output.push({
        headword,
        definition: definition.trim(),
        source: "Whitaker's Words",
        sourceRef: "Whitaker's Words via the public Latin Translation API",
      });
    }
  }
  return output.slice(0, 12);
}

async function fetchProvider(base: string, word: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(`${base}/latin/${encodeURIComponent(word)}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`${base} returned HTTP ${response.status}`);
    return toMatches(await response.json() as ProviderPayload);
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") return json({ error: "Method not allowed" }, 405, 0);

  const surface = await requestedWord(req);
  const word = normalizeLatin(surface);
  if (!word) return json({ word: surface, matches: [] });

  const cached = memoryCache.get(word);
  if (cached && cached.expiresAt > Date.now()) {
    return json({ word: surface, normalized: word, matches: cached.matches, cached: true });
  }

  const failures: string[] = [];
  for (const provider of PROVIDERS) {
    try {
      const matches = await fetchProvider(provider, word);
      memoryCache.set(word, { expiresAt: Date.now() + CACHE_MS, matches });
      return json({ word: surface, normalized: word, matches, provider });
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
  }

  console.error("latin-lookup providers failed", failures);
  return json({ error: "The server-side Latin dictionary lookup is temporarily unavailable." }, 502, 30);
});
