import type { DeckDefinition, StudyCard } from "../features/study/types";
import { classicalGreekPronunciation } from "../features/greek/greek-pronunciation";

type GreekSourceCard = { id: string; category: string; front: string; back_title: string; back: string };
type GreekVocabularySourceCard = { id: string; greek: string; meaning: string; part_of_speech: string; lesson: number; source_ref?: string };
type GreekGrammarChartRow = { label: string; cells: string[] };
type GreekGrammarSourceCard = { id: string; category: string; prompt: string; columns: string[]; rows: GreekGrammarChartRow[]; source_ref?: string; accent_note?: string };
type LatinSourceCard = { id: string; headword: string; definition: string; partOfSpeech: string; semanticGroup: string; frequencyRank: number; deckPosition: number };
const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
async function fetchText(path: string, cache: RequestCache = "force-cache") { const response = await fetch(assetUrl(path), { cache }); if (!response.ok) throw new Error(`Could not load ${path}.`); return response.text(); }

// Groton's paradigms are displayed as complete accented forms. Keep this export
// for compatibility with existing tests/imports, but do not insert artificial
// stem-ending hyphens into source-faithful Greek forms.
export function formatGreekLesson3ParadigmCell(value: string) {
  return value;
}

export function greekLesson3ParadigmSpeechText(rows: readonly { cells: readonly string[] }[]) {
  const width = rows.reduce((max, row) => Math.max(max, row.cells.length), 0);
  const ordered: string[] = [];
  for (let column = 0; column < width; column += 1) {
    for (const row of rows) {
      const value = row.cells[column];
      if (value) ordered.push(value);
    }
  }
  return ordered
    .map((value) => value.replace(/-/g, "").replace(/\([^)]*\)/g, "").trim())
    .filter(Boolean)
    .join(", ");
}

export function parseCsv(text: string) {
  const rows: string[][] = []; let row: string[] = [], field = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) { const char = text[index]; if (quoted) { if (char === '"') { if (text[index + 1] === '"') { field += '"'; index += 1; } else quoted = false; } else field += char; } else if (char === '"') quoted = true; else if (char === ",") { row.push(field); field = ""; } else if (char === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; } else field += char; }
  if (field.length || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row); } return rows;
}

export function latinRowsToCards(rows: string[][]): LatinSourceCard[] {
  if (!rows.length) return []; const headers = rows[0].map((header) => header.trim()), column = (name: string) => headers.indexOf(name);
  const headword = column("Headword"), definition = column("Definition"), partOfSpeech = column("Part of Speech"), semanticGroup = column("Semantic Group"), frequencyRank = column("Frequency Rank");
  if ([headword, definition, partOfSpeech, semanticGroup, frequencyRank].some((index) => index < 0)) throw new Error("The Dickinson vocabulary columns could not be read.");
  return rows.slice(1).map((row, originalIndex) => ({ headword: (row[headword] || "").trim(), definition: (row[definition] || "").trim().replace(/\s+/g, " "), partOfSpeech: (row[partOfSpeech] || "").trim(), semanticGroup: (row[semanticGroup] || "").trim(), frequencyRank: Number((row[frequencyRank] || "").trim()), originalIndex })).filter((card) => card.headword && Number.isFinite(card.frequencyRank)).sort((a, b) => a.frequencyRank - b.frequencyRank || a.originalIndex - b.originalIndex).slice(0, 1_000).map((card, index) => ({ id: `${index + 1}|${card.frequencyRank}|${card.headword}`, headword: card.headword, definition: card.definition, partOfSpeech: card.partOfSpeech, semanticGroup: card.semanticGroup, frequencyRank: card.frequencyRank, deckPosition: index + 1 }));
}

let greekPromise: Promise<DeckDefinition> | null = null;
let greekLesson3VocabularyPromise: Promise<DeckDefinition> | null = null;
let greekLesson3GrammarPromise: Promise<DeckDefinition> | null = null;
let greekLesson4VocabularyPromise: Promise<DeckDefinition> | null = null;
let greekLesson4GrammarPromise: Promise<DeckDefinition> | null = null;
let latinPromise: Promise<DeckDefinition> | null = null;

export function loadGreekDeck() {
  greekPromise ??= fetchText("data/greek-cards.json").then((text) => { const source = JSON.parse(text) as GreekSourceCard[]; const cards: StudyCard[] = source.map((card, index) => { const letterCase = card.category.includes("uppercase") ? "uppercase" : card.category.includes("lowercase") ? "lowercase" : null; const studySource = card.category.startsWith("Alphabet") ? "alphabet" : card.category === "Accent marks" ? "grammar-mechanics" : "lesson-mechanics"; const sourceRef = card.category.startsWith("Alphabet") ? "Groton 1.3" : card.category === "Punctuation" ? "Groton 1.9" : "Groton 2.12"; return { id: card.id, deckId: "greek-i", front: card.front, back: `${card.back_title}\n${card.back}`, reverseFront: letterCase ? `${card.back_title} — ${letterCase}` : card.back_title, reverseBack: `${card.front}\n${card.back}`, category: card.category, rank: index + 1, metadata: { backTitle: card.back_title, lesson: card.category === "Accent marks" ? 2 : 1, studySource, sourceRef } }; }); return { id: "greek-i", slug: "greek", title: "Greek I — Lessons 1–2", eyebrow: "Alphabet · punctuation · accents", description: "Fifty-five cards covering all uppercase and lowercase letters, punctuation, and accent marks.", language: "greek", cards, supportsReverse: true, sourceNote: "Groton, From Alpha to Omega, Lessons 1–2." } satisfies DeckDefinition; }); return greekPromise;
}

export function loadGreekLesson3VocabularyDeck() {
  greekLesson3VocabularyPromise ??= fetchText("data/greek-lesson3-vocab.json").then((text) => {
    const source = JSON.parse(text) as GreekVocabularySourceCard[];
    const cards: StudyCard[] = source.map((card, index) => {
      const pronunciation = classicalGreekPronunciation(card.greek);
      return {
        id: card.id,
        deckId: "alpha-omega-lesson3-vocab",
        front: card.greek,
        back: card.meaning,
        reverseFront: card.meaning,
        reverseBack: card.greek,
        category: "Lesson 3 Vocabulary",
        rank: index + 1,
        source: "From Alpha to Omega, Lesson 3",
        notes: `${card.part_of_speech} · Pronunciation: ${pronunciation}`,
        metadata: { lesson: card.lesson, studySource: "vocabulary", partOfSpeech: card.part_of_speech, pronunciation, sourceRef: card.source_ref ?? "Groton 3.24" },
      };
    });
    return { id: "alpha-omega-lesson3-vocab", slug: "greek", title: "Greek Lesson 3 Vocabulary", eyebrow: "Lesson 3 vocabulary", description: "Eleven vocabulary entries supplied for Lesson 3, tracked separately from grammar forms.", language: "greek", cards, supportsReverse: true, sourceNote: "Groton 3.24." } satisfies DeckDefinition;
  });
  return greekLesson3VocabularyPromise;
}

export function loadGreekLesson3GrammarDeck() {
  greekLesson3GrammarPromise ??= fetchText("data/greek-lesson3-grammar.json", "no-store").then((text) => {
    const source = JSON.parse(text) as GreekGrammarSourceCard[];
    const cards: StudyCard[] = source.map((card, index) => {
      const chartRows = card.rows.map((row) => ({ ...row, cells: row.cells.map(formatGreekLesson3ParadigmCell) }));
      const sourceRef = card.category === "Present Active Indicative" ? "Groton 3.20" : card.category === "Present Active Infinitive" ? "Groton 3.21" : "Groton 3.22";
      const chartKind = card.category.endsWith("Endings") ? "Ending chart" : "Whole-paradigm chart · model verb παιδεύω";
      return {
        id: card.id,
        deckId: "alpha-omega-lesson3-grammar",
        front: card.prompt,
        back: card.category,
        category: card.category,
        rank: index + 1,
        source: "From Alpha to Omega, Lesson 3",
        notes: [chartKind, card.accent_note].filter(Boolean).join(" · "),
        metadata: {
          lesson: 3,
          studySource: "grammar-chart",
          grammarGroup: card.category,
          chartColumns: card.columns,
          chartRows,
          pronunciationText: greekLesson3ParadigmSpeechText(chartRows),
          sourceRef: card.source_ref ?? sourceRef,
        },
      };
    });
    return { id: "alpha-omega-lesson3-grammar", slug: "greek", title: "Greek Lesson 3 Grammar", eyebrow: "Present active paradigms", description: "Six Lesson 3 grammar cards: three ending charts and three model-verb paradigms.", language: "greek", cards, supportsReverse: false, sourceNote: "Groton 3.20–3.22; model verb παιδεύω." } satisfies DeckDefinition;
  });
  return greekLesson3GrammarPromise;
}

export function loadGreekLesson4VocabularyDeck() {
  greekLesson4VocabularyPromise ??= fetchText("data/greek-lesson4-vocab.json").then((text) => {
    const source = JSON.parse(text) as GreekVocabularySourceCard[];
    const cards: StudyCard[] = source.map((card, index) => {
      const pronunciation = classicalGreekPronunciation(card.greek);
      return {
        id: card.id,
        deckId: "alpha-omega-lesson4-vocab",
        front: card.greek,
        back: card.meaning,
        reverseFront: card.meaning,
        reverseBack: card.greek,
        category: "Lesson 4 Vocabulary",
        rank: index + 1,
        source: "From Alpha to Omega, Lesson 4",
        notes: `${card.part_of_speech} · Pronunciation: ${pronunciation}`,
        metadata: { lesson: 4, studySource: "vocabulary", partOfSpeech: card.part_of_speech, pronunciation, sourceRef: card.source_ref ?? "Groton 4.32" },
      };
    });
    return { id: "alpha-omega-lesson4-vocab", slug: "greek", title: "Greek Lesson 4 Vocabulary", eyebrow: "Lesson 4 vocabulary", description: "Lesson 4 vocabulary from Groton §4.32.", language: "greek", cards, supportsReverse: true, sourceNote: "Groton 4.32." } satisfies DeckDefinition;
  });
  return greekLesson4VocabularyPromise;
}

export function loadGreekLesson4GrammarDeck() {
  greekLesson4GrammarPromise ??= fetchText("data/greek-lesson4-grammar.json", "no-store").then((text) => {
    const source = JSON.parse(text) as GreekGrammarSourceCard[];
    const cards: StudyCard[] = source.map((card, index) => {
      const chartRows = card.rows.map((row) => ({ ...row, cells: [...row.cells] }));
      const chartKind = card.category.endsWith("Endings") ? "Ending chart" : "Whole-paradigm chart";
      return {
        id: card.id,
        deckId: "alpha-omega-lesson4-grammar",
        front: card.prompt,
        back: card.category,
        category: card.category,
        rank: index + 1,
        source: "From Alpha to Omega, Lesson 4",
        notes: [chartKind, card.accent_note].filter(Boolean).join(" · "),
        metadata: {
          lesson: 4,
          studySource: "grammar-chart",
          grammarGroup: card.category,
          chartColumns: card.columns,
          chartRows,
          pronunciationText: greekLesson3ParadigmSpeechText(chartRows),
          sourceRef: card.source_ref ?? "Groton 4.29",
        },
      };
    });
    return { id: "alpha-omega-lesson4-grammar", slug: "greek", title: "Greek Lesson 4 Grammar", eyebrow: "First-declension feminine nouns · definite article", description: "Eight Lesson 4 grammar cards: two first-declension ending charts, four model-noun paradigms, and two feminine definite-article cards.", language: "greek", cards, supportsReverse: false, sourceNote: "Groton 4.29–4.30." } satisfies DeckDefinition;
  });
  return greekLesson4GrammarPromise;
}

export function loadLatinDeck() {
  latinPromise ??= fetchText("data/dickinson-latin-core.csv").then((text) => { const source = latinRowsToCards(parseCsv(text)); const cards: StudyCard[] = source.map((card) => { const definition = card.definition || (card.headword.trim() === "fore" ? "to be; to be going to be (future infinitive of sum)" : "No English gloss is supplied in the source."); return { id: card.id, deckId: "dickinson-latin-core", front: card.headword, back: definition, reverseFront: definition, reverseBack: card.headword, category: card.partOfSpeech || "Vocabulary", rank: card.frequencyRank, source: "Dickinson College Commentaries Latin Core Vocabulary", notes: [card.partOfSpeech, card.semanticGroup].filter(Boolean).join(" · "), metadata: { partOfSpeech: card.partOfSpeech, semanticGroup: card.semanticGroup, frequencyRank: card.frequencyRank, deckPosition: card.deckPosition } }; }); return { id: "dickinson-latin-core", slug: "latin", title: "Dickinson Latin Core Vocabulary", eyebrow: "Frequency-ranked adaptive review", description: "Begin with the 100 most frequent entries, then unlock 25 at a time while earlier vocabulary continues long-term review.", language: "latin", cards, supportsReverse: true, staged: { initialCount: 100, batchSize: 25 }, sourceNote: `All ${cards.length} supplied Dickinson entries are included.` } satisfies DeckDefinition; }); return latinPromise;
}
