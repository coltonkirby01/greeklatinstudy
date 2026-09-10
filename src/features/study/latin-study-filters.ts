import type { StudyCard } from "./types";

export type OptionalSelection = ReadonlySet<string> | null;

export function selectionIncludes(selection: OptionalSelection, value: string) {
  return selection === null || selection.has(value);
}

export function vocabularyFamily(partOfSpeech: string) {
  return partOfSpeech.split(":", 1)[0].trim() || "Other";
}

export function matchesVocabularyCard(card: StudyCard, partOfSpeech: OptionalSelection) {
  return selectionIncludes(partOfSpeech, String(card.metadata?.partOfSpeech ?? card.category ?? ""));
}
