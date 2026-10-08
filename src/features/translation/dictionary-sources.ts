import {
  loadGreekLesson3VocabularyDeck,
  loadGreekLesson4VocabularyDeck,
  loadGreekLesson5VocabularyDeck,
  loadGreekLesson6VocabularyDeck,
  loadGreekLesson7VocabularyDeck,
  loadGreekLesson8VocabularyDeck,
} from "../../data/builtin-decks";
import { loadGreekLesson9VocabularyDeck, loadGreekLesson10VocabularyDeck } from "../../data/greek-lessons-9-10";
import { loadGreekNewTestamentVocabularyDeck } from "../../data/greek-new-testament-vocab";
import type { DeckDefinition, StudyCard } from "../study/types";

export type TranslationHelperLanguage = "greek" | "latin";

export type DictionaryMatch = {
  headword: string;
  definition: string;
  source: string;
  sourceRef?: string;
  externalUrl?: string;
  morphology?: string[];
};

const ignoredHeadwordTokens = new Set([
  "m", "f", "n", "nt", "sg", "pl", "adj", "adv", "prep", "pron", "conj", "interj", "v", "tr", "intr",
]);

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

function addDeck(index: Map<string, DictionaryMatch[]>, deck: DeckDefinition, fallbackSource: string) {
  for (const card of deck.cards) {
    if (!card.front || !card.back) continue;
    const match: DictionaryMatch = {
      headword: card.front,
      definition: card.back,
      source: sourceName(card, fallbackSource),
      sourceRef: sourceRef(card),
    };
    for (const alias of lexicalAliases(card.front)) {
      const existing = index.get(alias) ?? [];
      if (!existing.some((item) => item.headword === match.headword && item.definition === match.definition && item.source === match.source)) {
        existing.push(match);
        index.set(alias, existing);
      }
    }
  }
}

let greekIndexPromise: Promise<Map<string, DictionaryMatch[]>> | null = null;

export function loadTranslationDictionary(language: TranslationHelperLanguage) {
  if (language === "latin") return Promise.resolve(new Map<string, DictionaryMatch[]>());

  greekIndexPromise ??= Promise.all([
    loadGreekLesson3VocabularyDeck(),
    loadGreekLesson4VocabularyDeck(),
    loadGreekLesson5VocabularyDeck(),
    loadGreekLesson6VocabularyDeck(),
    loadGreekLesson7VocabularyDeck(),
    loadGreekLesson8VocabularyDeck(),
    loadGreekLesson9VocabularyDeck(),
    loadGreekLesson10VocabularyDeck(),
    loadGreekNewTestamentVocabularyDeck(),
  ]).then((decks) => {
    const index = new Map<string, DictionaryMatch[]>();
    for (const deck of decks.slice(0, 8)) addDeck(index, deck, "Groton, From Alpha to Omega");
    addDeck(index, decks[8], "Kubo New Testament Vocabulary");
    return index;
  });
  return greekIndexPromise;
}

export function lookupDictionaryWord(index: Map<string, DictionaryMatch[]>, surface: string) {
  return index.get(normalizeDictionaryKey(surface)) ?? [];
}
