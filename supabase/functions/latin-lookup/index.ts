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
]);

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
};

type LookupMatch = {
  headword: string;
  definition: string;
  source: string;
  sourceRef: string;
  morphology?: string[];
};

type ParsedGroup = {
  analyses: string[];
  headword: string;
  definitions: string[];
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

function extractWordsOutput(html: string) {
  const preBlocks = [...html.matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi)]
    .map((match) => decodeHtml(match[1].replace(/<[^>]+>/g, "")))
    .map((text) => text.trim())
    .filter(Boolean);
  if (preBlocks.length) return preBlocks.sort((a, b) => b.length - a.length)[0];

  const cleaned = decodeHtml(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, "\n"),
  );
  const lines = cleaned.split(/\r?\n/).map((line) => line.trimEnd());
  const start = lines.findIndex((line) => /^\s*\S+\s{2,}(?:N|V|VPAR|ADJ|ADV|PREP|CONJ|INTERJ|PRON|PACK|NUM|SUPINE)\s+/.test(line));
  return start >= 0 ? lines.slice(start).join("\n").trim() : "";
}

function analysisParts(line: string) {
  const match = line.match(/^\s*(\S+)\s{2,}([A-Z]+)\s+(.+)$/);
  if (!match || !partsOfSpeech.has(match[2])) return null;
  return { pos: match[2], rest: match[3].trim().split(/\s+/) };
}

function headwordParts(line: string) {
  const match = line.match(/^\s*(.+?)\s{2,}(N|V|VPAR|ADJ|ADV|PREP|CONJ|INTERJ|PRON|PACK|NUM|SUPINE)\b(.*)$/);
  if (!match || analysisParts(line)) return null;
  return { headword: `${match[1].trim()}  ${match[2]}${match[3]}`.trim() };
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
    if (!trimmed || /^MORE\b/i.test(trimmed) || /^\*$/.test(trimmed)) continue;

    if (analysisParts(line)) {
      if (current?.definitions.length) finish();
      pendingAnalyses.push(line);
      continue;
    }

    const headword = headwordParts(line);
    if (headword) {
      if (current) finish();
      current = { analyses: pendingAnalyses, headword: headword.headword, definitions: [] };
      pendingAnalyses = [];
      continue;
    }

    if (current) current.definitions.push(trimmed);
  }
  finish();
  return groups;
}

function humanizeAnalysis(line: string) {
  const parsed = analysisParts(line);
  if (!parsed) return line.trim();
  const tokens = parsed.rest.filter((token) => !/^\d+$/.test(token));
  const labels = tokens
    .map((token) => labelMap[token] ?? (/^[123]$/.test(token) ? `${token}${token === "1" ? "st" : token === "2" ? "nd" : "rd"} person` : null))
    .filter((value): value is string => Boolean(value));

  if (parsed.pos === "V" && tokens.length >= 5) {
    const person = tokens.find((token) => /^[123]$/.test(token));
    const number = tokens.find((token) => token === "S" || token === "P");
    const tense = tokens.find((token) => ["PRES", "IMPF", "FUT", "PERF", "PLUP", "FUTP"].includes(token));
    const voice = tokens.find((token) => token === "ACTIVE" || token === "PASSIVE");
    const mood = tokens.find((token) => ["IND", "SUB", "IMP", "INF"].includes(token));
    const pieces = [
      posMap[parsed.pos],
      tense ? labelMap[tense] : null,
      voice ? labelMap[voice] : null,
      mood ? labelMap[mood] : null,
      person ? `${person}${person === "1" ? "st" : person === "2" ? "nd" : "rd"} person` : null,
      number ? labelMap[number] : null,
    ].filter(Boolean);
    return pieces.join(" · ");
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

function toMatches(text: string): LookupMatch[] {
  const output: LookupMatch[] = [];
  const seen = new Set<string>();

  for (const group of parseGroups(text)) {
    const definition = group.definitions.join(" ").replace(/\s+/g, " ").trim();
    if (!definition) continue;
    const morphology = [...new Set(group.analyses.map(humanizeAnalysis).filter(Boolean))];
    const key = `${group.headword}\u0000${definition}\u0000${morphology.join("|")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push({
      headword: group.headword,
      definition,
      morphology,
      source: "Whitaker's Words Online",
      sourceRef: "Whitaker's Words Online · latin-words.com",
    });
  }
  return output.slice(0, 12);
}

async function fetchLatinWords(word: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const url = `${LATIN_WORDS_BASE}/word/latin/${encodeURIComponent(word)}`;
    const response = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "GreekLatinStudy Translation Helper (latin-words.com lookup)",
      },
      signal: controller.signal,
    });
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`latin-words.com returned HTTP ${response.status}`);
    const text = extractWordsOutput(await response.text());
    if (!text) return [];
    return toMatches(text);
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
    return json({ word: surface, normalized: word, matches: cached.matches, cached: true, source: LATIN_WORDS_BASE });
  }

  try {
    const matches = await fetchLatinWords(word);
    memoryCache.set(word, { expiresAt: Date.now() + CACHE_MS, matches });
    return json({ word: surface, normalized: word, matches, source: LATIN_WORDS_BASE });
  } catch (error) {
    console.error("latin-words.com lookup failed", error);
    return json({ error: "Whitaker's Words Online is temporarily unavailable." }, 502, 30);
  }
});
