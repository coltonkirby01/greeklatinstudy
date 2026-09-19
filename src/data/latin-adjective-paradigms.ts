import type { DeckDefinition, StudyCard } from "../features/study/types";

type LatinAdjectiveChartRow = { label: string; cells: string[] };
type LatinAdjectiveSourceCard = {
  id: string;
  category: string;
  prompt: string;
  columns: string[];
  rows: LatinAdjectiveChartRow[];
};

const RULE_BY_CARD: Record<string, string> = {
  "latin-adjective-1st-2nd-masculine": "72",
  "latin-adjective-1st-2nd-feminine": "72",
  "latin-adjective-1st-2nd-neuter": "72",
  "latin-adjective-3rd-gravis": "78",
};

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
let promise: Promise<DeckDefinition> | null = null;

export function loadLatinAdjectiveParadigmsDeck() {
  promise ??= fetch(assetUrl("data/latin-adjective-paradigms.json"), { cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok) throw new Error("The Latin adjective paradigm deck could not be loaded.");
      const source = await response.json() as LatinAdjectiveSourceCard[];
      const cards: StudyCard[] = source.map((card, index) => {
        const rule = RULE_BY_CARD[card.id] ?? "";
        const isThirdDeclension = card.id === "latin-adjective-3rd-gravis";
        return {
          id: card.id,
          deckId: "latin-adjective-paradigms",
          front: rule ? `${card.prompt} — R. ${rule}` : card.prompt,
          back: card.category,
          category: card.category,
          rank: index + 1,
          source: isThirdDeclension
            ? "Henle Latin Grammar — Adjectives of the Third Declension"
            : "Henle Latin Grammar — Adjectives of the First and Second Declensions",
          notes: isThirdDeclension
            ? "Whole-paradigm chart · masculine/feminine forms with neuter variants in parentheses"
            : "Whole-paradigm chart",
          metadata: {
            studySource: "latin-adjective-paradigm",
            chartColumns: card.columns,
            chartRows: card.rows,
            rowHeaderLabel: "Case",
            formGroup: "Adjectives",
            adjectiveGroup: isThirdDeclension ? "3rd Declension" : "1st & 2nd Declension",
            ruleLabel: rule,
          },
        } satisfies StudyCard;
      });

      return {
        id: "latin-adjective-paradigms",
        slug: "latin",
        title: "Latin Adjective Paradigms",
        eyebrow: "1st & 2nd declension · 3rd declension",
        description: "Four Henle adjective paradigm cards: three gender-specific magnus cards and one combined gravis, -e card.",
        language: "latin",
        cards,
        supportsReverse: false,
        sourceNote: "Henle Latin Grammar R. 72 (p. 14) and R. 78 (p. 16), cross-checked against Henle Latin Helps adjective charts.",
      } satisfies DeckDefinition;
    });

  return promise;
}
