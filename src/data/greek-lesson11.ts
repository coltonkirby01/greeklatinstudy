import type { DeckDefinition, StudyCard } from "../features/study/types";
import { classicalGreekPronunciation } from "../features/greek/greek-pronunciation";
import { greekLesson3ParadigmSpeechText } from "./builtin-decks";

type GreekVocabularySourceCard = {
  id: string;
  greek: string;
  meaning: string;
  part_of_speech: string;
  lesson: number;
  source_ref?: string;
  accent_note?: string;
};

type GreekGrammarSourceCard = {
  id: string;
  category: string;
  prompt: string;
  columns: string[];
  rows: Array<{ label: string; cells: string[] }>;
  source_ref?: string;
  accent_note?: string;
};

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
async function fetchText(path: string) {
  const response = await fetch(assetUrl(path), { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${path}.`);
  return response.text();
}

function vocabularyDeck(source: GreekVocabularySourceCard[]): DeckDefinition {
  const id = "alpha-omega-lesson11-vocab";
  const cards: StudyCard[] = source.map((card, index) => {
    const pronunciation = classicalGreekPronunciation(card.greek);
    return {
      id: card.id,
      deckId: id,
      front: card.greek,
      back: card.meaning,
      reverseFront: card.meaning,
      reverseBack: card.greek,
      category: "Lesson 11 Vocabulary",
      rank: index + 1,
      source: "From Alpha to Omega, Lesson 11",
      notes: [card.part_of_speech, card.accent_note ? `Accent: ${card.accent_note}` : "", `Pronunciation: ${pronunciation}`].filter(Boolean).join(" · "),
      metadata: {
        lesson: 11,
        studySource: "vocabulary",
        partOfSpeech: card.part_of_speech,
        pronunciation,
        accentNote: card.accent_note,
        sourceRef: card.source_ref ?? "Groton Lesson 11",
      },
    };
  });
  return {
    id,
    slug: "greek",
    title: "Greek Lesson 11 Vocabulary",
    eyebrow: "Lesson 11 vocabulary",
    description: "Lesson 11 vocabulary from Groton, From Alpha to Omega.",
    language: "greek",
    cards,
    supportsReverse: true,
    sourceNote: "Groton 11.77.",
  };
}

function grammarDeck(source: GreekGrammarSourceCard[]): DeckDefinition {
  const id = "alpha-omega-lesson11-grammar";
  const cards: StudyCard[] = source.map((card, index) => {
    const chartRows = card.rows.map((row) => ({ ...row, cells: [...row.cells] }));
    return {
      id: card.id,
      deckId: id,
      front: card.prompt,
      back: card.category,
      category: card.category,
      rank: index + 1,
      source: "From Alpha to Omega, Lesson 11",
      notes: ["Ending chart", card.accent_note].filter(Boolean).join(" · "),
      metadata: {
        lesson: 11,
        studySource: "grammar-chart",
        grammarGroup: card.category,
        chartColumns: card.columns,
        chartRows,
        rowHeaderLabel: card.columns.length === 1 ? "Form" : "Person",
        pronunciationText: greekLesson3ParadigmSpeechText(chartRows),
        accentNote: card.accent_note,
        sourceRef: card.source_ref ?? "Groton Lesson 11",
      },
    };
  });
  return {
    id,
    slug: "greek",
    title: "Greek Lesson 11 Grammar",
    eyebrow: "Middle/passive endings",
    description: "Six Lesson 11 ending charts for the present middle/passive, future middle, and imperfect middle/passive.",
    language: "greek",
    cards,
    supportsReverse: false,
    sourceNote: "Groton 11.71–73.",
  };
}

let lesson11VocabularyPromise: Promise<DeckDefinition> | null = null;
let lesson11GrammarPromise: Promise<DeckDefinition> | null = null;

export function loadGreekLesson11VocabularyDeck() {
  lesson11VocabularyPromise ??= fetchText("data/greek-lesson11-vocab.json").then((text) => vocabularyDeck(JSON.parse(text) as GreekVocabularySourceCard[]));
  return lesson11VocabularyPromise;
}

export function loadGreekLesson11GrammarDeck() {
  lesson11GrammarPromise ??= fetchText("data/greek-lesson11-grammar.json").then((text) => grammarDeck(JSON.parse(text) as GreekGrammarSourceCard[]));
  return lesson11GrammarPromise;
}
