import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  loadGreekDeck,
  loadGreekLesson3GrammarDeck,
  loadGreekLesson3VocabularyDeck,
  loadGreekLesson4GrammarDeck,
  loadGreekLesson4VocabularyDeck,
  loadGreekLesson5GrammarDeck,
  loadGreekLesson5VocabularyDeck,
  loadGreekLesson6GrammarDeck,
  loadGreekLesson6VocabularyDeck,
  loadGreekLesson7GrammarDeck,
  loadGreekLesson7VocabularyDeck,
} from "../data/builtin-decks";
import { useAuth } from "../features/auth/auth-context";
import { ClassicalGreekAudio } from "../features/greek/classical-greek-audio";
import { useCardExclusions } from "../features/study/card-exclusions";
import { loadGreekFilterSelection, saveGreekFilterSelection } from "../features/study/filter-preferences";
import { MultiSourceStudySession, type StudySourceDefinition } from "../features/study/multi-source-study-session";
import { loadIncludeSavedCards, saveIncludeSavedCards, savedCardRef, useSavedCards } from "../features/study/saved-cards";
import { ExactCardSelection, FilterCheckbox, FilterDisclosure, FilterSection, StudyFilterMenu } from "../features/study/study-filter-menu";
import type { DeckDefinition, StudyCard, StudyDirection } from "../features/study/types";
import { useAsync } from "../hooks/use-async";

const categories = {
  uppercase: "Alphabet — uppercase",
  lowercase: "Alphabet — lowercase",
  punctuation: "Punctuation",
  accents: "Accent marks",
} as const;

const keys = {
  uppercase: "lesson1-uppercase",
  lowercase: "lesson1-lowercase",
  punctuation: "lesson1-punctuation",
  accents: "lesson2-accents",
  lesson3Vocabulary: "lesson3-vocabulary",
  presentActiveIndicativeEndings: "lesson3-present-active-indicative-endings",
  presentActiveInfinitiveEndings: "lesson3-present-active-infinitive-endings",
  presentActiveImperativeEndings: "lesson3-present-active-imperative-endings",
  presentActiveIndicative: "lesson3-present-active-indicative",
  presentActiveInfinitive: "lesson3-present-active-infinitive",
  presentActiveImperative: "lesson3-present-active-imperative",
  lesson4Vocabulary: "lesson4-vocabulary",
  firstDeclensionEndingsAlpha: "lesson4-first-declension-endings-alpha",
  firstDeclensionEndingsEta: "lesson4-first-declension-endings-eta",
  firstDeclensionThea: "lesson4-first-declension-thea",
  firstDeclensionHesychia: "lesson4-first-declension-hesychia",
  firstDeclensionChora: "lesson4-first-declension-chora",
  firstDeclensionSkene: "lesson4-first-declension-skene",
  feminineArticleSingular: "lesson4-feminine-article-singular",
  feminineArticlePlural: "lesson4-feminine-article-plural",
  lesson5Vocabulary: "lesson5-vocabulary",
  firstDeclensionEndingsShortAlphaAs: "lesson5-first-declension-endings-short-alpha-as",
  firstDeclensionEndingsShortAlphaEta: "lesson5-first-declension-endings-short-alpha-eta",
  firstDeclensionMoira: "lesson5-first-declension-moira",
  firstDeclensionThalatta: "lesson5-first-declension-thalatta",
  lesson6Vocabulary: "lesson6-vocabulary",
  futureActiveIndicativeEndings: "lesson6-future-active-indicative-endings",
  futureActiveInfinitiveEndings: "lesson6-future-active-infinitive-endings",
  futureActiveIndicative: "lesson6-future-active-indicative",
  futureActiveInfinitive: "lesson6-future-active-infinitive",
  letterChanges: "lesson6-letter-changes",
  lesson7Vocabulary: "lesson7-vocabulary",
  secondDeclensionMasculineEndings: "lesson7-second-declension-masculine-endings",
  secondDeclensionAnthropos: "lesson7-second-declension-anthropos",
  secondDeclensionPotamos: "lesson7-second-declension-potamos",
  masculineArticleSingular: "lesson7-masculine-article-singular",
  masculineArticlePlural: "lesson7-masculine-article-plural",
} as const;

const allKeys = Object.values(keys);
const lesson1Keys = [keys.uppercase, keys.lowercase, keys.punctuation] as const;
const alphabetKeys = [keys.uppercase, keys.lowercase] as const;
const lesson2Keys = [keys.accents] as const;
const lesson3EndingsKeys = [keys.presentActiveIndicativeEndings, keys.presentActiveInfinitiveEndings, keys.presentActiveImperativeEndings] as const;
const lesson3ParadigmKeys = [keys.presentActiveIndicative, keys.presentActiveInfinitive, keys.presentActiveImperative] as const;
const lesson3GrammarKeys = [...lesson3EndingsKeys, ...lesson3ParadigmKeys] as const;
const lesson3Keys = [keys.lesson3Vocabulary, ...lesson3GrammarKeys] as const;
const lesson4EndingsKeys = [keys.firstDeclensionEndingsAlpha, keys.firstDeclensionEndingsEta, keys.feminineArticleSingular, keys.feminineArticlePlural] as const;
const lesson4ParadigmKeys = [keys.firstDeclensionThea, keys.firstDeclensionHesychia, keys.firstDeclensionChora, keys.firstDeclensionSkene] as const;
const lesson4GrammarKeys = [...lesson4EndingsKeys, ...lesson4ParadigmKeys] as const;
const lesson4Keys = [keys.lesson4Vocabulary, ...lesson4GrammarKeys] as const;
const lesson5EndingsKeys = [keys.firstDeclensionEndingsShortAlphaAs, keys.firstDeclensionEndingsShortAlphaEta] as const;
const lesson5ParadigmKeys = [keys.firstDeclensionMoira, keys.firstDeclensionThalatta] as const;
const lesson5GrammarKeys = [...lesson5EndingsKeys, ...lesson5ParadigmKeys] as const;
const lesson5Keys = [keys.lesson5Vocabulary, ...lesson5GrammarKeys] as const;
const lesson6EndingsKeys = [keys.futureActiveIndicativeEndings, keys.futureActiveInfinitiveEndings] as const;
const lesson6ParadigmKeys = [keys.futureActiveIndicative, keys.futureActiveInfinitive] as const;
const lesson6GrammarKeys = [...lesson6EndingsKeys, ...lesson6ParadigmKeys, keys.letterChanges] as const;
const lesson6Keys = [keys.lesson6Vocabulary, ...lesson6GrammarKeys] as const;
const lesson7EndingsKeys = [keys.secondDeclensionMasculineEndings, keys.masculineArticleSingular, keys.masculineArticlePlural] as const;
const lesson7ParadigmKeys = [keys.secondDeclensionAnthropos, keys.secondDeclensionPotamos] as const;
const lesson7GrammarKeys = [...lesson7EndingsKeys, ...lesson7ParadigmKeys] as const;
const lesson7Keys = [keys.lesson7Vocabulary, ...lesson7GrammarKeys] as const;
const allVocabularyKeys = [keys.lesson3Vocabulary, keys.lesson4Vocabulary, keys.lesson5Vocabulary, keys.lesson6Vocabulary, keys.lesson7Vocabulary] as const;
const allGrammarKeys = [...lesson1Keys, ...lesson2Keys, ...lesson3GrammarKeys, ...lesson4GrammarKeys, ...lesson5GrammarKeys, ...lesson6GrammarKeys, ...lesson7GrammarKeys] as const;

const lesson3GrammarCategoryByKey = new Map<string, string>([
  [keys.presentActiveIndicativeEndings, "Present Active Indicative Endings"],
  [keys.presentActiveInfinitiveEndings, "Present Active Infinitive Endings"],
  [keys.presentActiveImperativeEndings, "Present Active Imperative Endings"],
  [keys.presentActiveIndicative, "Present Active Indicative"],
  [keys.presentActiveInfinitive, "Present Active Infinitive"],
  [keys.presentActiveImperative, "Present Active Imperative"],
]);

const lesson4GrammarCategoryByKey = new Map<string, string>([
  [keys.firstDeclensionEndingsAlpha, "First Declension Feminine Endings — α-type"],
  [keys.firstDeclensionEndingsEta, "First Declension Feminine Endings — η-type"],
  [keys.firstDeclensionThea, "First Declension Feminine Nouns — θεά"],
  [keys.firstDeclensionHesychia, "First Declension Feminine Nouns — ἡσυχίᾱ"],
  [keys.firstDeclensionChora, "First Declension Feminine Nouns — χώρᾱ"],
  [keys.firstDeclensionSkene, "First Declension Feminine Nouns — σκηνή"],
  [keys.feminineArticleSingular, "Feminine Definite Article — Singular"],
  [keys.feminineArticlePlural, "Feminine Definite Article — Plural"],
]);

const lesson5GrammarCategoryByKey = new Map<string, string>([
  [keys.firstDeclensionEndingsShortAlphaAs, "First Declension Feminine Endings — short α, genitive -ᾱς"],
  [keys.firstDeclensionEndingsShortAlphaEta, "First Declension Feminine Endings — short α, genitive -ης"],
  [keys.firstDeclensionMoira, "First Declension Feminine Nouns — μοῖρα"],
  [keys.firstDeclensionThalatta, "First Declension Feminine Nouns — θάλαττα"],
]);

const lesson6GrammarCategoryByKey = new Map<string, string>([
  [keys.futureActiveIndicativeEndings, "Future Active Indicative Endings"],
  [keys.futureActiveInfinitiveEndings, "Future Active Infinitive Endings"],
  [keys.futureActiveIndicative, "Future Active Indicative"],
  [keys.futureActiveInfinitive, "Future Active Infinitive"],
  [keys.letterChanges, "Letter Changes"],
]);

const lesson7GrammarCategoryByKey = new Map<string, string>([
  [keys.secondDeclensionMasculineEndings, "Second Declension Masculine Endings"],
  [keys.secondDeclensionAnthropos, "Second Declension Masculine Nouns — ἄνθρωπος"],
  [keys.secondDeclensionPotamos, "Second Declension Masculine Nouns — ποταμός"],
  [keys.masculineArticleSingular, "Masculine Definite Article — Singular"],
  [keys.masculineArticlePlural, "Masculine Definite Article — Plural"],
]);

type GreekChartRow = { label: string; cells: string[] };

function updateSet(current: Set<string>, values: readonly string[], checked: boolean) {
  const next = new Set(current);
  for (const value of values) checked ? next.add(value) : next.delete(value);
  return next;
}

function groupState(selected: Set<string>, values: readonly string[]) {
  const selectedCount = values.filter((value) => selected.has(value)).length;
  return { checked: selectedCount === values.length, mixed: selectedCount > 0 && selectedCount < values.length, selectedCount };
}

function keyForCategory(map: Map<string, string>, category?: string) {
  if (!category) return null;
  return [...map.entries()].find(([, value]) => value === category)?.[0] ?? null;
}

function chartColumns(card: StudyCard) {
  const columns = card.metadata?.chartColumns;
  return Array.isArray(columns) ? columns.filter((value): value is string => typeof value === "string") : [];
}

function chartRows(card: StudyCard): GreekChartRow[] {
  const rows = card.metadata?.chartRows;
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const value = row as { label?: unknown; cells?: unknown };
    if (typeof value.label !== "string" || !Array.isArray(value.cells) || !value.cells.every((cell) => typeof cell === "string")) return [];
    return [{ label: value.label, cells: value.cells as string[] }];
  });
}

function sourceRef(card: StudyCard) {
  return typeof card.metadata?.sourceRef === "string" ? card.metadata.sourceRef : "";
}

function GreekParadigm({ card }: { card: StudyCard }) {
  const columns = chartColumns(card), rows = chartRows(card);
  const lesson = Number(card.metadata?.lesson ?? 0);
  const explicitRowHeader = typeof card.metadata?.rowHeaderLabel === "string" ? card.metadata.rowHeaderLabel : "";
  const firstColumnLabel = explicitRowHeader || (lesson === 3 || lesson === 6 ? (columns.length === 1 ? "Form" : "Person") : "Case");
  return <div className="chart-scroll">
    <table className="henle-chart">
      <thead><tr><th scope="col">{firstColumnLabel}</th>{columns.map((column) => <th scope="col" key={column}>{column}</th>)}</tr></thead>
      <tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th>{row.cells.map((cell, index) => <td key={`${row.label}-${columns[index] ?? index}`}><strong className="greek-front compact-greek">{cell}</strong></td>)}</tr>)}</tbody>
    </table>
    {sourceRef(card) && <span className="answer-notes">{sourceRef(card)}</span>}
    <ClassicalGreekAudio assetId={card.id} label={card.category ?? "Greek paradigm"} />
  </div>;
}

function GreekCardAudio({ card }: { card: StudyCard }) {
  return <ClassicalGreekAudio assetId={card.id} label={card.front} />;
}

export function GreekPage() {
  const { value: decks, error } = useAsync(async () => {
    const [foundation, lesson3Vocabulary, lesson3Grammar, lesson4Vocabulary, lesson4Grammar, lesson5Vocabulary, lesson5Grammar, lesson6Vocabulary, lesson6Grammar, lesson7Vocabulary, lesson7Grammar] = await Promise.all([
      loadGreekDeck(),
      loadGreekLesson3VocabularyDeck(),
      loadGreekLesson3GrammarDeck(),
      loadGreekLesson4VocabularyDeck(),
      loadGreekLesson4GrammarDeck(),
      loadGreekLesson5VocabularyDeck(),
      loadGreekLesson5GrammarDeck(),
      loadGreekLesson6VocabularyDeck(),
      loadGreekLesson6GrammarDeck(),
      loadGreekLesson7VocabularyDeck(),
      loadGreekLesson7GrammarDeck(),
    ]);
    return { foundation, lesson3Vocabulary, lesson3Grammar, lesson4Vocabulary, lesson4Grammar, lesson5Vocabulary, lesson5Grammar, lesson6Vocabulary, lesson6Grammar, lesson7Vocabulary, lesson7Grammar };
  }, []);
  const { user } = useAuth();
  const savedCards = useSavedCards("greek", user);
  const excludedCards = useCardExclusions("greek");
  const [searchParams] = useSearchParams();
  const [direction, setDirection] = useState<StudyDirection>("forward");
  const [selected, setSelected] = useState<Set<string>>(() => loadGreekFilterSelection(allKeys));
  const [includeSavedCards, setIncludeSavedCards] = useState(() => loadIncludeSavedCards("greek"));
  const resumeSession = useMemo(() => {
    const id = searchParams.get("session"), startedAt = Number(searchParams.get("sessionStartedAt"));
    return id && Number.isFinite(startedAt) && startedAt > 0 ? { id, startedAt } : null;
  }, [searchParams]);

  useEffect(() => { saveGreekFilterSelection(selected); }, [selected]);
  useEffect(() => { saveIncludeSavedCards("greek", includeSavedCards); }, [includeSavedCards]);

  const lesson1State = groupSelectionState( lesson1Keys);
  const alphabetState = groupSelectionState( alphabetKeys);
  const lesson2State = groupSelectionState( lesson2Keys);
  const lesson3State = groupSelectionState( lesson3Keys);
  const lesson3EndingsState = groupSelectionState( lesson3EndingsKeys);
  const lesson3ParadigmState = groupSelectionState( lesson3ParadigmKeys);
  const lesson4State = groupSelectionState( lesson4Keys);
  const lesson4EndingsState = groupSelectionState( lesson4EndingsKeys);
  const lesson4ParadigmState = groupSelectionState( lesson4ParadigmKeys);
  const lesson5State = groupSelectionState( lesson5Keys);
  const lesson5EndingsState = groupSelectionState( lesson5EndingsKeys);
  const lesson5ParadigmState = groupSelectionState( lesson5ParadigmKeys);
  const lesson6State = groupSelectionState( lesson6Keys);
  const lesson6EndingsState = groupSelectionState( lesson6EndingsKeys);
  const lesson6ParadigmState = groupSelectionState( lesson6ParadigmKeys);
  const lesson7State = groupSelectionState( lesson7Keys);
  const lesson7EndingsState = groupSelectionState( lesson7EndingsKeys);
  const lesson7ParadigmState = groupSelectionState( lesson7ParadigmKeys);
  const vocabularyState = groupSelectionState( allVocabularyKeys);
  const grammarState = groupSelectionState( allGrammarKeys);

  const foundationCards = useMemo(() => decks?.foundation.cards.filter((card) => {
    if (excludedCards.refs.has(savedCardRef(decks.foundation.id, card.id))) return false;
    if (card.category === categories.uppercase) return selected.has(keys.uppercase);
    if (card.category === categories.lowercase) return selected.has(keys.lowercase);
    if (card.category === categories.punctuation) return selected.has(keys.punctuation);
    if (card.category === categories.accents) return selected.has(keys.accents);
    return false;
  }) ?? [], [decks, excludedCards.refs, selected]);

  const lesson3VocabularyCards = useMemo(() => selected.has(keys.lesson3Vocabulary) ? decks?.lesson3Vocabulary.cards.filter((card) => !excludedCards.refs.has(savedCardRef(decks.lesson3Vocabulary.id, card.id))) ?? [] : [], [decks, excludedCards.refs, selected]);
  const lesson3GrammarCards = useMemo(() => decks?.lesson3Grammar.cards.filter((card) => {
    if (excludedCards.refs.has(savedCardRef(decks.lesson3Grammar.id, card.id))) return false;
    for (const [key, category] of lesson3GrammarCategoryByKey) if (card.category === category) return selected.has(key);
    return false;
  }) ?? [], [decks, excludedCards.refs, selected]);
  const lesson4VocabularyCards = useMemo(() => selected.has(keys.lesson4Vocabulary) ? decks?.lesson4Vocabulary.cards.filter((card) => !excludedCards.refs.has(savedCardRef(decks.lesson4Vocabulary.id, card.id))) ?? [] : [], [decks, excludedCards.refs, selected]);
  const lesson4GrammarCards = useMemo(() => decks?.lesson4Grammar.cards.filter((card) => {
    if (excludedCards.refs.has(savedCardRef(decks.lesson4Grammar.id, card.id))) return false;
    for (const [key, category] of lesson4GrammarCategoryByKey) if (card.category === category) return selected.has(key);
    return false;
  }) ?? [], [decks, excludedCards.refs, selected]);
  const lesson5VocabularyCards = useMemo(() => selected.has(keys.lesson5Vocabulary) ? decks?.lesson5Vocabulary.cards.filter((card) => !excludedCards.refs.has(savedCardRef(decks.lesson5Vocabulary.id, card.id))) ?? [] : [], [decks, excludedCards.refs, selected]);
  const lesson5GrammarCards = useMemo(() => decks?.lesson5Grammar.cards.filter((card) => {
    if (excludedCards.refs.has(savedCardRef(decks.lesson5Grammar.id, card.id))) return false;
    for (const [key, category] of lesson5GrammarCategoryByKey) if (card.category === category) return selected.has(key);
    return false;
  }) ?? [], [decks, excludedCards.refs, selected]);
  const lesson6VocabularyCards = useMemo(() => selected.has(keys.lesson6Vocabulary) ? decks?.lesson6Vocabulary.cards.filter((card) => !excludedCards.refs.has(savedCardRef(decks.lesson6Vocabulary.id, card.id))) ?? [] : [], [decks, excludedCards.refs, selected]);
  const lesson6GrammarCards = useMemo(() => decks?.lesson6Grammar.cards.filter((card) => {
    if (excludedCards.refs.has(savedCardRef(decks.lesson6Grammar.id, card.id))) return false;
    for (const [key, category] of lesson6GrammarCategoryByKey) if (card.category === category) return selected.has(key);
    return false;
  }) ?? [], [decks, excludedCards.refs, selected]);
  const lesson7VocabularyCards = useMemo(() => selected.has(keys.lesson7Vocabulary) ? decks?.lesson7Vocabulary.cards.filter((card) => !excludedCards.refs.has(savedCardRef(decks.lesson7Vocabulary.id, card.id))) ?? [] : [], [decks, excludedCards.refs, selected]);
  const lesson7GrammarCards = useMemo(() => decks?.lesson7Grammar.cards.filter((card) => {
    if (excludedCards.refs.has(savedCardRef(decks.lesson7Grammar.id, card.id))) return false;
    for (const [key, category] of lesson7GrammarCategoryByKey) if (card.category === category) return selected.has(key);
    return false;
  }) ?? [], [decks, excludedCards.refs, selected]);

  const savedCardCount = useMemo(() => {
    if (!decks) return 0;
    return [decks.foundation, decks.lesson3Vocabulary, decks.lesson3Grammar, decks.lesson4Vocabulary, decks.lesson4Grammar, decks.lesson5Vocabulary, decks.lesson5Grammar, decks.lesson6Vocabulary, decks.lesson6Grammar, decks.lesson7Vocabulary, decks.lesson7Grammar]
      .flatMap((sourceDeck) => sourceDeck.cards.map((card) => savedCardRef(sourceDeck.id, card.id)))
      .filter((ref) => savedCards.refs.has(ref)).length;
  }, [decks, savedCards.refs]);


  const sources = useMemo(() => {
    if (!decks) return [];
    const next: StudySourceDefinition[] = [];
    if (foundationCards.length) next.push({ id: "lessons-1-2", label: "Lessons 1–2 grammar", deck: decks.foundation, cards: foundationCards, studyKey: direction, direction });
    if (lesson3VocabularyCards.length) next.push({ id: "lesson3-vocabulary", label: "Lesson 3 vocabulary", deck: decks.lesson3Vocabulary, cards: lesson3VocabularyCards, studyKey: direction, direction });
    if (lesson3GrammarCards.length) next.push({ id: "lesson3-grammar", label: "Lesson 3 grammar charts", deck: decks.lesson3Grammar, cards: lesson3GrammarCards, studyKey: "forward", direction: "forward" });
    if (lesson4VocabularyCards.length) next.push({ id: "lesson4-vocabulary", label: "Lesson 4 vocabulary", deck: decks.lesson4Vocabulary, cards: lesson4VocabularyCards, studyKey: direction, direction });
    if (lesson4GrammarCards.length) next.push({ id: "lesson4-grammar", label: "Lesson 4 grammar charts", deck: decks.lesson4Grammar, cards: lesson4GrammarCards, studyKey: "forward", direction: "forward" });
    if (lesson5VocabularyCards.length) next.push({ id: "lesson5-vocabulary", label: "Lesson 5 vocabulary", deck: decks.lesson5Vocabulary, cards: lesson5VocabularyCards, studyKey: direction, direction });
    if (lesson5GrammarCards.length) next.push({ id: "lesson5-grammar", label: "Lesson 5 grammar charts", deck: decks.lesson5Grammar, cards: lesson5GrammarCards, studyKey: "forward", direction: "forward" });
    if (lesson6VocabularyCards.length) next.push({ id: "lesson6-vocabulary", label: "Lesson 6 vocabulary", deck: decks.lesson6Vocabulary, cards: lesson6VocabularyCards, studyKey: direction, direction });
    if (lesson6GrammarCards.length) next.push({ id: "lesson6-grammar", label: "Lesson 6 grammar charts", deck: decks.lesson6Grammar, cards: lesson6GrammarCards, studyKey: "forward", direction: "forward" });
    if (lesson7VocabularyCards.length) next.push({ id: "lesson7-vocabulary", label: "Lesson 7 vocabulary", deck: decks.lesson7Vocabulary, cards: lesson7VocabularyCards, studyKey: direction, direction });
    if (lesson7GrammarCards.length) next.push({ id: "lesson7-grammar", label: "Lesson 7 grammar charts", deck: decks.lesson7Grammar, cards: lesson7GrammarCards, studyKey: "forward", direction: "forward" });

    if (includeSavedCards) {
      const alreadySelected = new Set(next.flatMap((source) => source.cards.map((card) => savedCardRef(source.deck.id, card.id))));
      const appendSaved = (id: string, sourceDeck: DeckDefinition, studyKey: string, sourceDirection: StudyDirection) => {
        const cards = sourceDeck.cards.filter((card) => {
          const ref = savedCardRef(sourceDeck.id, card.id);
          return savedCards.refs.has(ref) && !excludedCards.refs.has(ref) && !alreadySelected.has(ref);
        });
        if (!cards.length) return;
        next.push({ id, label: "Saved Cards", deck: sourceDeck, cards, studyKey, direction: sourceDirection });
        cards.forEach((card) => alreadySelected.add(savedCardRef(sourceDeck.id, card.id)));
      };
      appendSaved("saved-lessons-1-2", decks.foundation, direction, direction);
      appendSaved("saved-lesson3-vocabulary", decks.lesson3Vocabulary, direction, direction);
      appendSaved("saved-lesson3-grammar", decks.lesson3Grammar, "forward", "forward");
      appendSaved("saved-lesson4-vocabulary", decks.lesson4Vocabulary, direction, direction);
      appendSaved("saved-lesson4-grammar", decks.lesson4Grammar, "forward", "forward");
      appendSaved("saved-lesson5-vocabulary", decks.lesson5Vocabulary, direction, direction);
      appendSaved("saved-lesson5-grammar", decks.lesson5Grammar, "forward", "forward");
      appendSaved("saved-lesson6-vocabulary", decks.lesson6Vocabulary, direction, direction);
      appendSaved("saved-lesson6-grammar", decks.lesson6Grammar, "forward", "forward");
      appendSaved("saved-lesson7-vocabulary", decks.lesson7Vocabulary, direction, direction);
      appendSaved("saved-lesson7-grammar", decks.lesson7Grammar, "forward", "forward");
    }
    return next;
  }, [decks, direction, excludedCards.refs, foundationCards, includeSavedCards, lesson3GrammarCards, lesson3VocabularyCards, lesson4GrammarCards, lesson4VocabularyCards, lesson5GrammarCards, lesson5VocabularyCards, lesson6GrammarCards, lesson6VocabularyCards, lesson7GrammarCards, lesson7VocabularyCards, savedCards.refs]);

  const selectedCards = useMemo(() => sources.flatMap((source) => source.cards), [sources]);
  const virtualDeck = useMemo<DeckDefinition>(() => ({
    id: "greek-study-app",
    slug: "greek",
    title: "Greek",
    eyebrow: "Grammar · vocabulary",
    description: "One Greek study app combining selected lesson material while preserving each source's progress.",
    language: "greek",
    cards: selectedCards,
    supportsReverse: true,
  }), [selectedCards]);
  const savedSelectionKey = includeSavedCards ? [...savedCards.refs].sort().join(",") : "off";
  const resetKey = `${direction}|${[...selected].sort().join("|")}|saved:${savedSelectionKey}|excluded:${excludedCards.signature}`;

  const countFoundation = (category: string) => decks?.foundation.cards.filter((card) => card.category === category).length ?? 0;
  const countLesson3Grammar = (category: string) => decks?.lesson3Grammar.cards.filter((card) => card.category === category).length ?? 0;
  const countLesson4Grammar = (category: string) => decks?.lesson4Grammar.cards.filter((card) => card.category === category).length ?? 0;
  const countLesson5Grammar = (category: string) => decks?.lesson5Grammar.cards.filter((card) => card.category === category).length ?? 0;
  const countLesson6Grammar = (category: string) => decks?.lesson6Grammar.cards.filter((card) => card.category === category).length ?? 0;
  const countLesson7Grammar = (category: string) => decks?.lesson7Grammar.cards.filter((card) => card.category === category).length ?? 0;
  const savedHint = "Cards you save with the card button or S shortcut are private to your account or this guest browser.";

  function groupKeyForCard(sourceDeck: DeckDefinition, card: StudyCard) {
    if (!decks) return null;
    if (sourceDeck.id === decks.foundation.id) {
      if (card.category === categories.uppercase) return keys.uppercase;
      if (card.category === categories.lowercase) return keys.lowercase;
      if (card.category === categories.punctuation) return keys.punctuation;
      if (card.category === categories.accents) return keys.accents;
      return null;
    }
    if (sourceDeck.id === decks.lesson3Vocabulary.id) return keys.lesson3Vocabulary;
    if (sourceDeck.id === decks.lesson4Vocabulary.id) return keys.lesson4Vocabulary;
    if (sourceDeck.id === decks.lesson5Vocabulary.id) return keys.lesson5Vocabulary;
    if (sourceDeck.id === decks.lesson6Vocabulary.id) return keys.lesson6Vocabulary;
    if (sourceDeck.id === decks.lesson7Vocabulary.id) return keys.lesson7Vocabulary;
    if (sourceDeck.id === decks.lesson3Grammar.id) return keyForCategory(lesson3GrammarCategoryByKey, card.category);
    if (sourceDeck.id === decks.lesson4Grammar.id) return keyForCategory(lesson4GrammarCategoryByKey, card.category);
    if (sourceDeck.id === decks.lesson5Grammar.id) return keyForCategory(lesson5GrammarCategoryByKey, card.category);
    if (sourceDeck.id === decks.lesson6Grammar.id) return keyForCategory(lesson6GrammarCategoryByKey, card.category);
    if (sourceDeck.id === decks.lesson7Grammar.id) return keyForCategory(lesson7GrammarCategoryByKey, card.category);
    return null;
  }

  function cardsForGroupKeys(values: readonly string[]) {
    if (!decks) return [];
    const allowed = new Set(values);
    const sourceDecks = [decks.foundation, decks.lesson3Vocabulary, decks.lesson3Grammar, decks.lesson4Vocabulary, decks.lesson4Grammar, decks.lesson5Vocabulary, decks.lesson5Grammar, decks.lesson6Vocabulary, decks.lesson6Grammar, decks.lesson7Vocabulary, decks.lesson7Grammar];
    return sourceDecks.flatMap((sourceDeck) => sourceDeck.cards.flatMap((card) => {
      const key = groupKeyForCard(sourceDeck, card);
      return key && allowed.has(key) ? [{ deckId: sourceDeck.id, cardId: card.id }] : [];
    }));
  }

  function groupSelectionState(values: readonly string[]) {
    const base = groupState(selected, values);
    const hasExcluded = cardsForGroupKeys(values).some(({ deckId, cardId }) => excludedCards.isExcluded(deckId, cardId));
    return { ...base, checked: base.checked && !hasExcluded, mixed: base.mixed || (base.checked && hasExcluded) };
  }

  function changeGroups(values: readonly string[], checked: boolean) {
    setSelected((current) => updateSet(current, values, checked));
    if (checked) excludedCards.setMany(cardsForGroupKeys(values), false);
  }

  function changeSavedCards(checked: boolean) {
    setIncludeSavedCards(checked);
    if (!checked || !decks) return;
    const sourceDecks = [decks.foundation, decks.lesson3Vocabulary, decks.lesson3Grammar, decks.lesson4Vocabulary, decks.lesson4Grammar, decks.lesson5Vocabulary, decks.lesson5Grammar, decks.lesson6Vocabulary, decks.lesson6Grammar, decks.lesson7Vocabulary, decks.lesson7Grammar];
    const refs = sourceDecks.flatMap((sourceDeck) => sourceDeck.cards
      .filter((card) => savedCards.refs.has(savedCardRef(sourceDeck.id, card.id)))
      .map((card) => ({ deckId: sourceDeck.id, cardId: card.id })));
    excludedCards.setMany(refs, false);
  }

  function exactCardSelected(sourceDeck: DeckDefinition, card: StudyCard) {
    const key = groupKeyForCard(sourceDeck, card);
    return Boolean(key && selected.has(key) && !excludedCards.isExcluded(sourceDeck.id, card.id));
  }

  function changeExactCard(sourceDeck: DeckDefinition, card: StudyCard, checked: boolean) {
    const key = groupKeyForCard(sourceDeck, card);
    if (!key) return;
    if (!checked) {
      excludedCards.exclude(sourceDeck.id, card.id);
      return;
    }
    if (!selected.has(key)) {
      setSelected((current) => new Set(current).add(key));
      const groupCards = sourceDeck.cards.filter((item) => groupKeyForCard(sourceDeck, item) === key);
      excludedCards.setMany(groupCards.map((item) => ({ deckId: sourceDeck.id, cardId: item.id })), true);
    }
    excludedCards.restore(sourceDeck.id, card.id);
  }

  function changeExactDeck(sourceDeck: DeckDefinition, checked: boolean) {
    const deckKeys = [...new Set(sourceDeck.cards.map((card) => groupKeyForCard(sourceDeck, card)).filter((value): value is string => Boolean(value)))];
    if (checked) {
      setSelected((current) => updateSet(current, deckKeys, true));
      excludedCards.setMany(sourceDeck.cards.map((card) => ({ deckId: sourceDeck.id, cardId: card.id })), false);
    } else {
      excludedCards.setMany(sourceDeck.cards.map((card) => ({ deckId: sourceDeck.id, cardId: card.id })), true);
    }
  }

  const individualDecks = decks ? [
    { label: "Lessons 1–2", deck: decks.foundation },
    { label: "Lesson 3 vocabulary", deck: decks.lesson3Vocabulary },
    { label: "Lesson 3 grammar", deck: decks.lesson3Grammar },
    { label: "Lesson 4 vocabulary", deck: decks.lesson4Vocabulary },
    { label: "Lesson 4 grammar", deck: decks.lesson4Grammar },
    { label: "Lesson 5 vocabulary", deck: decks.lesson5Vocabulary },
    { label: "Lesson 5 grammar", deck: decks.lesson5Grammar },
    { label: "Lesson 6 vocabulary", deck: decks.lesson6Vocabulary },
    { label: "Lesson 6 grammar", deck: decks.lesson6Grammar },
    { label: "Lesson 7 vocabulary", deck: decks.lesson7Vocabulary },
    { label: "Lesson 7 grammar", deck: decks.lesson7Grammar },
  ] : [];
  const allIndividualCardCount = individualDecks.reduce((sum, item) => sum + item.deck.cards.length, 0);
  const selectedIndividualCardCount = individualDecks.reduce((sum, item) => sum + item.deck.cards.filter((card) => exactCardSelected(item.deck, card)).length, 0);

  return <main className="page-shell study-page">
    <div className="study-page-heading">
      <div><h1>Greek</h1></div>
    </div>
    {!user && <div className="guest-banner"><span>You are studying as a guest. Progress stays on this device.</span><Link to="/account">Sign in to sync</Link></div>}
    {(error || savedCards.error) && <div className="inline-alert">{error ?? savedCards.error}</div>}

    {decks && <StudyFilterMenu summary={`${selectedCards.length} cards in the current pool`}>
      <FilterSection title="Quick select" onAll={() => { setSelected(new Set(allKeys)); excludedCards.clear(); }} onNone={() => { setSelected(new Set()); setIncludeSavedCards(false); }}>
        <FilterCheckbox label="Saved Cards" count={savedCardCount} checked={includeSavedCards} disabled={!savedCards.ready || savedCardCount === 0} onChange={changeSavedCards} hint={savedHint} />
        <FilterCheckbox label="All Vocabulary" checked={vocabularyState.checked} mixed={vocabularyState.mixed} onChange={(checked) => changeGroups(allVocabularyKeys, checked)} />
        <FilterCheckbox label="All Grammar" checked={grammarState.checked} mixed={grammarState.mixed} onChange={(checked) => changeGroups(allGrammarKeys, checked)} />
      </FilterSection>


      <FilterDisclosure title="Lesson 1" summary={`${lesson1State.selectedCount} of ${lesson1Keys.length} groups selected`} checked={lesson1State.checked} mixed={lesson1State.mixed} onCheckedChange={(checked) => changeGroups(lesson1Keys, checked)}>
        <FilterDisclosure title="Alphabet" summary={`${alphabetState.selectedCount} of ${alphabetKeys.length} cases selected`} count={countFoundation(categories.uppercase) + countFoundation(categories.lowercase)} nested checked={alphabetState.checked} mixed={alphabetState.mixed} onCheckedChange={(checked) => changeGroups(alphabetKeys, checked)}>
          <FilterSection title="Letter case">
            <FilterCheckbox label="Uppercase" count={countFoundation(categories.uppercase)} checked={groupSelectionState([keys.uppercase]).checked} mixed={groupSelectionState([keys.uppercase]).mixed} onChange={(checked) => changeGroups([keys.uppercase], checked)} />
            <FilterCheckbox label="Lowercase" count={countFoundation(categories.lowercase)} checked={groupSelectionState([keys.lowercase]).checked} mixed={groupSelectionState([keys.lowercase]).mixed} onChange={(checked) => changeGroups([keys.lowercase], checked)} />
          </FilterSection>
        </FilterDisclosure>
        <FilterCheckbox label="Punctuation" count={countFoundation(categories.punctuation)} checked={groupSelectionState([keys.punctuation]).checked} mixed={groupSelectionState([keys.punctuation]).mixed} onChange={(checked) => changeGroups([keys.punctuation], checked)} />
      </FilterDisclosure>

      <FilterDisclosure title="Lesson 2" summary={`${lesson2State.selectedCount} of ${lesson2Keys.length} groups selected`} checked={lesson2State.checked} mixed={lesson2State.mixed} onCheckedChange={(checked) => changeGroups(lesson2Keys, checked)}>
        <FilterCheckbox label="Accent marks" count={countFoundation(categories.accents)} checked={groupSelectionState([keys.accents]).checked} mixed={groupSelectionState([keys.accents]).mixed} onChange={(checked) => changeGroups([keys.accents], checked)} />
      </FilterDisclosure>

      <FilterDisclosure title="Lesson 3" summary={`${lesson3State.selectedCount} of ${lesson3Keys.length} groups selected`} checked={lesson3State.checked} mixed={lesson3State.mixed} onCheckedChange={(checked) => changeGroups(lesson3Keys, checked)}>
        <FilterDisclosure title="Vocabulary" summary="11 entries" count={decks.lesson3Vocabulary.cards.length} nested checked={groupSelectionState([keys.lesson3Vocabulary]).checked} mixed={groupSelectionState([keys.lesson3Vocabulary]).mixed} onCheckedChange={(checked) => changeGroups([keys.lesson3Vocabulary], checked)}>
          <FilterCheckbox label="All Lesson 3 vocabulary" count={decks.lesson3Vocabulary.cards.length} checked={groupSelectionState([keys.lesson3Vocabulary]).checked} mixed={groupSelectionState([keys.lesson3Vocabulary]).mixed} onChange={(checked) => changeGroups([keys.lesson3Vocabulary], checked)} />
        </FilterDisclosure>

        <FilterDisclosure title="Endings" summary={`${lesson3EndingsState.selectedCount} of ${lesson3EndingsKeys.length} selected`} count={lesson3EndingsKeys.length} nested checked={lesson3EndingsState.checked} mixed={lesson3EndingsState.mixed} onCheckedChange={(checked) => changeGroups(lesson3EndingsKeys, checked)}>
          <FilterCheckbox label="Present Active Indicative Endings" count={countLesson3Grammar("Present Active Indicative Endings")} checked={groupSelectionState([keys.presentActiveIndicativeEndings]).checked} mixed={groupSelectionState([keys.presentActiveIndicativeEndings]).mixed} onChange={(checked) => changeGroups([keys.presentActiveIndicativeEndings], checked)} />
          <FilterCheckbox label="Present Active Infinitive Ending" count={countLesson3Grammar("Present Active Infinitive Endings")} checked={groupSelectionState([keys.presentActiveInfinitiveEndings]).checked} mixed={groupSelectionState([keys.presentActiveInfinitiveEndings]).mixed} onChange={(checked) => changeGroups([keys.presentActiveInfinitiveEndings], checked)} />
          <FilterCheckbox label="Present Active Imperative Endings" count={countLesson3Grammar("Present Active Imperative Endings")} checked={groupSelectionState([keys.presentActiveImperativeEndings]).checked} mixed={groupSelectionState([keys.presentActiveImperativeEndings]).mixed} onChange={(checked) => changeGroups([keys.presentActiveImperativeEndings], checked)} />
        </FilterDisclosure>

        <FilterDisclosure title="Paradigms" summary={`${lesson3ParadigmState.selectedCount} of ${lesson3ParadigmKeys.length} selected`} count={lesson3ParadigmKeys.length} nested checked={lesson3ParadigmState.checked} mixed={lesson3ParadigmState.mixed} onCheckedChange={(checked) => changeGroups(lesson3ParadigmKeys, checked)}>
          <FilterCheckbox label="Present Active Indicative — παιδεύω" count={countLesson3Grammar("Present Active Indicative")} checked={groupSelectionState([keys.presentActiveIndicative]).checked} mixed={groupSelectionState([keys.presentActiveIndicative]).mixed} onChange={(checked) => changeGroups([keys.presentActiveIndicative], checked)} />
          <FilterCheckbox label="Present Active Infinitive — παιδεύω" count={countLesson3Grammar("Present Active Infinitive")} checked={groupSelectionState([keys.presentActiveInfinitive]).checked} mixed={groupSelectionState([keys.presentActiveInfinitive]).mixed} onChange={(checked) => changeGroups([keys.presentActiveInfinitive], checked)} />
          <FilterCheckbox label="Present Active Imperative — παιδεύω" count={countLesson3Grammar("Present Active Imperative")} checked={groupSelectionState([keys.presentActiveImperative]).checked} mixed={groupSelectionState([keys.presentActiveImperative]).mixed} onChange={(checked) => changeGroups([keys.presentActiveImperative], checked)} />
        </FilterDisclosure>
      </FilterDisclosure>

      <FilterDisclosure title="Lesson 4" summary={`${lesson4State.selectedCount} of ${lesson4Keys.length} groups selected`} checked={lesson4State.checked} mixed={lesson4State.mixed} onCheckedChange={(checked) => changeGroups(lesson4Keys, checked)}>
        <FilterDisclosure title="Vocabulary" summary={`${decks.lesson4Vocabulary.cards.length} entries`} count={decks.lesson4Vocabulary.cards.length} nested checked={groupSelectionState([keys.lesson4Vocabulary]).checked} mixed={groupSelectionState([keys.lesson4Vocabulary]).mixed} onCheckedChange={(checked) => changeGroups([keys.lesson4Vocabulary], checked)}>
          <FilterCheckbox label="All Lesson 4 vocabulary" count={decks.lesson4Vocabulary.cards.length} checked={groupSelectionState([keys.lesson4Vocabulary]).checked} mixed={groupSelectionState([keys.lesson4Vocabulary]).mixed} onChange={(checked) => changeGroups([keys.lesson4Vocabulary], checked)} />
        </FilterDisclosure>

        <FilterDisclosure title="Endings" summary={`${lesson4EndingsState.selectedCount} of ${lesson4EndingsKeys.length} selected`} count={lesson4EndingsKeys.length} nested checked={lesson4EndingsState.checked} mixed={lesson4EndingsState.mixed} onCheckedChange={(checked) => changeGroups(lesson4EndingsKeys, checked)}>
          {lesson4EndingsKeys.map((key) => {
            const category = lesson4GrammarCategoryByKey.get(key)!;
            return <FilterCheckbox key={key} label={category} count={countLesson4Grammar(category)} checked={groupSelectionState([key]).checked} mixed={groupSelectionState([key]).mixed} onChange={(checked) => changeGroups([key], checked)} />;
          })}
        </FilterDisclosure>

        <FilterDisclosure title="Paradigms" summary={`${lesson4ParadigmState.selectedCount} of ${lesson4ParadigmKeys.length} selected`} count={lesson4ParadigmKeys.length} nested checked={lesson4ParadigmState.checked} mixed={lesson4ParadigmState.mixed} onCheckedChange={(checked) => changeGroups(lesson4ParadigmKeys, checked)}>
          {lesson4ParadigmKeys.map((key) => {
            const category = lesson4GrammarCategoryByKey.get(key)!;
            return <FilterCheckbox key={key} label={category} count={countLesson4Grammar(category)} checked={groupSelectionState([key]).checked} mixed={groupSelectionState([key]).mixed} onChange={(checked) => changeGroups([key], checked)} />;
          })}
        </FilterDisclosure>
      </FilterDisclosure>

      <FilterDisclosure title="Lesson 5" summary={`${lesson5State.selectedCount} of ${lesson5Keys.length} groups selected`} checked={lesson5State.checked} mixed={lesson5State.mixed} onCheckedChange={(checked) => changeGroups(lesson5Keys, checked)}>
        <FilterDisclosure title="Vocabulary" summary={`${decks.lesson5Vocabulary.cards.length} entries`} count={decks.lesson5Vocabulary.cards.length} nested checked={groupSelectionState([keys.lesson5Vocabulary]).checked} mixed={groupSelectionState([keys.lesson5Vocabulary]).mixed} onCheckedChange={(checked) => changeGroups([keys.lesson5Vocabulary], checked)}>
          <FilterCheckbox label="All Lesson 5 vocabulary" count={decks.lesson5Vocabulary.cards.length} checked={groupSelectionState([keys.lesson5Vocabulary]).checked} mixed={groupSelectionState([keys.lesson5Vocabulary]).mixed} onChange={(checked) => changeGroups([keys.lesson5Vocabulary], checked)} />
        </FilterDisclosure>

        <FilterDisclosure title="Endings" summary={`${lesson5EndingsState.selectedCount} of ${lesson5EndingsKeys.length} selected`} count={lesson5EndingsKeys.length} nested checked={lesson5EndingsState.checked} mixed={lesson5EndingsState.mixed} onCheckedChange={(checked) => changeGroups(lesson5EndingsKeys, checked)}>
          {lesson5EndingsKeys.map((key) => {
            const category = lesson5GrammarCategoryByKey.get(key)!;
            return <FilterCheckbox key={key} label={category} count={countLesson5Grammar(category)} checked={groupSelectionState([key]).checked} mixed={groupSelectionState([key]).mixed} onChange={(checked) => changeGroups([key], checked)} />;
          })}
        </FilterDisclosure>

        <FilterDisclosure title="Paradigms" summary={`${lesson5ParadigmState.selectedCount} of ${lesson5ParadigmKeys.length} selected`} count={lesson5ParadigmKeys.length} nested checked={lesson5ParadigmState.checked} mixed={lesson5ParadigmState.mixed} onCheckedChange={(checked) => changeGroups(lesson5ParadigmKeys, checked)}>
          {lesson5ParadigmKeys.map((key) => {
            const category = lesson5GrammarCategoryByKey.get(key)!;
            return <FilterCheckbox key={key} label={category} count={countLesson5Grammar(category)} checked={groupSelectionState([key]).checked} mixed={groupSelectionState([key]).mixed} onChange={(checked) => changeGroups([key], checked)} />;
          })}
        </FilterDisclosure>
      </FilterDisclosure>

      <FilterDisclosure title="Lesson 6" summary={`${lesson6State.selectedCount} of ${lesson6Keys.length} groups selected`} checked={lesson6State.checked} mixed={lesson6State.mixed} onCheckedChange={(checked) => changeGroups(lesson6Keys, checked)}>
        <FilterDisclosure title="Vocabulary" summary={`${decks.lesson6Vocabulary.cards.length} entries`} count={decks.lesson6Vocabulary.cards.length} nested checked={groupSelectionState([keys.lesson6Vocabulary]).checked} mixed={groupSelectionState([keys.lesson6Vocabulary]).mixed} onCheckedChange={(checked) => changeGroups([keys.lesson6Vocabulary], checked)}>
          <FilterCheckbox label="All Lesson 6 vocabulary" count={decks.lesson6Vocabulary.cards.length} checked={groupSelectionState([keys.lesson6Vocabulary]).checked} mixed={groupSelectionState([keys.lesson6Vocabulary]).mixed} onChange={(checked) => changeGroups([keys.lesson6Vocabulary], checked)} />
        </FilterDisclosure>

        <FilterDisclosure title="Endings" summary={`${lesson6EndingsState.selectedCount} of ${lesson6EndingsKeys.length} selected`} count={lesson6EndingsKeys.length} nested checked={lesson6EndingsState.checked} mixed={lesson6EndingsState.mixed} onCheckedChange={(checked) => changeGroups(lesson6EndingsKeys, checked)}>
          {lesson6EndingsKeys.map((key) => {
            const category = lesson6GrammarCategoryByKey.get(key)!;
            return <FilterCheckbox key={key} label={category} count={countLesson6Grammar(category)} checked={groupSelectionState([key]).checked} mixed={groupSelectionState([key]).mixed} onChange={(checked) => changeGroups([key], checked)} />;
          })}
        </FilterDisclosure>

        <FilterDisclosure title="Paradigms" summary={`${lesson6ParadigmState.selectedCount} of ${lesson6ParadigmKeys.length} selected`} count={lesson6ParadigmKeys.length} nested checked={lesson6ParadigmState.checked} mixed={lesson6ParadigmState.mixed} onCheckedChange={(checked) => changeGroups(lesson6ParadigmKeys, checked)}>
          {lesson6ParadigmKeys.map((key) => {
            const category = lesson6GrammarCategoryByKey.get(key)!;
            return <FilterCheckbox key={key} label={`${category} — παιδεύω`} count={countLesson6Grammar(category)} checked={groupSelectionState([key]).checked} mixed={groupSelectionState([key]).mixed} onChange={(checked) => changeGroups([key], checked)} />;
          })}
        </FilterDisclosure>

        <FilterCheckbox label="Letter Changes" count={countLesson6Grammar("Letter Changes")} checked={groupSelectionState([keys.letterChanges]).checked} mixed={groupSelectionState([keys.letterChanges]).mixed} onChange={(checked) => changeGroups([keys.letterChanges], checked)} />
      </FilterDisclosure>

      <FilterDisclosure title="Lesson 7" summary={`${lesson7State.selectedCount} of ${lesson7Keys.length} groups selected`} checked={lesson7State.checked} mixed={lesson7State.mixed} onCheckedChange={(checked) => changeGroups(lesson7Keys, checked)}>
        <FilterDisclosure title="Vocabulary" summary={`${decks.lesson7Vocabulary.cards.length} entries`} count={decks.lesson7Vocabulary.cards.length} nested checked={groupSelectionState([keys.lesson7Vocabulary]).checked} mixed={groupSelectionState([keys.lesson7Vocabulary]).mixed} onCheckedChange={(checked) => changeGroups([keys.lesson7Vocabulary], checked)}>
          <FilterCheckbox label="All Lesson 7 vocabulary" count={decks.lesson7Vocabulary.cards.length} checked={groupSelectionState([keys.lesson7Vocabulary]).checked} mixed={groupSelectionState([keys.lesson7Vocabulary]).mixed} onChange={(checked) => changeGroups([keys.lesson7Vocabulary], checked)} />
        </FilterDisclosure>

        <FilterDisclosure title="Endings" summary={`${lesson7EndingsState.selectedCount} of ${lesson7EndingsKeys.length} selected`} count={lesson7EndingsKeys.length} nested checked={lesson7EndingsState.checked} mixed={lesson7EndingsState.mixed} onCheckedChange={(checked) => changeGroups(lesson7EndingsKeys, checked)}>
          {lesson7EndingsKeys.map((key) => {
            const category = lesson7GrammarCategoryByKey.get(key)!;
            return <FilterCheckbox key={key} label={category} count={countLesson7Grammar(category)} checked={groupSelectionState([key]).checked} mixed={groupSelectionState([key]).mixed} onChange={(checked) => changeGroups([key], checked)} />;
          })}
        </FilterDisclosure>

        <FilterDisclosure title="Paradigms" summary={`${lesson7ParadigmState.selectedCount} of ${lesson7ParadigmKeys.length} selected`} count={lesson7ParadigmKeys.length} nested checked={lesson7ParadigmState.checked} mixed={lesson7ParadigmState.mixed} onCheckedChange={(checked) => changeGroups(lesson7ParadigmKeys, checked)}>
          {lesson7ParadigmKeys.map((key) => {
            const category = lesson7GrammarCategoryByKey.get(key)!;
            return <FilterCheckbox key={key} label={category} count={countLesson7Grammar(category)} checked={groupSelectionState([key]).checked} mixed={groupSelectionState([key]).mixed} onChange={(checked) => changeGroups([key], checked)} />;
          })}
        </FilterDisclosure>
      </FilterDisclosure>

      <FilterDisclosure title="Individual cards" summary={`${selectedIndividualCardCount} of ${allIndividualCardCount} selected`} count={allIndividualCardCount} checked={selectedIndividualCardCount === allIndividualCardCount} mixed={selectedIndividualCardCount > 0 && selectedIndividualCardCount < allIndividualCardCount} onCheckedChange={(checked) => individualDecks.forEach(({ deck: sourceDeck }) => changeExactDeck(sourceDeck, checked))}>
        {individualDecks.map(({ label, deck: sourceDeck }) => {
          const selectedCount = sourceDeck.cards.filter((card) => exactCardSelected(sourceDeck, card)).length;
          return <FilterDisclosure key={sourceDeck.id} title={label} summary={`${selectedCount} of ${sourceDeck.cards.length} selected`} count={sourceDeck.cards.length} nested checked={selectedCount === sourceDeck.cards.length} mixed={selectedCount > 0 && selectedCount < sourceDeck.cards.length} onCheckedChange={(checked) => changeExactDeck(sourceDeck, checked)}>
            <ExactCardSelection cards={sourceDeck.cards} isSelected={(card) => exactCardSelected(sourceDeck, card)} onCardChange={(card, checked) => changeExactCard(sourceDeck, card, checked)} />
          </FilterDisclosure>;
        })}
      </FilterDisclosure>
    </StudyFilterMenu>}

    {decks ? <MultiSourceStudySession
      deck={virtualDeck}
      sources={sources}
      resetKey={resetKey}
      direction={direction}
      onDirectionChange={setDirection}
      directionLabels={{ forward: "Forward", reverse: "Reverse" }}
      resumeSession={resumeSession}
      savedCardRefs={savedCards.refs}
      onToggleSavedCard={savedCards.toggleSaved}
      onDeselectCard={excludedCards.exclude}
      cardMeta={(card, source) => source.deck.id === decks.foundation.id ? `Lessons ${Number(card.metadata?.lesson ?? 1)} · Card ${card.rank ?? 0}` : source.deck.id === decks.lesson3Vocabulary.id ? `Lesson 3 vocabulary · ${card.notes ?? ""}` : source.deck.id === decks.lesson4Vocabulary.id ? `Lesson 4 vocabulary · ${card.notes ?? ""}` : source.deck.id === decks.lesson5Vocabulary.id ? `Lesson 5 vocabulary · ${card.notes ?? ""}` : source.deck.id === decks.lesson6Vocabulary.id ? `Lesson 6 vocabulary · ${card.notes ?? ""}` : source.deck.id === decks.lesson7Vocabulary.id ? `Lesson 7 vocabulary · ${card.notes ?? ""}` : `Lesson ${Number(card.metadata?.lesson ?? 3)} grammar · ${card.category ?? ""}`}
      renderFront={(card, copy, source) => {
        if (source.deck.id === decks.lesson3Grammar.id || source.deck.id === decks.lesson4Grammar.id || source.deck.id === decks.lesson5Grammar.id || source.deck.id === decks.lesson6Grammar.id || source.deck.id === decks.lesson7Grammar.id) return <span className="study-prompt reverse-text-prompt">{card.front}</span>;
        return <span className={source.direction === "forward" ? "greek-front" : "study-prompt reverse-text-prompt"}>{copy.prompt}</span>;
      }}
      renderBack={(card, copy, source) => {
        if (source.deck.id === decks.foundation.id) {
          const details = source.direction === "forward" ? card.back.split("\n").slice(1).join("\n") : card.reverseBack?.split("\n").slice(1).join("\n");
          return <div className="answer-block"><strong className={source.direction === "reverse" ? "greek-front compact-greek" : "greek-answer-title"}>{source.direction === "reverse" ? card.front : String(card.metadata?.backTitle ?? "Answer")}</strong><span className="answer-notes">{details}</span>{sourceRef(card) && <span className="answer-notes">{sourceRef(card)}</span>}<GreekCardAudio card={card} /></div>;
        }
        if (source.deck.id === decks.lesson3Grammar.id || source.deck.id === decks.lesson4Grammar.id || source.deck.id === decks.lesson5Grammar.id || source.deck.id === decks.lesson6Grammar.id || source.deck.id === decks.lesson7Grammar.id) return <div className="answer-block"><GreekParadigm card={card} /></div>;
        return <div className="answer-block"><strong className={source.direction === "reverse" ? "greek-front compact-greek" : "study-answer"}>{copy.answer}</strong>{card.notes && <span className="answer-notes">{card.notes}</span>}{sourceRef(card) && <span className="answer-notes">{sourceRef(card)}</span>}<GreekCardAudio card={card} /></div>;
      }}
    /> : <div className="study-loading panel-surface"><span className="loading-mark">α</span><p>Preparing Greek…</p></div>}
  </main>;
}
