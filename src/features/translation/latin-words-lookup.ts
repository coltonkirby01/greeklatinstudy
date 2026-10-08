import type { DictionaryMatch } from "./dictionary-sources";

type ProxyPayload = {
  matches?: unknown;
  error?: unknown;
};

const CACHE_PREFIX = "translation-helper-latin-words-v2:";
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
    && typeof candidate.source === "string"
    && (candidate.morphology === undefined || (Array.isArray(candidate.morphology) && candidate.morphology.every((item) => typeof item === "string")));
}

function normalizeMatches(payload: ProxyPayload) {
  if (!Array.isArray(payload.matches)) return [];
  return payload.matches.filter(isDictionaryMatch);
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
    const matches = parsed.matches.filter(isDictionaryMatch);
    if (!matches.length) {
      localStorage.removeItem(`${CACHE_PREFIX}${word}`);
      return null;
    }
    return matches;
  } catch {
    return null;
  }
}

function writePersistentCache(word: string, matches: DictionaryMatch[]) {
  if (typeof localStorage === "undefined" || !matches.length) return;
  try {
    localStorage.setItem(`${CACHE_PREFIX}${word}`, JSON.stringify({
      expiresAt: Date.now() + CACHE_TTL_MS,
      matches,
    }));
  } catch {
    // Storage can be unavailable in private/restricted browsing. Lookup still works.
  }
}

async function fetchJson(url: string, apiKey: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        apikey: apiKey,
      },
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? `: ${payload.error}`
        : "";
      throw new Error(`HTTP ${response.status}${detail}`);
    }
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

export async function lookupLatinWords(surface: string): Promise<DictionaryMatch[]> {
  const word = normalizeLatinSurface(surface);
  if (!word) return [];

  const memory = memoryCache.get(word);
  if (memory) return memory;
  const persisted = readPersistentCache(word);
  if (persisted) {
    memoryCache.set(word, persisted);
    return persisted;
  }

  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "");
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!supabaseUrl || !supabaseAnonKey) throw new Error("The Whitaker's Words lookup service is not configured.");
  const payload = await fetchJson(`${supabaseUrl}/functions/v1/latin-lookup?word=${encodeURIComponent(word)}`, supabaseAnonKey);
  if (!payload || typeof payload !== "object") return [];
  const proxy = payload as ProxyPayload;
  if (typeof proxy.error === "string") throw new Error(proxy.error);

  const matches = normalizeMatches(proxy);
  if (matches.length) {
    memoryCache.set(word, matches);
    writePersistentCache(word, matches);
  }
  return matches;
}
