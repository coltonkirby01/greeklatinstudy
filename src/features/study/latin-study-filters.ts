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

export type DickinsonFrequencyRankGroup = {
  start: number;
  end: number;
  cards: StudyCard[];
};

/** Group by published rank (not deck position): ranks can have gaps or ties. */
export function groupDickinsonCardsByFrequencyRank(cards: readonly StudyCard[], rankSpan = 50): DickinsonFrequencyRankGroup[] {
  if (!Number.isInteger(rankSpan) || rankSpan < 1) throw new Error("Frequency rank span must be a positive integer.");
  const groups = new Map<number, StudyCard[]>();
  for (const card of cards) {
    if (typeof card.rank !== "number" || !Number.isInteger(card.rank) || card.rank < 1) {
      throw new Error(`Dickinson card ${card.id} has no valid frequency rank.`);
    }
    const start = Math.floor((card.rank - 1) / rankSpan) * rankSpan + 1;
    groups.set(start, [...(groups.get(start) ?? []), card]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([start, groupedCards]) => ({ start, end: start + rankSpan - 1, cards: groupedCards }));
}
