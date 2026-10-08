import type { DictionaryMatch } from "./dictionary-sources";

type ProviderTranslation = {
  forms?: unknown;
  definitions?: unknown;
};

type ProviderPayload = {
  translations?: unknown;
  data?: { translations?: unknown };
};

type ProxyPayload = {
  matches?: unknown;
  error?: unknown;
};

const DIRECT_PROVIDER_URLS = [
  "https://latin.30twelve.org",
  "https://latin.71m.us",
] as const;
const CACHE_PREFIX = "translation-helper-latin-lookup-v2:";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const memoryCache = new Map<string, DictionaryMatch[]>();

function normalizeLatinSurface(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLocaleLowerCase()
    .replace(/æ/g, "ae")
    .replace(/œ/g, "oe")
    .replace(/[^a-z]/g, "");
}

function isDictionaryMatch(value: unknown): value is DictionaryMatch {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.headword === "string"
    && typeof candidate.definition === "string"
    && typeof candidate.source === "string";
}

function normalizeProxyMatches(payload: ProxyPayload) {
  if (!Array.isArray(payload.matches)) return [];
  return payload.matches.filter(isDictionaryMatch).slice(0, 12);
}

function providerMatches(payload: ProviderPayload): DictionaryMatch[] {
  const translations = Array.isArray(payload.translations)
    ? payload.translations
    : Array.isArray(payload.data?.translations)
      ? payload.data.translations
      : [];

  const output: DictionaryMatch[] = [];
  const seen = new Set<string>();
  for (const raw of translations as ProviderTranslation[]) {
    const forms = Array.isArray(raw?.forms)
      ? raw.forms.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      : [];
    const definitions = Array.isArray(raw?.definitions)
      ? raw.definitions.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
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

function readPersistentCache(word: string) {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${word}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { expiresAt?: unknown; matches?: unknown };
    if (typeof parsed.expiresAt !== "number" || parsed.expiresAt < Date.now() || !Array.isArray(parsed.matches)) {
      localStorage.removeItem(`${CACHE_PREFIX}${word}`);
      return null;
    }
    const matches = parsed.matches.filter(isDictionaryMatch).slice(0, 12);
    return matches;
  } catch {
    return null;
  }
}

function writePersistentCache(word: string, matches: DictionaryMatch[]) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(`${CACHE_PREFIX}${word}`, JSON.stringify({
      expiresAt: Date.now() + CACHE_TTL_MS,
      matches,
    }));
  } catch {
    // Storage can be unavailable in private/restricted browsing. Lookup still works.
  }
}

async function fetchJson(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (response.status === 404) return { response, payload: null };
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? `: ${payload.error}`
        : "";
      throw new Error(`HTTP ${response.status}${detail}`);
    }
    return { response, payload };
  } finally {
    clearTimeout(timeout);
  }
}

async function lookupThroughSiteBackend(word: string) {
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "");
  if (!supabaseUrl) throw new Error("The site dictionary service is not configured.");
  const { payload } = await fetchJson(`${supabaseUrl}/functions/v1/latin-lookup?word=${encodeURIComponent(word)}`);
  if (!payload || typeof payload !== "object") return [];
  const proxy = payload as ProxyPayload;
  if (typeof proxy.error === "string") throw new Error(proxy.error);
  return normalizeProxyMatches(proxy);
}

async function lookupDirectly(word: string) {
  let lastError: unknown = null;
  for (const base of DIRECT_PROVIDER_URLS) {
    try {
      const { response, payload } = await fetchJson(`${base}/latin/${encodeURIComponent(word)}`);
      if (response.status === 404) return [];
      if (!payload || typeof payload !== "object") return [];
      return providerMatches(payload as ProviderPayload);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("The Latin dictionary provider could not be reached.");
}

/**
 * Broad Latin fallback used after the local Dickinson dictionary misses.
 *
 * The browser no longer downloads a third-party JavaScript engine or multi-megabyte
 * dictionary files. Lookup goes through our Supabase edge function first; if that
 * service is temporarily unavailable, the browser tries the public JSON API directly.
 */
export async function lookupWhitakersWord(surface: string): Promise<DictionaryMatch[]> {
  const word = normalizeLatinSurface(surface);
  if (!word) return [];

  const memory = memoryCache.get(word);
  if (memory) return memory;
  const persisted = readPersistentCache(word);
  if (persisted) {
    memoryCache.set(word, persisted);
    return persisted;
  }

  let matches: DictionaryMatch[];
  let backendError: unknown = null;
  try {
    matches = await lookupThroughSiteBackend(word);
  } catch (error) {
    backendError = error;
    try {
      matches = await lookupDirectly(word);
    } catch (directError) {
      const backendMessage = backendError instanceof Error ? backendError.message : "site lookup failed";
      const directMessage = directError instanceof Error ? directError.message : "direct lookup failed";
      throw new Error(`Latin lookup failed through both the site service and its backup provider. ${backendMessage}; ${directMessage}`);
    }
  }

  memoryCache.set(word, matches);
  writePersistentCache(word, matches);
  return matches;
}
