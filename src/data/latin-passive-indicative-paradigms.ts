import type { DeckDefinition, StudyCard } from "../features/study/types";

type LatinParadigmChartRow = { label: string; cells: string[] };
type LatinParadigmSourceCard = {
  id: string;
  category: string;
  prompt: string;
  columns: string[];
  rows: LatinParadigmChartRow[];
};

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
let promise: Promise<DeckDefinition> | null = null;

export function loadLatinPassiveIndicativeParadigmsDeck() {
  promise ??= fetch(assetUrl("data/latin-passive-indicative-paradigms.json"), { cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok) throw new Error("The Latin passive indicative paradigm deck could not be loaded.");
      const source = await response.json() as LatinParadigmSourceCard[];
      const cards: StudyCard[] = source.map((card, index) => ({
        id: card.id,
        deckId: "latin-passive-indicative-paradigms",
        front: card.prompt,
        back: card.category,
        category: card.category,
        rank: index + 1,
        source: "Henle Latin Grammar — Passive Voice, Indicative Mood",
        notes: "Whole-paradigm chart",
        metadata: {
          studySource: "latin-passive-indicative-paradigm",
          chartColumns: card.columns,
          chartRows: card.rows,
          voiceGroup: "Passive Voice",
          formGroup: "Indicative",
        },
      }));

      return {
        id: "latin-passive-indicative-paradigms",
        slug: "latin",
        title: "Latin Passive Indicative Paradigms",
        eyebrow: "Present · imperfect · future",
        description: "Twelve whole-paradigm cards covering the passive indicative present system in all four regular conjugations.",
        language: "latin",
        cards,
        supportsReverse: false,
        sourceNote: "Henle Latin Grammar: passive indicative present, imperfect, and future paradigms.",
      } satisfies DeckDefinition;
    });

  return promise;
}
