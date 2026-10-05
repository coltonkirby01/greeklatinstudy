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

function vocabularyDeck(lesson: 9 | 10, source: GreekVocabularySourceCard[]): DeckDefinition {
  const id = `alpha-omega-lesson${lesson}-vocab`;
  const cards: StudyCard[] = source.map((card, index) => {
    const pronunciation = classicalGreekPronunciation(card.greek);
    return {
      id: card.id,
      deckId: id,
      front: card.greek,
      back: card.meaning,
      reverseFront: card.meaning,
      reverseBack: card.greek,
      category: `Lesson ${lesson} Vocabulary`,
      rank: index + 1,
      source: `From Alpha to Omega, Lesson ${lesson}`,
      notes: [card.part_of_speech, card.accent_note ? `Accent: ${card.accent_note}` : "", `Pronunciation: ${pronunciation}`].filter(Boolean).join(" · "),
      metadata: {
        lesson,
        studySource: "vocabulary",
        partOfSpeech: card.part_of_speech,
        pronunciation,
        accentNote: card.accent_note,
        sourceRef: card.source_ref ?? `Groton Lesson ${lesson}`,
      },
    };
  });
  return {
    id,
    slug: "greek",
    title: `Greek Lesson ${lesson} Vocabulary`,
    eyebrow: `Lesson ${lesson} vocabulary`,
    description: `Lesson ${lesson} vocabulary from Groton, From Alpha to Omega.`,
    language: "greek",
    cards,
    supportsReverse: true,
    sourceNote: lesson === 9 ? "Groton 9.63." : "Groton 10.69.",
  };
}

function grammarDeck(lesson: 9 | 10, source: GreekGrammarSourceCard[]): DeckDefinition {
  const id = `alpha-omega-lesson${lesson}-grammar`;
  const cards: StudyCard[] = source.map((card, index) => {
    const chartRows = card.rows.map((row) => ({ ...row, cells: [...row.cells] }));
    const isEndingChart = card.category.endsWith("Endings") || card.category.includes("Endings —");
    return {
      id: card.id,
      deckId: id,
      front: card.prompt,
      back: card.category,
      category: card.category,
      rank: index + 1,
      source: `From Alpha to Omega, Lesson ${lesson}`,
      notes: [isEndingChart ? "Ending chart" : "Whole-paradigm chart", card.accent_note].filter(Boolean).join(" · "),
      metadata: {
        lesson,
        studySource: "grammar-chart",
        grammarGroup: card.category,
        chartColumns: card.columns,
        chartRows,
        rowHeaderLabel: lesson === 10 ? "Person" : "Case",
        pronunciationText: greekLesson3ParadigmSpeechText(chartRows),
        accentNote: card.accent_note,
        sourceRef: card.source_ref ?? `Groton Lesson ${lesson}`,
      },
    };
  });
  return {
    id,
    slug: "greek",
    title: `Greek Lesson ${lesson} Grammar`,
    eyebrow: lesson === 9 ? "First-declension masculine nouns" : "Imperfect active indicative",
    description: lesson === 9
      ? "Three Lesson 9 grammar cards: first-declension masculine endings and the μαθητής / νεᾱνίᾱς model paradigms."
      : "Two Lesson 10 grammar cards: imperfect active indicative endings and the παιδεύω model paradigm.",
    language: "greek",
    cards,
    supportsReverse: false,
    sourceNote: lesson === 9 ? "Groton 9.58." : "Groton Lesson 10, pp. 57–59.",
  };
}

let lesson9VocabularyPromise: Promise<DeckDefinition> | null = null;
let lesson9GrammarPromise: Promise<DeckDefinition> | null = null;
let lesson10VocabularyPromise: Promise<DeckDefinition> | null = null;
let lesson10GrammarPromise: Promise<DeckDefinition> | null = null;

export function loadGreekLesson9VocabularyDeck() {
  lesson9VocabularyPromise ??= fetchText("data/greek-lesson9-vocab.json").then((text) => vocabularyDeck(9, JSON.parse(text) as GreekVocabularySourceCard[]));
  return lesson9VocabularyPromise;
}

export function loadGreekLesson9GrammarDeck() {
  lesson9GrammarPromise ??= fetchText("data/greek-lesson9-grammar.json").then((text) => grammarDeck(9, JSON.parse(text) as GreekGrammarSourceCard[]));
  return lesson9GrammarPromise;
}

export function loadGreekLesson10VocabularyDeck() {
  lesson10VocabularyPromise ??= fetchText("data/greek-lesson10-vocab.json").then((text) => vocabularyDeck(10, JSON.parse(text) as GreekVocabularySourceCard[]));
  return lesson10VocabularyPromise;
}

export function loadGreekLesson10GrammarDeck() {
  lesson10GrammarPromise ??= fetchText("data/greek-lesson10-grammar.json").then((text) => grammarDeck(10, JSON.parse(text) as GreekGrammarSourceCard[]));
  return lesson10GrammarPromise;
}
