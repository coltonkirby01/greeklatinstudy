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
const WHITAKER_MODULE_URL = `https://esm.sh/whitakers-words@${WHITAKER_VERSION}?bundle`;
const WHITAKER_DATA_BASE = `https://cdn.jsdelivr.net/npm/whitakers-words@${WHITAKER_VERSION}/data`;
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

async function loadText(url: string, cache: Cache | null) {
  const cached = await cache?.match(url);
  if (cached) return cached.text();

  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) throw new Error(`Could not load the inline Latin dictionary data (${response.status}).`);
  await cache?.put(url, response.clone()).catch(() => undefined);
  return response.text();
}

async function loadWhitakerEngine() {
  if (enginePromise) return enginePromise;

  enginePromise = (async () => {
    const module = await import(/* @vite-ignore */ WHITAKER_MODULE_URL) as unknown as WhitakerModule;
    if (!module?.WordsEngine?.create || !module.dictionaryForm) {
      throw new Error("The inline Latin dictionary library loaded incorrectly.");
    }

    const cache = await openCache();
    const [dictGen, dictSup, inflects, addons, uniques] = await Promise.all([
      loadText(`${WHITAKER_DATA_BASE}/DICTLINE.GEN`, cache),
      loadText(`${WHITAKER_DATA_BASE}/DICTLINE.SUP`, cache),
      loadText(`${WHITAKER_DATA_BASE}/INFLECTS.LAT`, cache),
      loadText(`${WHITAKER_DATA_BASE}/ADDONS.LAT`, cache),
      loadText(`${WHITAKER_DATA_BASE}/UNIQUES.LAT`, cache),
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
