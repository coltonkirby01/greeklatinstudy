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
  "Active Subjunctive — Present Tense": "186, 194-196",
  "Active Subjunctive — Imperfect Tense": "187, 197-199",
  "Active Subjunctive — Perfect Tense": "200, 202-204",
  "Active Subjunctive — Pluperfect Tense": "201, 205-207",
};

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
let promise: Promise<DeckDefinition> | null = null;

export function loadLatinActiveSubjunctiveParadigmsDeck() {
  promise ??= fetch(assetUrl("data/latin-active-subjunctive-paradigms.json"), { cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok) throw new Error("The Latin active subjunctive paradigm deck could not be loaded.");
      const source = await response.json() as LatinParadigmSourceCard[];
      const cards: StudyCard[] = source.map((card, index) => {
        const rules = RULES_BY_TENSE[card.category] ?? "";
        return {
          id: card.id,
          deckId: "latin-active-subjunctive-paradigms",
          front: rules ? `${card.prompt} — R. ${rules}` : card.prompt,
          back: card.category,
          category: card.category,
          rank: index + 1,
          source: "Latin Quick Reference v67 — Active Voice, Subjunctive Mood",
          notes: "Whole-paradigm chart",
          metadata: {
            studySource: "latin-active-subjunctive-paradigm",
            chartColumns: card.columns,
            chartRows: card.rows,
            voiceGroup: "Active Voice",
            formGroup: "Subjunctive",
            ruleLabel: rules,
          },
        } satisfies StudyCard;
      });

      return {
        id: "latin-active-subjunctive-paradigms",
        slug: "latin",
        title: "Latin Active Subjunctive Paradigms",
        eyebrow: "Present · imperfect · perfect · pluperfect",
        description: "Ten active subjunctive cards: present and imperfect by conjugation, with all four conjugations grouped on one perfect card and one pluperfect card.",
        language: "latin",
        cards,
        supportsReverse: false,
        sourceNote: "Latin Quick Reference v67, Active Voice: subjunctive paradigms only.",
      } satisfies DeckDefinition;
    });

  return promise;
}
