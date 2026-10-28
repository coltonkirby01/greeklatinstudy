import type { DeckDefinition, StudyCard } from "../features/study/types";
import { classicalGreekPronunciation } from "../features/greek/greek-pronunciation";
import { greekLesson3ParadigmSpeechText } from "./builtin-decks";

type GrotonLesson = 9 | 10 | 11 | 12 | 13 | 14;

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

function vocabularySourceNote(lesson: GrotonLesson) {
  if (lesson === 9) return "Groton 9.63.";
  if (lesson === 10) return "Groton 10.69.";
  if (lesson === 11) return "Groton 11.77.";
  if (lesson === 12) return "Groton 12.81.";
  if (lesson === 13) return "Groton 13.85.";
  return "Groton 14.89.";
}

function vocabularyDeck(lesson: GrotonLesson, source: GreekVocabularySourceCard[]): DeckDefinition {
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
    sourceNote: vocabularySourceNote(lesson),
  };
}

function grammarDeck(lesson: GrotonLesson, source: GreekGrammarSourceCard[]): DeckDefinition {
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
      notes: [lesson === 12 ? "Irregular-form chart" : lesson >= 13 ? "Pronoun-form chart" : isEndingChart ? "Ending chart" : "Whole-paradigm chart", card.accent_note].filter(Boolean).join(" · "),
      metadata: {
        lesson,
        studySource: "grammar-chart",
        grammarGroup: card.category,
        chartColumns: card.columns,
        chartRows,
        rowHeaderLabel: lesson === 9 || lesson >= 13 ? "Case" : card.columns.length === 1 ? "Form" : "Person",
        pronunciationText: greekLesson3ParadigmSpeechText(chartRows),
        accentNote: card.accent_note,
        sourceRef: card.source_ref ?? `Groton Lesson ${lesson}`,
      },
    };
  });

  const lessonDetails = lesson === 9
    ? {
        eyebrow: "First-declension masculine nouns",
        description: "Three Lesson 9 grammar cards: first-declension masculine endings and the μαθητής / νεᾱνίᾱς model paradigms.",
        sourceNote: "Groton 9.58.",
      }
    : lesson === 10
      ? {
          eyebrow: "Imperfect active indicative",
          description: "Two Lesson 10 grammar cards: imperfect active indicative endings and the παιδεύω model paradigm.",
          sourceNote: "Groton Lesson 10, pp. 57–59.",
        }
      : lesson === 11
        ? {
            eyebrow: "Middle/passive endings",
            description: "Six Lesson 11 ending charts covering present middle/passive, future middle, imperfect middle/passive, and present middle/passive imperative and infinitive forms.",
            sourceNote: "Groton Lesson 11, §§71–73, pp. 63–66.",
          }
        : lesson === 12
          ? {
              eyebrow: "εἰμί forms",
              description: "Six Lesson 12 morphology charts for the irregular verb εἰμί: present, future, imperfect, imperative, and infinitive forms.",
              sourceNote: "Groton Lesson 12, §79, pp. 71–72.",
            }
          : lesson === 13
            ? {
                eyebrow: "Demonstratives",
                description: "Six singular/plural form charts for ὅδε, οὗτος, and ἐκεῖνος.",
                sourceNote: "Groton Lesson 13, pp. 77–80.",
              }
            : {
                eyebrow: "Personal pronouns",
                description: "Three pronoun form charts: first person, second person, and combined singular/plural αὐτός.",
                sourceNote: "Groton Lesson 14, §§87–88, pp. 83–84.",
              };

  return {
    id,
    slug: "greek",
    title: `Greek Lesson ${lesson} Grammar`,
    eyebrow: lessonDetails.eyebrow,
    description: lessonDetails.description,
    language: "greek",
    cards,
    supportsReverse: false,
    sourceNote: lessonDetails.sourceNote,
  };
}

let lesson9VocabularyPromise: Promise<DeckDefinition> | null = null;
let lesson9GrammarPromise: Promise<DeckDefinition> | null = null;
let lesson10VocabularyPromise: Promise<DeckDefinition> | null = null;
let lesson10GrammarPromise: Promise<DeckDefinition> | null = null;
let lesson11VocabularyPromise: Promise<DeckDefinition> | null = null;
let lesson11GrammarPromise: Promise<DeckDefinition> | null = null;
let lesson12VocabularyPromise: Promise<DeckDefinition> | null = null;
let lesson12GrammarPromise: Promise<DeckDefinition> | null = null;

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

export function loadGreekLesson11VocabularyDeck() {
  lesson11VocabularyPromise ??= fetchText("data/greek-lesson11-vocab.json").then((text) => vocabularyDeck(11, JSON.parse(text) as GreekVocabularySourceCard[]));
  return lesson11VocabularyPromise;
}

export function loadGreekLesson11GrammarDeck() {
  lesson11GrammarPromise ??= fetchText("data/greek-lesson11-grammar.json").then((text) => grammarDeck(11, JSON.parse(text) as GreekGrammarSourceCard[]));
  return lesson11GrammarPromise;
}

export function loadGreekLesson12VocabularyDeck() {
  lesson12VocabularyPromise ??= fetchText("data/greek-lesson12-vocab.json").then((text) => vocabularyDeck(12, JSON.parse(text) as GreekVocabularySourceCard[]));
  return lesson12VocabularyPromise;
}

export function loadGreekLesson12GrammarDeck() {
  lesson12GrammarPromise ??= fetchText("data/greek-lesson12-grammar.json").then((text) => grammarDeck(12, JSON.parse(text) as GreekGrammarSourceCard[]));
  return lesson12GrammarPromise;
}

let lesson13VocabularyPromise: Promise<DeckDefinition> | null = null;
let lesson13GrammarPromise: Promise<DeckDefinition> | null = null;
let lesson14VocabularyPromise: Promise<DeckDefinition> | null = null;
let lesson14GrammarPromise: Promise<DeckDefinition> | null = null;

export function loadGreekLesson13VocabularyDeck() {
  lesson13VocabularyPromise ??= fetchText("data/greek-lesson13-vocab.json").then(text => vocabularyDeck(13, JSON.parse(text) as GreekVocabularySourceCard[]));
  return lesson13VocabularyPromise;
}
export function loadGreekLesson13GrammarDeck() {
  lesson13GrammarPromise ??= fetchText("data/greek-lesson13-grammar.json").then(text => grammarDeck(13, JSON.parse(text) as GreekGrammarSourceCard[]));
  return lesson13GrammarPromise;
}
export function loadGreekLesson14VocabularyDeck() {
  lesson14VocabularyPromise ??= fetchText("data/greek-lesson14-vocab.json").then(text => vocabularyDeck(14, JSON.parse(text) as GreekVocabularySourceCard[]));
  return lesson14VocabularyPromise;
}
export function loadGreekLesson14GrammarDeck() {
  lesson14GrammarPromise ??= fetchText("data/greek-lesson14-grammar.json").then(text => grammarDeck(14, JSON.parse(text) as GreekGrammarSourceCard[]));
  return lesson14GrammarPromise;
}
