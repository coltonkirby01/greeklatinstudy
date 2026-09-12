import {
  loadGreekDeck,
  loadGreekLesson3GrammarDeck,
  loadGreekLesson3VocabularyDeck,
  loadGreekLesson4GrammarDeck,
  loadGreekLesson4VocabularyDeck,
  loadGreekLesson5GrammarDeck,
  loadGreekLesson5VocabularyDeck,
  loadLatinDeck,
} from "../../data/builtin-decks";
import { loadLatinActiveIndicativeParadigmsDeck } from "../../data/latin-active-indicative-paradigms";
import { loadLatinPassiveIndicativeParadigmsDeck } from "../../data/latin-passive-indicative-paradigms";
import type { DeckDefinition, StudyDirection } from "./types";

export type BuiltinStudyLanguage = "Greek" | "Latin";

export type BuiltinMode = { mode: string; direction: StudyDirection; studyKey: string };
export type BuiltinDeckRegistration = {
  id: string;
  language: BuiltinStudyLanguage;
  source: string;
  load: () => Promise<DeckDefinition>;
  modes: readonly BuiltinMode[];
};

export const BUILTIN_STUDY_DECKS: readonly BuiltinDeckRegistration[] = [
  { id: "greek-i", language: "Greek", source: "Lessons 1–2", load: loadGreekDeck, modes: [{ mode: "Forward", direction: "forward", studyKey: "forward" }, { mode: "Reverse", direction: "reverse", studyKey: "reverse" }] },
  { id: "alpha-omega-lesson3-vocab", language: "Greek", source: "Lesson 3 Vocabulary", load: loadGreekLesson3VocabularyDeck, modes: [{ mode: "Forward", direction: "forward", studyKey: "forward" }, { mode: "Reverse", direction: "reverse", studyKey: "reverse" }] },
  { id: "alpha-omega-lesson3-grammar", language: "Greek", source: "Lesson 3 Grammar", load: loadGreekLesson3GrammarDeck, modes: [{ mode: "Forward", direction: "forward", studyKey: "forward" }] },
  { id: "alpha-omega-lesson4-vocab", language: "Greek", source: "Lesson 4 Vocabulary", load: loadGreekLesson4VocabularyDeck, modes: [{ mode: "Forward", direction: "forward", studyKey: "forward" }, { mode: "Reverse", direction: "reverse", studyKey: "reverse" }] },
  { id: "alpha-omega-lesson4-grammar", language: "Greek", source: "Lesson 4 Grammar", load: loadGreekLesson4GrammarDeck, modes: [{ mode: "Forward", direction: "forward", studyKey: "forward" }] },
  { id: "alpha-omega-lesson5-vocab", language: "Greek", source: "Lesson 5 Vocabulary", load: loadGreekLesson5VocabularyDeck, modes: [{ mode: "Forward", direction: "forward", studyKey: "forward" }, { mode: "Reverse", direction: "reverse", studyKey: "reverse" }] },
  { id: "alpha-omega-lesson5-grammar", language: "Greek", source: "Lesson 5 Grammar", load: loadGreekLesson5GrammarDeck, modes: [{ mode: "Forward", direction: "forward", studyKey: "forward" }] },
  { id: "dickinson-latin-core", language: "Latin", source: "Dickinson Vocabulary", load: loadLatinDeck, modes: [{ mode: "Forward", direction: "forward", studyKey: "forward" }, { mode: "Reverse", direction: "reverse", studyKey: "reverse" }] },
  { id: "latin-active-indicative-paradigms", language: "Latin", source: "Active Indicative Paradigms", load: loadLatinActiveIndicativeParadigmsDeck, modes: [{ mode: "Charts", direction: "forward", studyKey: "chart" }, { mode: "Reverse", direction: "reverse", studyKey: "reverse" }] },
  { id: "latin-passive-indicative-paradigms", language: "Latin", source: "Passive Indicative Paradigms", load: loadLatinPassiveIndicativeParadigmsDeck, modes: [{ mode: "Charts", direction: "forward", studyKey: "chart" }, { mode: "Reverse", direction: "reverse", studyKey: "reverse" }] },
] as const;

const LEGACY_SESSION_DECKS = [{ id: "henle-part1-forms", language: "Latin" as const }] as const;

export function builtinSessionDeckIds(language: BuiltinStudyLanguage) {
  return [
    ...BUILTIN_STUDY_DECKS.filter((deck) => deck.language === language).map((deck) => deck.id),
    ...LEGACY_SESSION_DECKS.filter((deck) => deck.language === language).map((deck) => deck.id),
  ];
}

export function builtinSourceLabel(deckId: string, studyKey: string) {
  const current = BUILTIN_STUDY_DECKS.find((deck) => deck.id === deckId);
  if (current) return current.source;
  if (deckId === "henle-part1-forms") return studyKey.startsWith("chart") ? "Henle Whole Charts" : "Henle Grammar Forms";
  return deckId;
}

export function statsSourcesForBuiltinDeck(registration: BuiltinDeckRegistration, deck: DeckDefinition) {
  if (deck.id !== registration.id) throw new Error(`Built-in study registry mismatch: expected ${registration.id}, loaded ${deck.id}.`);
  return registration.modes.map((mode) => ({
    language: registration.language,
    source: registration.source,
    mode: mode.mode,
    direction: mode.direction,
    deck,
    cards: deck.cards,
    studyKey: mode.studyKey,
  }));
}

export async function loadBuiltinStatsSources() {
  const groups = await Promise.all(BUILTIN_STUDY_DECKS.map(async (registration) => {
    const deck = await registration.load();
    return statsSourcesForBuiltinDeck(registration, deck);
  }));
  return groups.flat();
}
