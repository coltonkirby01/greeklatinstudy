import type { DeckDefinition, StudyCard } from "../features/study/types";

type LatinRelativePronounSourceCard = {
  id: string;
  gender: "Masculine" | "Feminine" | "Neuter";
  columns: string[];
  rows: Array<{ label: string; cells: string[] }>;
};

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
const REQUIRED_IDS = [
  "latin-relative-pronoun-masculine",
  "latin-relative-pronoun-feminine",
  "latin-relative-pronoun-neuter",
] as const;
let promise: Promise<DeckDefinition> | null = null;

export function loadLatinRelativePronounsDeck() {
  promise ??= fetch(assetUrl("data/latin-relative-pronouns.json"), { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) throw new Error("The Latin relative-pronoun charts could not be loaded.");
      const source = await response.json() as LatinRelativePronounSourceCard[];
      if (source.length !== REQUIRED_IDS.length ||
        !REQUIRED_IDS.every((id, index) => source[index]?.id === id)) {
        throw new Error("The Latin relative-pronoun chart data is out of date. Please reload the page.");
      }
      const cards: StudyCard[] = source.map((entry, index) => ({
        id: entry.id,
        deckId: "latin-relative-pronouns",
        front: `Relative Pronoun — ${entry.gender}`,
        back: `Relative Pronoun — ${entry.gender}`,
        category: "Relative Pronouns",
        rank: index + 1,
        source: "Latin relative pronouns — supplied textbook photograph",
        metadata: {
          studySource: "latin-relative-pronoun-paradigm",
          formGroup: "Relative Pronouns",
          chartColumns: entry.columns,
          chartRows: entry.rows,
          rowHeaderLabel: "Case",
          audioDisabled: true,
        },
      }));
      return {
        id: "latin-relative-pronouns",
        slug: "latin",
        title: "Latin Relative Pronouns",
        eyebrow: "Masculine · Feminine · Neuter",
        description: "Three gender-specific Latin relative-pronoun charts, each with singular and plural forms for all five cases; no English translations.",
        language: "latin",
        cards,
        supportsReverse: false,
        sourceNote: "The relative-pronoun table in the supplied textbook photograph.",
      } satisfies DeckDefinition;
    });
  return promise;
}
