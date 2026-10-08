import type { DictionaryMatch } from "./dictionary-sources";

type WhitakerDictionaryEntry = {
  mean: string;
  [key: string]: unknown;
};

type WhitakerParseResult = {
  entryIndex: number;
  de: WhitakerDictionaryEntry;
};

type WhitakerAnalysis = {
  results: readonly WhitakerParseResult[];
  trickResults?: readonly WhitakerParseResult[];
  uniqueResults?: readonly { de: WhitakerDictionaryEntry }[];
  addonResults?: readonly { baseResults: readonly WhitakerParseResult[] }[];
};

type WhitakerEngine = {
  dictionarySize: number;
  parseWord(word: string): WhitakerAnalysis;
};

type WhitakerModule = {
  WordsEngine: {
    create(data: { dictline: string; inflects: string; addons: string; uniques: string }): WhitakerEngine;
  };
  dictionaryForm(entry: WhitakerDictionaryEntry): string;
};

const WHITAKER_VERSION = "0.1.2";
const WHITAKER_MODULE_URLS = [
  `https://cdn.jsdelivr.net/npm/whitakers-words@${WHITAKER_VERSION}/+esm`,
  `https://esm.sh/whitakers-words@${WHITAKER_VERSION}?bundle`,
] as const;
const WHITAKER_DATA_BASES = [
  `https://cdn.jsdelivr.net/npm/whitakers-words@${WHITAKER_VERSION}/data`,
  `https://unpkg.com/whitakers-words@${WHITAKER_VERSION}/data`,
] as const;
const WHITAKER_CACHE = `translation-helper-whitakers-${WHITAKER_VERSION}`;

let enginePromise: Promise<{ engine: WhitakerEngine; dictionaryForm: WhitakerModule["dictionaryForm"] }> | null = null;

function normalizeLatinSurface(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLocaleLowerCase()
    .replace(/æ/g, "ae")
    .replace(/œ/g, "oe")
    .replace(/[^a-z]/g, "");
}

async function openCache() {
  if (!("caches" in globalThis)) return null;
  try {
    return await caches.open(WHITAKER_CACHE);
  } catch {
    return null;
  }
}

async function loadModule() {
  let lastError: unknown = null;
  for (const url of WHITAKER_MODULE_URLS) {
    try {
      const module = await import(/* @vite-ignore */ url) as unknown as WhitakerModule;
      if (module?.WordsEngine?.create && module.dictionaryForm) return module;
      lastError = new Error(`Dictionary module from ${new URL(url).hostname} was missing required exports.`);
    } catch (error) {
      lastError = error;
    }
  }

  const detail = lastError instanceof Error ? ` ${lastError.message}` : "";
  throw new Error(`The inline Latin dictionary library could not be loaded.${detail}`);
}

async function loadText(url: string, cache: Cache | null) {
  const cached = await cache?.match(url);
  if (cached) return cached.text();

  const response = await fetch(url, { mode: "cors", cache: "force-cache" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  await cache?.put(url, response.clone()).catch(() => undefined);
  return response.text();
}

async function loadDataFile(fileName: string, cache: Cache | null) {
  let lastError: unknown = null;
  for (const base of WHITAKER_DATA_BASES) {
    const url = `${base}/${fileName}`;
    try {
      return await loadText(url, cache);
    } catch (error) {
      lastError = error;
    }
  }

  const detail = lastError instanceof Error ? ` ${lastError.message}` : "";
  throw new Error(`Could not load ${fileName} for the inline Latin dictionary.${detail}`);
}

async function loadWhitakerEngine() {
  if (enginePromise) return enginePromise;

  enginePromise = (async () => {
    const module = await loadModule();
    const cache = await openCache();
    const [dictGen, dictSup, inflects, addons, uniques] = await Promise.all([
      loadDataFile("DICTLINE.GEN", cache),
      loadDataFile("DICTLINE.SUP", cache),
      loadDataFile("INFLECTS.LAT", cache),
      loadDataFile("ADDONS.LAT", cache),
      loadDataFile("UNIQUES.LAT", cache),
    ]);

    const engine = module.WordsEngine.create({
      dictline: `${dictGen}\n${dictSup}`,
      inflects,
      addons,
      uniques,
    });
    return { engine, dictionaryForm: module.dictionaryForm };
  })().catch((error) => {
    enginePromise = null;
    throw error;
  });

  return enginePromise;
}

function addEntry(
  output: DictionaryMatch[],
  seen: Set<string>,
  entry: WhitakerDictionaryEntry,
  dictionaryForm: WhitakerModule["dictionaryForm"],
) {
  const definition = entry.mean?.trim();
  if (!definition) return;
  const headword = dictionaryForm(entry).trim() || "Latin dictionary entry";
  const key = `${headword}\u0000${definition}`;
  if (seen.has(key)) return;
  seen.add(key);
  output.push({
    headword,
    definition,
    source: "Whitaker's Words",
    sourceRef: "Whitaker's Words — inline Latin dictionary and form analyzer",
  });
}

export async function lookupWhitakersWord(surface: string): Promise<DictionaryMatch[]> {
  const word = normalizeLatinSurface(surface);
  if (!word) return [];

  const { engine, dictionaryForm } = await loadWhitakerEngine();
  const analysis = engine.parseWord(word);
  const output: DictionaryMatch[] = [];
  const seen = new Set<string>();

  const standardResults = [
    ...(analysis.results ?? []),
    ...(analysis.trickResults ?? []),
    ...(analysis.addonResults ?? []).flatMap((result) => result.baseResults ?? []),
  ];
  for (const result of standardResults) addEntry(output, seen, result.de, dictionaryForm);
  for (const result of analysis.uniqueResults ?? []) addEntry(output, seen, result.de, dictionaryForm);

  return output.slice(0, 12);
}
