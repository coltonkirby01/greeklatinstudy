import type { DeckDefinition, StudyCard } from "../features/study/types";

type LatinAdjectiveChartRow = { label: string; cells: string[] };
type LatinAdjectiveSourceCard = {
  id: string;
  category: string;
  prompt: string;
  terminationLabel?: string;
  terminationDetail?: string;
  columns: string[];
  rows: LatinAdjectiveChartRow[];
};

const RULE_BY_CARD: Record<string, string> = {
  "latin-adjective-1st-2nd-masculine": "72",
  "latin-adjective-1st-2nd-feminine": "72",
  "latin-adjective-1st-2nd-neuter": "72",
  "latin-adjective-3rd-gravis": "78",
  "latin-adjective-3rd-acer": "80",
  "latin-adjective-3rd-diligens": "82",
};

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
const REQUIRED_ADJECTIVE_CARD_IDS = [
  "latin-adjective-1st-2nd-masculine",
  "latin-adjective-1st-2nd-feminine",
  "latin-adjective-1st-2nd-neuter",
  "latin-adjective-3rd-gravis",
  "latin-adjective-3rd-acer",
  "latin-adjective-3rd-diligens",
] as const;
let promise: Promise<DeckDefinition> | null = null;

export function loadLatinAdjectiveParadigmsDeck() {
  promise ??= fetch(assetUrl("data/latin-adjective-paradigms.json?v=henle-r80-r82-v2"), { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) throw new Error("The Latin adjective paradigm deck could not be loaded.");
      const source = await response.json() as LatinAdjectiveSourceCard[];
      const loadedIds = new Set(source.map((card) => card.id));
      if (source.length !== REQUIRED_ADJECTIVE_CARD_IDS.length ||
        !REQUIRED_ADJECTIVE_CARD_IDS.every((id) => loadedIds.has(id))) {
        throw new Error("The Henle adjective data is out of date. Please reload the page.");
      }
      const cards: StudyCard[] = source.map((card, index) => {
        const rule = RULE_BY_CARD[card.id] ?? "";
        const isThirdDeclension = card.id.startsWith("latin-adjective-3rd-");
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
            terminationLabel: card.terminationLabel,
            terminationDetail: card.terminationDetail,
            ruleLabel: rule,
          },
        } satisfies StudyCard;
      });

      return {
        id: "latin-adjective-paradigms",
        slug: "latin",
        title: "Latin Adjective Paradigms",
        eyebrow: "1st & 2nd declension · 3rd declension",
        description: "Six Henle adjective paradigm cards: three gender-specific magnus cards and third-declension models of two, three, and one termination.",
        language: "latin",
        cards,
        supportsReverse: false,
        sourceNote: "Henle Latin Grammar R. 72, 78, 80, and 82; adjective charts cross-checked against the Henle quick-reference PDF.",
      } satisfies DeckDefinition;
    });

  return promise;
}
