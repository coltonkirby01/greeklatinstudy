import { BUILTIN_STUDY_DECKS, type BuiltinDeckRegistration } from "../study/builtin-study-catalog";
import type { DeckDefinition, StudyCard } from "../study/types";

export type TranslationHelperLanguage = "greek" | "latin";

export type WhitakerMetadata = {
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

export type DictionaryMatch = {
  headword: string;
  definition: string;
  source: string;
  sourceRef?: string;
  externalUrl?: string;
  morphology?: string[];
  whitaker?: WhitakerMetadata;
};

const ignoredHeadwordTokens = new Set([
  "m", "f", "n", "nt", "sg", "pl", "adj", "adv", "prep", "pron", "conj", "interj", "v", "tr", "intr",
]);

const grotonDeckPattern = /^alpha-omega-lesson(\d+)-(vocab|grammar)$/u;

export function normalizeDictionaryKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLocaleLowerCase()
    .replace(/ς/g, "σ")
    .replace(/[‐‑‒–—-]/g, "")
    .replace(/[^\p{L}]/gu, "");
}

export function tokenizeTranslationText(text: string) {
  return text.split(/([\p{L}\p{M}]+(?:[’'][\p{L}\p{M}]+)*)/gu).filter((part) => part.length > 0);
}

function lexicalAliases(headword: string) {
  const aliases = new Set<string>();
  const whole = normalizeDictionaryKey(headword);
  if (whole) aliases.add(whole);

  const tokens = headword.match(/[\p{L}\p{M}]+/gu) ?? [];
  for (const token of tokens) {
    const normalized = normalizeDictionaryKey(token);
    if (!normalized || ignoredHeadwordTokens.has(normalized)) continue;
    aliases.add(normalized);
  }
  return [...aliases];
}

function sourceRef(card: StudyCard) {
  return typeof card.metadata?.sourceRef === "string" ? card.metadata.sourceRef : undefined;
}

function sourceName(card: StudyCard, fallback: string) {
  return card.source || fallback;
}

function addMatch(index: Map<string, DictionaryMatch[]>, alias: string, match: DictionaryMatch, prepend = false) {
  const key = normalizeDictionaryKey(alias);
  if (!key) return;
  const existing = index.get(key) ?? [];
  if (existing.some((item) => item.headword === match.headword && item.definition === match.definition && item.source === match.source && item.sourceRef === match.sourceRef && item.morphology?.join("|") === match.morphology?.join("|"))) return;
  if (prepend) existing.unshift(match);
  else existing.push(match);
  index.set(key, existing);
}

function addVocabularyDeck(index: Map<string, DictionaryMatch[]>, deck: DeckDefinition, fallbackSource: string) {
  for (const card of deck.cards) {
    if (!card.front || !card.back) continue;
    const match: DictionaryMatch = {
      headword: card.front,
      definition: card.back,
      source: sourceName(card, fallbackSource),
      sourceRef: sourceRef(card),
    };
    for (const alias of lexicalAliases(card.front)) addMatch(index, alias, match);
  }
}

type ChartRow = { label: string; cells: string[] };

function chartRows(card: StudyCard): ChartRow[] {
  const rows = card.metadata?.chartRows;
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const candidate = row as { label?: unknown; cells?: unknown };
    if (typeof candidate.label !== "string" || !Array.isArray(candidate.cells) || candidate.cells.some((cell) => typeof cell !== "string")) return [];
    return [{ label: candidate.label, cells: candidate.cells as string[] }];
  });
}

function chartColumns(card: StudyCard) {
  const columns = card.metadata?.chartColumns;
  return Array.isArray(columns) && columns.every((column) => typeof column === "string") ? columns as string[] : [];
}

function grammarLemma(card: StudyCard) {
  return card.front.match(/^([\p{L}\p{M}]+)/u)?.[1] ?? null;
}

function grammarGroup(card: StudyCard) {
  return typeof card.metadata?.grammarGroup === "string" ? card.metadata.grammarGroup : card.category || card.back;
}

function expandKnownForms(cell: string) {
  return cell.split(/\s*\/\s*/u).flatMap((rawForm) => {
    const form = rawForm.trim();
    if (!form || /^[‐‑‒–—-]/u.test(form)) return [];
    const optionalEnding = form.match(/^([\p{L}\p{M}]+)\(([\p{L}\p{M}]+)\)$/u);
    if (!optionalEnding) return [form];
    return [optionalEnding[1], `${optionalEnding[1]}${optionalEnding[2]}`];
  });
}

function addGrammarForms(index: Map<string, DictionaryMatch[]>, deck: DeckDefinition) {
  for (const card of deck.cards) {
    const lemma = grammarLemma(card);
    if (!lemma) continue;
    const lexicalMatch = index.get(normalizeDictionaryKey(lemma))?.[0];
    if (!lexicalMatch) continue;

    const columns = chartColumns(card);
    for (const row of chartRows(card)) {
      row.cells.forEach((cell, columnIndex) => {
        const column = columns[columnIndex];
        const morphology = [grammarGroup(card), row.label, column].filter(Boolean).join(" · ");
        for (const form of expandKnownForms(cell)) {
          addMatch(index, form, {
            ...lexicalMatch,
            sourceRef: sourceRef(card) ?? lexicalMatch.sourceRef,
            morphology: morphology ? [morphology] : undefined,
          }, true);
        }
      });
    }
  }
}

function grotonLessonNumber(registration: BuiltinDeckRegistration) {
  const match = registration.id.match(grotonDeckPattern);
  return match ? Number(match[1]) : -1;
}

export function translationGreekRegistrations(registrations: readonly BuiltinDeckRegistration[] = BUILTIN_STUDY_DECKS) {
  const groton = registrations
    .filter((registration) => registration.language === "Greek" && grotonDeckPattern.test(registration.id))
    .slice()
    .sort((a, b) => grotonLessonNumber(b) - grotonLessonNumber(a));
  return {
    grotonVocabulary: groton.filter((registration) => registration.id.endsWith("-vocab")),
    grotonGrammar: groton.filter((registration) => registration.id.endsWith("-grammar")),
    kubo: registrations.find((registration) => registration.id === "kubo-new-testament-vocab") ?? null,
  };
}

export function buildGreekTranslationIndex(grotonVocabularyDecks: DeckDefinition[], grotonGrammarDecks: DeckDefinition[], kuboDeck?: DeckDefinition | null) {
  const index = new Map<string, DictionaryMatch[]>();
  for (const deck of grotonVocabularyDecks) addVocabularyDeck(index, deck, "Groton, From Alpha to Omega");
  for (const deck of grotonGrammarDecks) addGrammarForms(index, deck);
  if (kuboDeck) addVocabularyDeck(index, kuboDeck, "Kubo New Testament Vocabulary");
  return index;
}

let greekIndexPromise: Promise<Map<string, DictionaryMatch[]>> | null = null;

export function loadTranslationDictionary(language: TranslationHelperLanguage) {
  if (language === "latin") return Promise.resolve(new Map<string, DictionaryMatch[]>());

  if (!greekIndexPromise) {
    const { grotonVocabulary, grotonGrammar, kubo } = translationGreekRegistrations();
    greekIndexPromise = Promise.all([
      Promise.all(grotonVocabulary.map((registration) => registration.load())),
      Promise.all(grotonGrammar.map((registration) => registration.load())),
      kubo?.load() ?? Promise.resolve(null),
    ]).then(([vocabularyDecks, grammarDecks, kuboDeck]) => buildGreekTranslationIndex(vocabularyDecks, grammarDecks, kuboDeck));
  }
  return greekIndexPromise;
}

export function lookupDictionaryWord(index: Map<string, DictionaryMatch[]>, surface: string) {
  return index.get(normalizeDictionaryKey(surface)) ?? [];
}
