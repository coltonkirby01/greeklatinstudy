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
  "Passive Subjunctive — Present Tense": "267, 269-271",
  "Passive Subjunctive — Imperfect Tense": "268, 272-274",
  "Passive Subjunctive — Perfect Tense": "275, 277-279",
  "Passive Subjunctive — Pluperfect Tense": "276, 280-282",
};

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
let promise: Promise<DeckDefinition> | null = null;

export function loadLatinPassiveSubjunctiveParadigmsDeck() {
  promise ??= fetch(assetUrl("data/latin-passive-subjunctive-paradigms.json"), { cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok) throw new Error("The Latin passive subjunctive paradigm deck could not be loaded.");
      const source = await response.json() as LatinParadigmSourceCard[];
      const cards: StudyCard[] = source.map((card, index) => {
        const rules = RULES_BY_TENSE[card.category] ?? "";
        return {
          id: card.id,
          deckId: "latin-passive-subjunctive-paradigms",
          front: rules ? `${card.prompt} — R. ${rules}` : card.prompt,
          back: card.category,
          category: card.category,
          rank: index + 1,
          source: "Latin Quick Reference v67 — Passive Voice, Subjunctive Mood",
          notes: "Whole-paradigm chart",
          metadata: {
            studySource: "latin-passive-subjunctive-paradigm",
            chartColumns: card.columns,
            chartRows: card.rows,
            voiceGroup: "Passive Voice",
            formGroup: "Subjunctive",
            ruleLabel: rules,
          },
        } satisfies StudyCard;
      });

      return {
        id: "latin-passive-subjunctive-paradigms",
        slug: "latin",
        title: "Latin Passive Subjunctive Paradigms",
        eyebrow: "Present · imperfect · perfect · pluperfect",
        description: "Sixteen whole-paradigm cards covering all four passive subjunctive tenses in all four regular conjugations.",
        language: "latin",
        cards,
        supportsReverse: false,
        sourceNote: "Latin Quick Reference v67, Passive Voice: subjunctive paradigms only.",
      } satisfies DeckDefinition;
    });

  return promise;
}
