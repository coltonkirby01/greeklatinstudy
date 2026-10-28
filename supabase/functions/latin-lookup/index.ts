const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const LATIN_WORDS_BASE = "https://latin-words.com";
const memoryCache = new Map<string, { expiresAt: number; matches: LookupMatch[] }>();
const CACHE_MS = 24 * 60 * 60 * 1000;

const partsOfSpeech = new Set([
  "N", "V", "VPAR", "ADJ", "ADV", "PREP", "CONJ", "INTERJ", "PRON", "PACK", "NUM", "SUPINE",
  "TACKON", "PREFIX", "SUFFIX",
]);
const modifierPartsOfSpeech = new Set(["TACKON", "PREFIX", "SUFFIX"]);
// X marks a valid Whitaker special/unique lexical entry (common for pronouns).
const posPattern = "N|V|VPAR|ADJ|ADV|PREP|CONJ|INTERJ|PRON|PACK|NUM|SUPINE|TACKON|PREFIX|SUFFIX|X";

const labelMap: Record<string, string> = {
  NOM: "nominative", GEN: "genitive", DAT: "dative", ACC: "accusative", ABL: "ablative", VOC: "vocative", LOC: "locative",
  S: "singular", P: "plural",
  M: "masculine", F: "feminine", N: "neuter", C: "common gender", X: "gender unspecified",
  PRES: "present", IMPF: "imperfect", FUT: "future", PERF: "perfect", PLUP: "pluperfect", FUTP: "future perfect",
  ACTIVE: "active", PASSIVE: "passive",
  IND: "indicative", SUB: "subjunctive", IMP: "imperative", INF: "infinitive", PPL: "participle",
  POS: "positive", COMP: "comparative", SUPER: "superlative",
};

const posMap: Record<string, string> = {
  N: "noun", V: "verb", VPAR: "participle", ADJ: "adjective", ADV: "adverb", PREP: "preposition",
  CONJ: "conjunction", INTERJ: "interjection", PRON: "pronoun", PACK: "pronoun", NUM: "numeral", SUPINE: "supine",
  TACKON: "enclitic", PREFIX: "prefix", SUFFIX: "suffix",
};

const ageMap: Record<string, string> = {
  X: "All periods / unknown",
  A: "Archaic — very early; obsolete by classical times",
  B: "Early Latin — pre-classical",
  C: "Classical — approximately 150 BC to AD 200",
  D: "Late Latin — 3rd to 5th centuries",
  E: "Later Latin — 6th to 10th centuries; Christian",
  F: "Medieval — 11th to 15th centuries",
  G: "Scholarly / scientific Latin — 16th to 18th centuries",
  H: "Modern — 19th to 20th centuries",
};

const areaMap: Record<string, string> = {
  X: "General / none specified",
  A: "Agriculture, flora, fauna, land, equipment, rural life",
  B: "Biology, medicine, body parts",
  D: "Drama, music, theater, art, painting, sculpture",
  E: "Ecclesiastical, Biblical, religious",
  G: "Grammar, rhetoric, logic, literature, schools",
  L: "Legal, government, tax, financial, political, titles",
  P: "Poetic",
  S: "Science, philosophy, mathematics, units and measures",
  T: "Technical, architecture, topography, surveying",
  W: "War, military, naval, ships, armor",
  Y: "Mythology",
};

const geographyMap: Record<string, string> = {
  X: "General / none specified",
  A: "Africa",
  B: "Britain",
  C: "China",
  D: "Scandinavia",
  E: "Egypt",
  F: "France / Gaul",
  G: "Germany",
  H: "Greece",
  I: "Italy / Rome",
  J: "India",
  K: "Balkans",
  N: "Netherlands",
  P: "Persia",
  Q: "Near East",
  R: "Russia",
  S: "Spain / Iberia",
  U: "Eastern Europe",
};

const frequencyMap: Record<string, string> = {
  X: "Unknown / unspecified",
  A: "Very frequent",
  B: "Frequent",
  C: "Common",
  D: "Lesser frequency",
  E: "Uncommon",
  F: "Very rare",
  I: "Only citation is an inscription",
  M: "Graffiti",
  N: "Only dictionary citation is Pliny's Natural History",
};

const sourceMap: Record<string, string> = {
  X: "General / unknown source",
  A: "Source code A — undocumented",
  B: "C. H. Beeson, A Primer of Medieval Latin (1925)",
  C: "Charles Beard, Cassell's Latin Dictionary (1892)",
  D: "J. N. Adams, Latin Sexual Vocabulary (1982)",
  E: "L. F. Stelten, Dictionary of Ecclesiastical Latin (1995)",
  F: "Roy J. Deferrari, Dictionary of St. Thomas Aquinas (1960)",
  G: "Gildersleeve & Lodge, Latin Grammar (1895)",
  H: "Collatinus Dictionary by Yves Ouvrard",
  I: "F. P. Leverett, Lexicon of the Latin Language (1845)",
  J: "Source code J — undocumented",
  K: "Calepinus Novus, modern Latin, by Guy Licoppe",
  L: "C. S. Lewis, Elementary Latin Dictionary (1891)",
  M: "Latham, Revised Medieval Word List (1980)",
  N: "Lynn Nelson, Wordlist",
  O: "Oxford Latin Dictionary (1982)",
  P: "Souter, A Glossary of Later Latin to 600 A.D. (1949)",
  Q: "Other cited or unspecified dictionaries",
  R: "Plater & White, A Grammar of the Vulgate (1926)",
  S: "Lewis and Short, A Latin Dictionary (1879)",
  T: "Found in a translation; no dictionary reference",
  U: "Du Cange",
  V: "Vademecum in opus Saxonis — Franz Blatt",
  W: "Whitaker's personal guess",
  Y: "Temporary special code",
  Z: "Sent by a user; no dictionary reference",
};

type WhitakerMetadata = {
  partOfSpeech?: string;
  dictionaryDetails?: string;
  code?: string;
  age?: string;
  area?: string;
  geography?: string;
  frequency?: string;
  dictionarySource?: string;
  rawEntry?: string;
  rawAnalyses?: string[];
};

type LookupMatch = {
  headword: string;
  definition: string;
  source: string;
  sourceRef: string;
  morphology?: string[];
  whitaker?: WhitakerMetadata;
};

type ParsedGroup = {
  analyses: string[];
  headword: string;
  definitions: string[];
  modifier: boolean;
  pos: string;
  dictionaryDetails: string;
  code?: string;
  rawEntry: string;
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

function configuredPublishableKeys() {
  const raw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (!raw) return [] as string[];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed.filter((value): value is string => typeof value === "string");
    if (parsed && typeof parsed === "object") {
      return Object.values(parsed as Record<string, unknown>).filter((value): value is string => typeof value === "string");
    }
  } catch {
    // Fall through to the legacy anon-key compatibility check below.
  }
  return [] as string[];
}

function hasValidProjectKey(req: Request) {
  const supplied = req.headers.get("apikey");
  if (!supplied) return false;
  const legacyAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  return configuredPublishableKeys().includes(supplied) || Boolean(legacyAnonKey && supplied === legacyAnonKey);
}

async function requestedWord(req: Request) {
  if (req.method === "GET") return new URL(req.url).searchParams.get("word") ?? "";
  if (req.method === "POST") {
    const payload = await req.json().catch(() => ({}));
    return typeof payload?.word === "string" ? payload.word : "";
  }
  return "";
}

function decodeHtml(value: string) {
  return value
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function containsWordsOutput(text: string) {
  const posLine = new RegExp(`\\s{2,}(?:${posPattern})\\b`);
  return text.split(/\r?\n/).some((line) => posLine.test(line));
}

function extractWordsOutput(html: string) {
  const preBlocks = [...html.matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi)]
    .map((match) => decodeHtml(match[1].replace(/<[^>]+>/g, "")))
    .map((text) => text.trim())
    .filter(Boolean);
  const resultBlocks = preBlocks.filter(containsWordsOutput);
  if (resultBlocks.length) return resultBlocks.join("\n");

  const cleaned = decodeHtml(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, "\n"),
  );
  const lines = cleaned.split(/\r?\n/).map((line) => line.trimEnd());
  const startPattern = new RegExp(`^\\s*\\S+\\s{2,}(?:${posPattern})\\b`);
  const start = lines.findIndex((line) => startPattern.test(line));
  return start >= 0 ? lines.slice(start).join("\n").trim() : "";
}

function analysisParts(line: string) {
  const match = line.match(/^\s*(\S+)\s{2,}([A-Z]+)(?:\s+(.*))?$/);
  if (!match || !partsOfSpeech.has(match[2])) return null;
  const restText = (match[3] ?? "").trim();
  if (/\[[A-Z0-9]+\]/.test(restText)) return null;
  return { pos: match[2], rest: restText ? restText.split(/\s+/) : [] };
}

function headwordParts(line: string) {
  const match = line.match(new RegExp(`^\\s*(.+?)\\s{2,}(${posPattern})\\b(.*)$`));
  if (!match) return null;
  const pos = match[2];
  const rest = match[3] ?? "";
  const modifier = modifierPartsOfSpeech.has(pos);
  const code = rest.match(/\[([A-Z0-9]+)\]/)?.[1];
  if (!modifier && !code) return null;
  const dictionaryDetails = rest.replace(/\[[A-Z0-9]+\]/g, " ").replace(/\s+/g, " ").trim();
  return {
    headword: match[1].trim(),
    pos,
    modifier,
    dictionaryDetails,
    code,
    rawEntry: line.trim(),
  };
}

function parseGroups(text: string) {
  const groups: ParsedGroup[] = [];
  let pendingAnalyses: string[] = [];
  let current: ParsedGroup | null = null;

  const finish = () => {
    if (current && (current.headword || current.definitions.length)) groups.push(current);
    current = null;
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();
    if (!trimmed || /^MORE\b/i.test(trimmed) || /^Unexpected exception in PAUSE\b/i.test(trimmed) || /^\*$/.test(trimmed)) continue;

    const headword = headwordParts(line);
    if (headword) {
      if (current) finish();
      current = {
        analyses: headword.modifier ? [line] : pendingAnalyses,
        headword: headword.headword,
        definitions: [],
        modifier: headword.modifier,
        // Whitaker's X entries inherit their grammatical part of speech
        // from the adjacent source analysis rather than an invented label.
        pos: headword.pos === "X"
          ? (pendingAnalyses.map(analysisParts).find((item) => item && item.pos !== "X")?.pos ?? "X")
          : headword.pos,
        dictionaryDetails: headword.dictionaryDetails,
        code: headword.code,
        rawEntry: headword.rawEntry,
      };
      pendingAnalyses = [];
      continue;
    }

    if (analysisParts(line)) {
      if (current?.definitions.length) finish();
      // Some Whitaker unique entries place the X headword between separate
      // analyses of the same pronoun. Keep subsequent analyses together.
      if (current && !current.definitions.length) {
        current.analyses.push(line);
      } else {
        pendingAnalyses.push(line);
      }
      continue;
    }

    if (current) current.definitions.push(trimmed);
  }
  finish();
  return groups;
}

function humanizeAnalysis(line: string) {
  const parsed = analysisParts(line);
  if (!parsed) {
    const headword = headwordParts(line);
    return headword?.modifier ? posMap[headword.pos] : line.trim();
  }
  const tokens = parsed.rest.filter((token) => !/^\d+$/.test(token));
  const labels = tokens.map((token) => labelMap[token] ?? null).filter((value): value is string => Boolean(value));

  if (parsed.pos === "V") {
    const person = parsed.rest.filter((token) => /^[123]$/.test(token)).at(-1);
    const number = tokens.find((token) => token === "S" || token === "P");
    const tense = tokens.find((token) => ["PRES", "IMPF", "FUT", "PERF", "PLUP", "FUTP"].includes(token));
    const voice = tokens.find((token) => token === "ACTIVE" || token === "PASSIVE");
    const mood = tokens.find((token) => ["IND", "SUB", "IMP", "INF"].includes(token));
    return [
      posMap[parsed.pos],
      tense ? labelMap[tense] : null,
      voice ? labelMap[voice] : null,
      mood ? labelMap[mood] : null,
      person ? `${person}${person === "1" ? "st" : person === "2" ? "nd" : "rd"} person` : null,
      number ? labelMap[number] : null,
    ].filter(Boolean).join(" · ");
  }

  if (["N", "ADJ", "PRON", "PACK", "NUM", "VPAR"].includes(parsed.pos)) {
    const grammatical = tokens
      .filter((token) => ["NOM", "GEN", "DAT", "ACC", "ABL", "VOC", "LOC", "S", "P", "M", "F", "N", "C", "X", "PRES", "IMPF", "FUT", "PERF", "PLUP", "ACTIVE", "PASSIVE", "POS", "COMP", "SUPER"].includes(token))
      .map((token) => labelMap[token])
      .filter(Boolean);
    return [posMap[parsed.pos], ...grammatical].join(" · ");
  }

  return [posMap[parsed.pos] ?? parsed.pos.toLowerCase(), ...labels].filter(Boolean).join(" · ");
}

function dictionaryMetadata(group: ParsedGroup): WhitakerMetadata {
  const code = group.code;
  return {
    partOfSpeech: posMap[group.pos] ?? group.pos.toLowerCase(),
    ...(group.dictionaryDetails ? { dictionaryDetails: group.dictionaryDetails } : {}),
    ...(code ? {
      code,
      age: ageMap[code[0]] ?? `Age code ${code[0] ?? "?"}`,
      area: areaMap[code[1]] ?? `Area code ${code[1] ?? "?"}`,
      geography: geographyMap[code[2]] ?? `Geography code ${code[2] ?? "?"}`,
      frequency: frequencyMap[code[3]] ?? `Frequency code ${code[3] ?? "?"}`,
      dictionarySource: sourceMap[code[4]] ?? `Source code ${code[4] ?? "?"}`,
    } : {}),
    rawEntry: group.rawEntry,
    rawAnalyses: group.analyses.map((line) => line.trim()).filter(Boolean),
  };
}

export function toMatches(text: string, requestedSurface?: string): LookupMatch[] {
  const output: LookupMatch[] = [];
  const seen = new Set<string>();
  const groups = parseGroups(text).sort((a, b) => Number(a.modifier) - Number(b.modifier));

  for (const group of groups) {
    // Compound retries can elicit several source-word analyses within one
    // response; discard every companion analysis before rendering or saving.
    const matchedAnalyses = requestedSurface
      ? group.analyses.filter((line) => {
          const analysis = line.match(/^\s*(\S+)\s{2,}[A-Z]+\b/);
          return analysis && normalizeLatin(analysis[1]) === normalizeLatin(requestedSurface);
        })
      : group.analyses;
    if (requestedSurface && !matchedAnalyses.length) continue;
    const sourceGroup = { ...group, analyses: matchedAnalyses };
    const definition = group.definitions.join(" ").replace(/\s+/g, " ").trim();
    if (!definition) continue;
    const morphology = [...new Set(sourceGroup.analyses.map(humanizeAnalysis).filter(Boolean))];
    const key = `${group.headword}\u0000${definition}\u0000${group.code ?? ""}\u0000${morphology.join("|")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push({
      headword: group.headword,
      definition,
      morphology,
      whitaker: dictionaryMetadata(sourceGroup),
      source: "Whitaker's Words Online",
      sourceRef: "Whitaker's Words Online · latin-words.com",
    });
  }
  return output;
}

async function fetchLatinWordsPage(query: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const url = `${LATIN_WORDS_BASE}/word/latin/${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "GreekLatinStudy Translation Helper (latin-words.com lookup)",
      },
      signal: controller.signal,
    });
    if (response.status === 404) return { output: "", explicitNotFound: true, pageText: "" };
    if (!response.ok) throw new Error(`latin-words.com returned HTTP ${response.status}`);
    const pageText = await response.text();
    return { output: extractWordsOutput(pageText), explicitNotFound: false, pageText };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchLatinWords(word: string): Promise<LookupMatch[]> {
  const direct = await fetchLatinWordsPage(word);
  const directMatches = toMatches(direct.output);
  if (directMatches.length) return directMatches;
  // The source sometimes returns an empty result for short valid words.
  // Re-query the SAME Whitaker site with an adjacent common word, which
  // can cause its input splitter to analyze the original short word.
  // Strict surface matching prevents displaying the companion's gloss.
  if (word.length <= 5 && !direct.explicitNotFound) {
    for (const combined of [`quam${word}`, `${word}sanguine`]) {
      try {
        const retry = await fetchLatinWordsPage(combined);
        const matches = toMatches(retry.output, word);
        if (matches.length) return matches;
      } catch (error) {
        // Do not mask the original result when the optional recovery attempt fails.
        console.warn("Whitaker combined-word recovery failed", error);
      }
    }
  }
  if (direct.explicitNotFound || /(?:no words found|no matches found|unknown latin word)/i.test(direct.pageText)) return [];
  // A valid HTML page without usable Whitaker analysis is not proof that
  // a Latin form is absent from the dictionary.
  throw new Error("Whitaker's Words returned no usable analysis for this form. Its online results may be incomplete.");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!hasValidProjectKey(req)) return json({ error: "Unauthorized" }, 401, 0);
  if (req.method !== "GET" && req.method !== "POST") return json({ error: "Method not allowed" }, 405, 0);

  const surface = await requestedWord(req);
  const word = normalizeLatin(surface);
  if (!word) return json({ word: surface, matches: [] });

  const cached = memoryCache.get(word);
  if (cached && cached.expiresAt > Date.now()) {
    return json({ word: surface, normalized: word, matches: cached.matches, cached: true, source: LATIN_WORDS_BASE });
  }

  try {
    const matches = await fetchLatinWords(word);
    if (matches.length) memoryCache.set(word, { expiresAt: Date.now() + CACHE_MS, matches });
    return json({ word: surface, normalized: word, matches, source: LATIN_WORDS_BASE });
  } catch (error) {
    console.error("latin-words.com lookup failed", error);
    return json({ error: error instanceof Error ? error.message : "Whitaker's Words Online is temporarily unavailable." }, 502, 30);
  }
});
