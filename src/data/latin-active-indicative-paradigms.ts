import type { DeckDefinition, StudyCard } from "../features/study/types";

type LatinParadigmChartRow = { label: string; cells: string[] };
type LatinParadigmSourceCard = {
  id: string;
  category: string;
  prompt: string;
  columns: string[];
  rows: LatinParadigmChartRow[];
};

const RULES_BY_TENSE: Record<string, string> = {
  "Active Indicative — Present Tense": "162, 165-167",
  "Active Indicative — Imperfect Tense": "163, 168-170",
  "Active Indicative — Future Tense": "164, 171-173",
  "Active Indicative — Perfect Tense": "174, 177-179",
  "Active Indicative — Pluperfect Tense": "175, 180-182",
  "Active Indicative — Future Perfect Tense": "176, 183-185",
};

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
let promise: Promise<DeckDefinition> | null = null;

export function loadLatinActiveIndicativeParadigmsDeck() {
  promise ??= fetch(assetUrl("data/latin-active-indicative-paradigms.json"), { cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok) throw new Error("The Latin active indicative paradigm deck could not be loaded.");
      const source = await response.json() as LatinParadigmSourceCard[];
      const cards: StudyCard[] = source.map((card, index) => {
        const rules = RULES_BY_TENSE[card.category] ?? "";
        return {
          id: card.id,
          deckId: "latin-active-indicative-paradigms",
          front: rules ? `${card.prompt} — R. ${rules}` : card.prompt,
          back: card.category,
          category: card.category,
          rank: index + 1,
          source: "Latin Quick Reference v67 — Active Voice, Indicative Mood",
          notes: "Whole-paradigm chart",
          metadata: {
            studySource: "latin-active-indicative-paradigm",
            chartColumns: card.columns,
            chartRows: card.rows,
            voiceGroup: "Active Voice",
            formGroup: "Indicative",
            ruleLabel: rules,
          },
        } satisfies StudyCard;
      });

      return {
        id: "latin-active-indicative-paradigms",
        slug: "latin",
        title: "Latin Active Indicative Paradigms",
        eyebrow: "Present · imperfect · future · perfect · pluperfect · future perfect",
        description: "Twenty-four whole-paradigm cards covering all six active indicative tenses in all four regular conjugations.",
        language: "latin",
        cards,
        supportsReverse: false,
        sourceNote: "Latin Quick Reference v67, Active Voice: indicative paradigms only.",
      } satisfies DeckDefinition;
    });

  return promise;
}
