import type { DeckDefinition } from "../study/types";
import type { DictionaryMatch, TranslationHelperLanguage } from "./dictionary-sources";

export type TranslationVocabEntry = {
  id: string;
  language: TranslationHelperLanguage;
  surfaceForm: string;
  headword: string;
  definition: string;
  source: string;
  sourceRef: string | null;
  createdAt: string;
  updatedAt: string;
};

export function dictionaryChoiceKey(match: Pick<DictionaryMatch, "headword" | "definition" | "source">) {
  return [match.headword.trim(), match.definition.trim(), match.source.trim()].join("\u241f");
}

export function vocabEntryKey(entry: Pick<TranslationVocabEntry, "headword" | "definition" | "source">) {
  return [entry.headword.trim(), entry.definition.trim(), entry.source.trim()].join("\u241f");
}

export function distinctDictionaryChoices(matches: readonly DictionaryMatch[]) {
  const byKey = new Map<string, DictionaryMatch>();
  for (const match of matches) {
    const key = dictionaryChoiceKey(match);
    const current = byKey.get(key);
    if (!current) {
      byKey.set(key, { ...match, morphology: match.morphology ? [...match.morphology] : undefined });
      continue;
    }
    const morphology = [...new Set([...(current.morphology ?? []), ...(match.morphology ?? [])])];
    byKey.set(key, { ...current, ...(morphology.length ? { morphology } : {}) });
  }
  return [...byKey.values()];
}

export function translationVocabDeckId(language: TranslationHelperLanguage) {
  return `translation-helper-vocab-${language}`;
}

export function translationVocabDeck(entries: readonly TranslationVocabEntry[], language: TranslationHelperLanguage): DeckDefinition {
  const id = translationVocabDeckId(language);
  return {
    id,
    slug: id,
    title: "Translation Helper Vocab",
    eyebrow: "Saved vocabulary",
    description: `Vocabulary saved from the ${language === "latin" ? "Latin" : "Greek"} Translation Helper.`,
    language,
    supportsReverse: true,
    cards: entries.map((entry) => ({
      id: entry.id,
      deckId: id,
      front: entry.headword,
      back: entry.definition,
      category: "Translation Helper Vocabulary",
      source: entry.source,
      notes: entry.sourceRef ? `${entry.source} · ${entry.sourceRef}` : entry.source,
      metadata: {
        translationVocab: true,
        surfaceForm: entry.surfaceForm,
        sourceRef: entry.sourceRef ?? undefined,
        audioDisabled: true,
      },
    })),
  };
}
