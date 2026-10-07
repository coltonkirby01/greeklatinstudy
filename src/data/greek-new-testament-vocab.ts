import { classicalGreekPronunciation } from "../features/greek/greek-pronunciation";
import type { DeckDefinition, StudyCard } from "../features/study/types";

type NewTestamentVocabularySourceCard = {
  id: string;
  greek: string;
  meaning: string;
  frequency: number;
  frequency_rank: number;
  group: string;
  source_ref: string;
};

export const NEW_TESTAMENT_FREQUENCY_GROUPS = [
  { key: "nt-vocab-1000-plus", dataGroup: "1000-plus", label: "1,000+ occurrences" },
  { key: "nt-vocab-500-999", dataGroup: "500-999", label: "500–999 occurrences" },
  { key: "nt-vocab-250-499", dataGroup: "250-499", label: "250–499 occurrences" },
  { key: "nt-vocab-150-249", dataGroup: "150-249", label: "150–249 occurrences" },
  { key: "nt-vocab-100-149", dataGroup: "100-149", label: "100–149 occurrences" },
  { key: "nt-vocab-75-99", dataGroup: "75-99", label: "75–99 occurrences" },
  { key: "nt-vocab-60-74", dataGroup: "60-74", label: "60–74 occurrences" },
  { key: "nt-vocab-50-59", dataGroup: "50-59", label: "50–59 occurrences" },
] as const;

export type NewTestamentFrequencyGroupKey = (typeof NEW_TESTAMENT_FREQUENCY_GROUPS)[number]["key"];

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
let newTestamentVocabularyPromise: Promise<DeckDefinition> | null = null;

export function newTestamentFrequencyGroupForCard(card: StudyCard) {
  const value = card.metadata?.frequencyGroupKey;
  return NEW_TESTAMENT_FREQUENCY_GROUPS.find((group) => group.key === value) ?? null;
}

export function loadGreekNewTestamentVocabularyDeck() {
  newTestamentVocabularyPromise ??= fetch(assetUrl("data/greek-new-testament-vocab.json"), { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) throw new Error("Could not load New Testament vocabulary.");
      const source = await response.json() as NewTestamentVocabularySourceCard[];
      const ordered = [...source].sort((a, b) => a.frequency_rank - b.frequency_rank || b.frequency - a.frequency || a.greek.localeCompare(b.greek, "el"));
      const cards: StudyCard[] = ordered.map((card) => {
        const group = NEW_TESTAMENT_FREQUENCY_GROUPS.find((item) => item.dataGroup === card.group);
        if (!group) throw new Error(`Unknown New Testament vocabulary frequency group: ${card.group}`);
        const pronunciation = classicalGreekPronunciation(card.greek);
        return {
          id: card.id,
          deckId: "kubo-new-testament-vocab",
          front: card.greek,
          back: card.meaning,
          reverseFront: card.meaning,
          reverseBack: card.greek,
          category: `New Testament Vocab · ${group.label}`,
          rank: card.frequency_rank,
          source: "Kubo New Testament Vocabulary",
          notes: `Frequency: ${card.frequency.toLocaleString("en-US")} occurrences · Frequency rank: ${card.frequency_rank} · Pronunciation: ${pronunciation}`,
          metadata: {
            studySource: "vocabulary",
            vocabularySource: "new-testament",
            frequency: card.frequency,
            frequencyRank: card.frequency_rank,
            frequencyGroupKey: group.key,
            frequencyGroupLabel: group.label,
            pronunciation,
            sourceRef: card.source_ref,
          },
        };
      });
      return {
        id: "kubo-new-testament-vocab",
        slug: "greek",
        title: "New Testament Vocab",
        eyebrow: "New Testament vocabulary · frequency-ranked",
        description: "The general New Testament vocabulary list from Kubo Appendix I, sorted from highest to lowest frequency and grouped into frequency bands.",
        language: "greek",
        cards,
        supportsReverse: true,
        sourceNote: "Kubo, Appendix I, ‘Words Occurring More Than 50 Times,’ pp. 274–277. The separate John special-vocabulary lists are not imported unless a word also appears in the general list.",
      } satisfies DeckDefinition;
    });
  return newTestamentVocabularyPromise;
}
