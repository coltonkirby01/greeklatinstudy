import type { DeckDefinition, StudyCard } from "../features/study/types";

type LatinParticipleSourceCard = {
  id: string;
  front: string;
  formation: string;
  declension: string;
  example: string;
};

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
let promise: Promise<DeckDefinition> | null = null;

export function loadLatinParticiplesDeck() {
  promise ??= fetch(assetUrl("data/latin-participles.json"), { cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok) throw new Error("The Latin participles deck could not be loaded.");
      const source = await response.json() as LatinParticipleSourceCard[];
      const cards: StudyCard[] = source.map((card, index) => ({
        id: card.id,
        deckId: "latin-participles",
        front: card.front,
        back: `${card.formation} ${card.declension} Example: ${card.example}`,
        category: "Participles",
        rank: index + 1,
        source: "Henle Latin Grammar — Participles",
        metadata: {
          studySource: "latin-participle",
          formGroup: "Participles",
          formation: card.formation,
          declension: card.declension,
          example: card.example,
        },
      }));

      return {
        id: "latin-participles",
        slug: "latin",
        title: "Latin Participles",
        eyebrow: "Present active · perfect passive · future active · future passive",
        description: "Four Henle-style cards explaining how to form and decline the Latin participles.",
        language: "latin",
        cards,
        supportsReverse: false,
        sourceNote: "Latin participle formation cross-checked against Allen and Greenough, §§158 and 164.",
      } satisfies DeckDefinition;
    });

  return promise;
}
