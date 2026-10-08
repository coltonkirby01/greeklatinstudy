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
  loadGreekLesson8GrammarDeck,
  loadGreekLesson8VocabularyDeck,
} from "../data/builtin-decks";
import {
  loadGreekLesson9GrammarDeck,
  loadGreekLesson9VocabularyDeck,
  loadGreekLesson10GrammarDeck,
  loadGreekLesson10VocabularyDeck,
} from "../data/greek-lessons-9-10";
import {
  loadGreekLesson11GrammarDeck,
  loadGreekLesson11VocabularyDeck,
} from "../data/greek-lesson11";
import { NEW_TESTAMENT_FREQUENCY_GROUPS, loadGreekNewTestamentVocabularyDeck, newTestamentFrequencyGroupForCard } from "../data/greek-new-testament-vocab";
import { useAuth } from "../features/auth/auth-context";
import { ClassicalGreekAudio } from "../features/greek/classical-greek-audio";
import { oneWordVocabularyGloss } from "../features/greek/vocabulary-selector-gloss";
import { useCardExclusions } from "../features/study/card-exclusions";
import { loadGreekFilterSelection, saveGreekFilterSelection } from "../features/study/filter-preferences";
import { MultiSourceStudySession, type StudySourceDefinition } from "../features/study/multi-source-study-session";
import { loadIncludeSavedCards, saveIncludeSavedCards, savedCardRef, useSavedCards } from "../features/study/saved-cards";
import { SavedCardsFilter, type SavedCardFilterItem } from "../features/study/saved-cards-filter";
import { SelectedCardsProvider, type SelectedCardPanelItem } from "../features/study/selected-cards-context";
import { FilterCheckbox, FilterDirectionControl, FilterDisclosure, FilterSection, StudyFilterMenu } from "../features/study/study-filter-menu";
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
  lesson4Vocabulary: "lesson4-vocabulary",
  firstDeclensionEndingsAlpha: "lesson4-first-declension-endings-alpha",
  firstDeclensionEndingsEta: "lesson4-first-declension-endings-eta",
  feminineArticleSingular: "lesson4-feminine-article-singular",
  feminineArticlePlural: "lesson4-feminine-article-plural",
  lesson5Vocabulary: "lesson5-vocabulary",
  firstDeclensionEndingsShortAlphaAs: "lesson5-first-declension-endings-short-alpha-as",
  firstDeclensionEndingsShortAlphaEta: "lesson5-first-declension-endings-short-alpha-eta",
  lesson6Vocabulary: "lesson6-vocabulary",
  futureActiveIndicativeEndings: "lesson6-future-active-indicative-endings",
  futureActiveInfinitiveEndings: "lesson6-future-active-infinitive-endings",
  lesson7Vocabulary: "lesson7-vocabulary",
  secondDeclensionMasculineEndings: "lesson7-second-declension-masculine-endings",
  masculineArticleSingular: "lesson7-masculine-article-singular",
  masculineArticlePlural: "lesson7-masculine-article-plural",
  lesson8Vocabulary: "lesson8-vocabulary",
  secondDeclensionNeuterEndings: "lesson8-second-declension-neuter-endings",
  neuterArticleSingular: "lesson8-neuter-article-singular",
  neuterArticlePlural: "lesson8-neuter-article-plural",
  adjectiveMasculineEndings: "lesson8-adjective-masculine-endings",
  adjectiveFeminineEndings: "lesson8-adjective-feminine-endings",
  adjectiveNeuterEndings: "lesson8-adjective-neuter-endings",
  lesson9Vocabulary: "lesson9-vocabulary",
  firstDeclensionMasculineEndings: "lesson9-first-declension-masculine-endings",
  lesson10Vocabulary: "lesson10-vocabulary",
  imperfectActiveIndicativeEndings: "lesson10-imperfect-active-indicative-endings",
  lesson11Vocabulary: "lesson11-vocabulary",
  presentMiddlePassiveIndicativeEndings: "lesson11-present-middle-passive-indicative-endings",
  presentMiddlePassiveInfinitiveEndings: "lesson11-present-middle-passive-infinitive-endings",
  futureMiddleIndicativeEndings: "lesson11-future-middle-indicative-endings",
  futureMiddleInfinitiveEndings: "lesson11-future-middle-infinitive-endings",
  imperfectMiddlePassiveIndicativeEndings: "lesson11-imperfect-middle-passive-indicative-endings",
  presentMiddlePassiveImperativeEndings: "lesson11-present-middle-passive-imperative-endings",
} as const;

type KeyValue = (typeof keys)[keyof typeof keys];
type GreekChartRow = { label: string; cells: string[] };

type LoadedDecks = {
  foundation: DeckDefinition;
  lesson3Vocabulary: DeckDefinition;
  lesson3Grammar: DeckDefinition;
  lesson4Vocabulary: DeckDefinition;
  lesson4Grammar: DeckDefinition;
  lesson5Vocabulary: DeckDefinition;
  lesson5Grammar: DeckDefinition;
  lesson6Vocabulary: DeckDefinition;
  lesson6Grammar: DeckDefinition;
  lesson7Vocabulary: DeckDefinition;
  lesson7Grammar: DeckDefinition;
  lesson8Vocabulary: DeckDefinition;
  lesson8Grammar: DeckDefinition;
  lesson9Vocabulary: DeckDefinition;
  lesson9Grammar: DeckDefinition;
  lesson10Vocabulary: DeckDefinition;
  lesson10Grammar: DeckDefinition;
  lesson11Vocabulary: DeckDefinition;
  lesson11Grammar: DeckDefinition;
  newTestamentVocabulary: DeckDefinition;
};

type LessonConfig = {
  lesson: number;
  vocabularyKey: KeyValue;
  vocabularyDeck: keyof LoadedDecks;
  grammarDeck: keyof LoadedDecks;
  endingKeys: readonly KeyValue[];
  categoryByKey: ReadonlyMap<string, string>;
};

const lesson1Keys = [keys.uppercase, keys.lowercase, keys.punctuation] as const;
const alphabetKeys = [keys.uppercase, keys.lowercase] as const;
const lesson2Keys = [keys.accents] as const;

const lesson3CategoryByKey = new Map<string, string>([
  [keys.presentActiveIndicativeEndings, "Present Active Indicative Endings"],
  [keys.presentActiveInfinitiveEndings, "Present Active Infinitive Endings"],
  [keys.presentActiveImperativeEndings, "Present Active Imperative Endings"],
]);
const lesson4CategoryByKey = new Map<string, string>([
  [keys.firstDeclensionEndingsAlpha, "First Declension Feminine Endings — α-type"],
  [keys.firstDeclensionEndingsEta, "First Declension Feminine Endings — η-type"],
  [keys.feminineArticleSingular, "Feminine Definite Article — Singular"],
  [keys.feminineArticlePlural, "Feminine Definite Article — Plural"],
]);
const lesson5CategoryByKey = new Map<string, string>([
  [keys.firstDeclensionEndingsShortAlphaAs, "First Declension Feminine Endings — short α, genitive -ᾱς"],
  [keys.firstDeclensionEndingsShortAlphaEta, "First Declension Feminine Endings — short α, genitive -ης"],
]);
const lesson6CategoryByKey = new Map<string, string>([
  [keys.futureActiveIndicativeEndings, "Future Active Indicative Endings"],
  [keys.futureActiveInfinitiveEndings, "Future Active Infinitive Endings"],
]);
const lesson7CategoryByKey = new Map<string, string>([
  [keys.secondDeclensionMasculineEndings, "Second Declension Masculine Endings"],
  [keys.masculineArticleSingular, "Masculine Definite Article — Singular"],
  [keys.masculineArticlePlural, "Masculine Definite Article — Plural"],
]);
const lesson8CategoryByKey = new Map<string, string>([
  [keys.secondDeclensionNeuterEndings, "Second Declension Neuter Endings"],
  [keys.neuterArticleSingular, "Neuter Definite Article — Singular"],
  [keys.neuterArticlePlural, "Neuter Definite Article — Plural"],
  [keys.adjectiveMasculineEndings, "First/Second Declension Adjective Endings — Masculine"],
  [keys.adjectiveFeminineEndings, "First/Second Declension Adjective Endings — Feminine"],
  [keys.adjectiveNeuterEndings, "First/Second Declension Adjective Endings — Neuter"],
]);
const lesson9CategoryByKey = new Map<string, string>([
  [keys.firstDeclensionMasculineEndings, "First Declension Masculine Endings — η/ᾱ-stems"],
]);
const lesson10CategoryByKey = new Map<string, string>([
  [keys.imperfectActiveIndicativeEndings, "Imperfect Active Indicative Endings"],
]);
const lesson11CategoryByKey = new Map<string, string>([
  [keys.presentMiddlePassiveIndicativeEndings, "Present Middle/Passive Indicative Endings"],
  [keys.presentMiddlePassiveInfinitiveEndings, "Present Middle/Passive Infinitive Endings"],
  [keys.futureMiddleIndicativeEndings, "Future Middle Indicative Endings"],
  [keys.futureMiddleInfinitiveEndings, "Future Middle Infinitive Endings"],
  [keys.imperfectMiddlePassiveIndicativeEndings, "Imperfect Middle/Passive Indicative Endings"],
  [keys.presentMiddlePassiveImperativeEndings, "Present Middle/Passive Imperative Endings"],
]);

const lessonConfigs: LessonConfig[] = [
  { lesson: 3, vocabularyKey: keys.lesson3Vocabulary, vocabularyDeck: "lesson3Vocabulary", grammarDeck: "lesson3Grammar", endingKeys: [keys.presentActiveIndicativeEndings, keys.presentActiveInfinitiveEndings, keys.presentActiveImperativeEndings], categoryByKey: lesson3CategoryByKey },
  { lesson: 4, vocabularyKey: keys.lesson4Vocabulary, vocabularyDeck: "lesson4Vocabulary", grammarDeck: "lesson4Grammar", endingKeys: [keys.firstDeclensionEndingsAlpha, keys.firstDeclensionEndingsEta, keys.feminineArticleSingular, keys.feminineArticlePlural], categoryByKey: lesson4CategoryByKey },
  { lesson: 5, vocabularyKey: keys.lesson5Vocabulary, vocabularyDeck: "lesson5Vocabulary", grammarDeck: "lesson5Grammar", endingKeys: [keys.firstDeclensionEndingsShortAlphaAs, keys.firstDeclensionEndingsShortAlphaEta], categoryByKey: lesson5CategoryByKey },
  { lesson: 6, vocabularyKey: keys.lesson6Vocabulary, vocabularyDeck: "lesson6Vocabulary", grammarDeck: "lesson6Grammar", endingKeys: [keys.futureActiveIndicativeEndings, keys.futureActiveInfinitiveEndings], categoryByKey: lesson6CategoryByKey },
  { lesson: 7, vocabularyKey: keys.lesson7Vocabulary, vocabularyDeck: "lesson7Vocabulary", grammarDeck: "lesson7Grammar", endingKeys: [keys.secondDeclensionMasculineEndings, keys.masculineArticleSingular, keys.masculineArticlePlural], categoryByKey: lesson7CategoryByKey },
  { lesson: 8, vocabularyKey: keys.lesson8Vocabulary, vocabularyDeck: "lesson8Vocabulary", grammarDeck: "lesson8Grammar", endingKeys: [keys.secondDeclensionNeuterEndings, keys.neuterArticleSingular, keys.neuterArticlePlural, keys.adjectiveMasculineEndings, keys.adjectiveFeminineEndings, keys.adjectiveNeuterEndings], categoryByKey: lesson8CategoryByKey },
  { lesson: 9, vocabularyKey: keys.lesson9Vocabulary, vocabularyDeck: "lesson9Vocabulary", grammarDeck: "lesson9Grammar", endingKeys: [keys.firstDeclensionMasculineEndings], categoryByKey: lesson9CategoryByKey },
  { lesson: 10, vocabularyKey: keys.lesson10Vocabulary, vocabularyDeck: "lesson10Vocabulary", grammarDeck: "lesson10Grammar", endingKeys: [keys.imperfectActiveIndicativeEndings], categoryByKey: lesson10CategoryByKey },
  { lesson: 11, vocabularyKey: keys.lesson11Vocabulary, vocabularyDeck: "lesson11Vocabulary", grammarDeck: "lesson11Grammar", endingKeys: [keys.presentMiddlePassiveIndicativeEndings, keys.presentMiddlePassiveInfinitiveEndings, keys.futureMiddleIndicativeEndings, keys.futureMiddleInfinitiveEndings, keys.imperfectMiddlePassiveIndicativeEndings, keys.presentMiddlePassiveImperativeEndings], categoryByKey: lesson11CategoryByKey },
];

const lessonVocabularyKeys = lessonConfigs.map((config) => config.vocabularyKey);
const newTestamentVocabularyKeys = NEW_TESTAMENT_FREQUENCY_GROUPS.map((group) => group.key);
const allVocabularyKeys: string[] = [...lessonVocabularyKeys];
const allEndingKeys = lessonConfigs.flatMap((config) => [...config.endingKeys]);
const greekLessonKeys: string[] = [...lesson1Keys, ...lesson2Keys, ...lessonVocabularyKeys, ...allEndingKeys];
const defaultKeys: string[] = [...greekLessonKeys];
const allKeys: string[] = [...defaultKeys, ...newTestamentVocabularyKeys];

function updateSet(current: Set<string>, values: readonly string[], checked: boolean) {
  const next = new Set(current);
  for (const value of values) checked ? next.add(value) : next.delete(value);
  return next;
}

function groupState(selected: Set<string>, values: readonly string[]) {
  const selectedCount = values.filter((value) => selected.has(value)).length;
  return { checked: values.length > 0 && selectedCount === values.length, mixed: selectedCount > 0 && selectedCount < values.length, selectedCount };
}

function keyForCategory(map: ReadonlyMap<string, string>, category?: string) {
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

function GreekEndingChart({ card }: { card: StudyCard }) {
  const columns = chartColumns(card), rows = chartRows(card);
  const lesson = Number(card.metadata?.lesson ?? 0);
  const explicitRowHeader = typeof card.metadata?.rowHeaderLabel === "string" ? card.metadata.rowHeaderLabel : "";
  const firstColumnLabel = explicitRowHeader || (lesson === 3 || lesson === 6 || lesson === 10 ? (columns.length === 1 ? "Form" : "Person") : "Case");
  return <div className="chart-scroll">
    <table className="henle-chart">
      <thead><tr><th scope="col">{firstColumnLabel}</th>{columns.map((column) => <th scope="col" key={column}>{column}</th>)}</tr></thead>
      <tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th>{row.cells.map((cell, index) => <td key={`${row.label}-${columns[index] ?? index}`}><strong className="greek-front compact-greek">{cell}</strong></td>)}</tr>)}</tbody>
    </table>
    {sourceRef(card) && <span className="answer-notes">{sourceRef(card)}</span>}
    {card.metadata?.pronunciationText !== undefined && <ClassicalGreekAudio assetId={card.id} label={card.category ?? "Greek endings"} />}
  </div>;
}

function GreekCardAudio({ card }: { card: StudyCard }) {
  return <ClassicalGreekAudio assetId={card.id} label={card.front} />;
}

function deckList(decks: LoadedDecks) {
  return [
    decks.foundation,
    decks.newTestamentVocabulary,
    ...lessonConfigs.flatMap((config) => [decks[config.vocabularyDeck], decks[config.grammarDeck]]),
  ];
}

export function GreekPage() {
  const { value: decks, error } = useAsync(async () => {
    const [foundation, lesson3Vocabulary, lesson3Grammar, lesson4Vocabulary, lesson4Grammar, lesson5Vocabulary, lesson5Grammar, lesson6Vocabulary, lesson6Grammar, lesson7Vocabulary, lesson7Grammar, lesson8Vocabulary, lesson8Grammar, lesson9Vocabulary, lesson9Grammar, lesson10Vocabulary, lesson10Grammar, lesson11Vocabulary, lesson11Grammar, newTestamentVocabulary] = await Promise.all([
      loadGreekDeck(),
      loadGreekLesson3VocabularyDeck(), loadGreekLesson3GrammarDeck(),
      loadGreekLesson4VocabularyDeck(), loadGreekLesson4GrammarDeck(),
      loadGreekLesson5VocabularyDeck(), loadGreekLesson5GrammarDeck(),
      loadGreekLesson6VocabularyDeck(), loadGreekLesson6GrammarDeck(),
      loadGreekLesson7VocabularyDeck(), loadGreekLesson7GrammarDeck(),
      loadGreekLesson8VocabularyDeck(), loadGreekLesson8GrammarDeck(),
      loadGreekLesson9VocabularyDeck(), loadGreekLesson9GrammarDeck(),
      loadGreekLesson10VocabularyDeck(), loadGreekLesson10GrammarDeck(),
      loadGreekLesson11VocabularyDeck(), loadGreekLesson11GrammarDeck(),
      loadGreekNewTestamentVocabularyDeck(),
    ]);
    return { foundation, lesson3Vocabulary, lesson3Grammar, lesson4Vocabulary, lesson4Grammar, lesson5Vocabulary, lesson5Grammar, lesson6Vocabulary, lesson6Grammar, lesson7Vocabulary, lesson7Grammar, lesson8Vocabulary, lesson8Grammar, lesson9Vocabulary, lesson9Grammar, lesson10Vocabulary, lesson10Grammar, lesson11Vocabulary, lesson11Grammar, newTestamentVocabulary } satisfies LoadedDecks;
  }, []);
  const { user } = useAuth();
  const savedCards = useSavedCards("greek", user);
  const excludedCards = useCardExclusions("greek");
  const [searchParams] = useSearchParams();
  const [direction, setDirection] = useState<StudyDirection>("forward");
  const [selected, setSelected] = useState<Set<string>>(() => loadGreekFilterSelection(defaultKeys, undefined, allKeys));
  const [includeSavedCards, setIncludeSavedCards] = useState(() => loadIncludeSavedCards("greek"));
  const resumeSession = useMemo(() => {
    const id = searchParams.get("session"), startedAt = Number(searchParams.get("sessionStartedAt"));
    return id && Number.isFinite(startedAt) && startedAt > 0 ? { id, startedAt } : null;
  }, [searchParams]);

  useEffect(() => { saveGreekFilterSelection(selected); }, [selected]);
  useEffect(() => { saveIncludeSavedCards("greek", includeSavedCards); }, [includeSavedCards]);

  function groupKeyForCard(sourceDeck: DeckDefinition, card: StudyCard) {
    if (!decks) return null;
    if (sourceDeck.id === decks.foundation.id) {
      if (card.category === categories.uppercase) return keys.uppercase;
      if (card.category === categories.lowercase) return keys.lowercase;
      if (card.category === categories.punctuation) return keys.punctuation;
      if (card.category === categories.accents) return keys.accents;
      return null;
    }
    if (sourceDeck.id === decks.newTestamentVocabulary.id) return newTestamentFrequencyGroupForCard(card)?.key ?? null;
    for (const config of lessonConfigs) {
      if (sourceDeck.id === decks[config.vocabularyDeck].id) return config.vocabularyKey;
      if (sourceDeck.id === decks[config.grammarDeck].id) return keyForCategory(config.categoryByKey, card.category);
    }
    return null;
  }

  function cardsForGroupKeys(values: readonly string[]) {
    if (!decks) return [];
    const allowed = new Set(values);
    return deckList(decks).flatMap((sourceDeck) => sourceDeck.cards.flatMap((card) => {
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

  function changeSavedCards(checked: boolean) {
    setIncludeSavedCards(checked);
    if (!checked) return;
    excludedCards.setMany(savedCardEntries.map(({ sourceDeck, card }) => ({ deckId: sourceDeck.id, cardId: card.id })), false);
  }

  function changeSavedCardEntry(key: string, checked: boolean) {
    const entry = savedCardEntries.find((item) => item.key === key);
    if (!entry) return;
    if (!checked) {
      excludedCards.exclude(entry.sourceDeck.id, entry.card.id);
      return;
    }
    if (!includeSavedCards) {
      setIncludeSavedCards(true);
      excludedCards.setMany(savedCardEntries.map(({ sourceDeck, card }) => ({ deckId: sourceDeck.id, cardId: card.id })), true);
    }
    excludedCards.restore(entry.sourceDeck.id, entry.card.id);
  }

  const foundationCards = useMemo(() => decks?.foundation.cards.filter((card) => {
    if (excludedCards.refs.has(savedCardRef(decks.foundation.id, card.id))) return false;
    const key = groupKeyForCard(decks.foundation, card);
    return Boolean(key && selected.has(key));
  }) ?? [], [decks, excludedCards.refs, selected]);

  const lessonCardSets = useMemo(() => {
    if (!decks) return [];
    return lessonConfigs.map((config) => {
      const vocabularyDeck = decks[config.vocabularyDeck];
      const grammarDeck = decks[config.grammarDeck];
      const vocabularyCards = selected.has(config.vocabularyKey)
        ? vocabularyDeck.cards.filter((card) => !excludedCards.refs.has(savedCardRef(vocabularyDeck.id, card.id)))
        : [];
      const endingCards = grammarDeck.cards.filter((card) => {
        const key = keyForCategory(config.categoryByKey, card.category);
        return Boolean(key && selected.has(key) && !excludedCards.refs.has(savedCardRef(grammarDeck.id, card.id)));
      });
      return { config, vocabularyDeck, grammarDeck, vocabularyCards, endingCards };
    });
  }, [decks, excludedCards.refs, selected]);

  const newTestamentCards = useMemo(() => {
    if (!decks) return [];
    return decks.newTestamentVocabulary.cards.filter((card) => {
      const key = newTestamentFrequencyGroupForCard(card)?.key;
      return Boolean(key && selected.has(key) && !excludedCards.refs.has(savedCardRef(decks.newTestamentVocabulary.id, card.id)));
    });
  }, [decks, excludedCards.refs, selected]);

  const savedCardEntries = useMemo(() => {
    if (!decks) return [];
    const seen = new Set<string>();
    return deckList(decks).flatMap((sourceDeck) => sourceDeck.cards.flatMap((card) => {
      const key = savedCardRef(sourceDeck.id, card.id);
      if (!groupKeyForCard(sourceDeck, card) || !savedCards.refs.has(key) || seen.has(key)) return [];
      seen.add(key);
      return [{ key, sourceDeck, card }];
    }));
  }, [decks, savedCards.refs]);
  const savedCardFilterItems = useMemo<SavedCardFilterItem[]>(() => savedCardEntries.map(({ key, card }) => ({
    key,
    label: (card.rank ? "#" + card.rank + " · " : "") + card.front,
    checked: includeSavedCards && !excludedCards.refs.has(key),
  })), [excludedCards.refs, includeSavedCards, savedCardEntries]);

  const sources = useMemo(() => {
    if (!decks) return [];
    const next: StudySourceDefinition[] = [];
    if (foundationCards.length) next.push({ id: "lessons-1-2", label: "Lessons 1–2 foundations", deck: decks.foundation, cards: foundationCards, studyKey: direction, direction });
    for (const { config, vocabularyDeck, grammarDeck, vocabularyCards, endingCards } of lessonCardSets) {
      if (vocabularyCards.length) next.push({ id: `lesson${config.lesson}-vocabulary`, label: `Lesson ${config.lesson} vocabulary`, deck: vocabularyDeck, cards: vocabularyCards, studyKey: direction, direction });
      if (endingCards.length) next.push({ id: `lesson${config.lesson}-endings`, label: `Lesson ${config.lesson} endings`, deck: grammarDeck, cards: endingCards, studyKey: "forward", direction: "forward" });
    }
    if (newTestamentCards.length) next.push({ id: "new-testament-vocabulary", label: "New Testament Vocab (Kubo)", deck: decks.newTestamentVocabulary, cards: newTestamentCards, studyKey: direction, direction });

    if (includeSavedCards) {
      const alreadySelected = new Set(next.flatMap((source) => source.cards.map((card) => savedCardRef(source.deck.id, card.id))));
      const appendSaved = (id: string, sourceDeck: DeckDefinition, studyKey: string, sourceDirection: StudyDirection, allowed: (card: StudyCard) => boolean) => {
        const cards = sourceDeck.cards.filter((card) => {
          const ref = savedCardRef(sourceDeck.id, card.id);
          return allowed(card) && savedCards.refs.has(ref) && !excludedCards.refs.has(ref) && !alreadySelected.has(ref);
        });
        if (!cards.length) return;
        next.push({ id, label: "Saved Cards", deck: sourceDeck, cards, studyKey, direction: sourceDirection });
        cards.forEach((card) => alreadySelected.add(savedCardRef(sourceDeck.id, card.id)));
      };
      appendSaved("saved-lessons-1-2", decks.foundation, direction, direction, (card) => Boolean(groupKeyForCard(decks.foundation, card)));
      for (const { config, vocabularyDeck, grammarDeck } of lessonCardSets) {
        appendSaved(`saved-lesson${config.lesson}-vocabulary`, vocabularyDeck, direction, direction, () => true);
        appendSaved(`saved-lesson${config.lesson}-endings`, grammarDeck, "forward", "forward", (card) => Boolean(keyForCategory(config.categoryByKey, card.category)));
      }
      appendSaved("saved-new-testament-vocabulary", decks.newTestamentVocabulary, direction, direction, () => true);
    }
    return next;
  }, [decks, direction, excludedCards.refs, foundationCards, includeSavedCards, lessonCardSets, newTestamentCards, savedCards.refs]);

  const selectedCards = useMemo(() => sources.flatMap((source) => source.cards), [sources]);
  const currentlySelectedItems = useMemo<SelectedCardPanelItem[]>(() => {
    const seen = new Set<string>();
    return sources.flatMap((source) => source.cards.flatMap((card) => {
      const key = savedCardRef(source.deck.id, card.id);
      if (seen.has(key)) return [];
      seen.add(key);
      return [{ key, deckId: source.deck.id, cardId: card.id, label: (card.rank ? "#" + card.rank + " · " : "") + card.front }];
    }));
  }, [sources]);
  const virtualDeck = useMemo<DeckDefinition>(() => ({
    id: "greek-study-app",
    slug: "greek",
    title: "Greek",
    eyebrow: "Endings · vocabulary",
    description: "Greek vocabulary and ending charts while preserving each source's progress.",
    language: "greek",
    cards: selectedCards,
    supportsReverse: true,
  }), [selectedCards]);
  const savedSelectionKey = includeSavedCards ? [...savedCards.refs].sort().join(",") : "off";
  const resetKey = `${direction}|${[...selected].sort().join("|")}|saved:${savedSelectionKey}|excluded:${excludedCards.signature}`;

  const vocabularyState = groupSelectionState(allVocabularyKeys);
  const newTestamentState = groupSelectionState(newTestamentVocabularyKeys);
  const selectedNewTestamentCount = decks?.newTestamentVocabulary.cards.filter((card) => exactCardSelected(decks.newTestamentVocabulary, card)).length ?? 0;
  const endingsState = groupSelectionState(allEndingKeys);
  const lesson1State = groupSelectionState(lesson1Keys);
  const alphabetState = groupSelectionState(alphabetKeys);
  const lesson2State = groupSelectionState(lesson2Keys);
  const greekLessonsState = groupSelectionState(greekLessonKeys);
  const countFoundation = (category: string) => decks?.foundation.cards.filter((card) => card.category === category).length ?? 0;

  return <main className="page-shell study-page">
    <div className="study-page-heading"><div><h1>Greek</h1></div></div>
    {!user && <div className="guest-banner"><span>You are studying as a guest. Progress stays on this device.</span><Link to="/account">Sign in to sync</Link></div>}
    {(error || savedCards.error) && <div className="inline-alert">{error ?? savedCards.error}</div>}

    {decks && <StudyFilterMenu summary={`${selectedCards.length} cards in the current pool`}>
      <FilterSection title="Study direction" description="Forward and Reverse keep separate review histories, mastery, timing, and scheduling.">
        <FilterDirectionControl direction={direction} onChange={setDirection} />
      </FilterSection>
      <FilterSection title="Quick select" onAll={() => { setSelected(new Set(allKeys)); excludedCards.clear(); }} onNone={() => { setSelected(new Set()); setIncludeSavedCards(false); }}>
        <SavedCardsFilter items={savedCardFilterItems} ready={savedCards.ready} onAllChange={changeSavedCards} onItemChange={changeSavedCardEntry} />
        <FilterCheckbox label="All Lesson Vocabulary" checked={vocabularyState.checked} mixed={vocabularyState.mixed} onChange={(checked) => changeGroups(allVocabularyKeys, checked)} />
        <FilterCheckbox label="All Endings" checked={endingsState.checked} mixed={endingsState.mixed} onChange={(checked) => changeGroups(allEndingKeys, checked)} />
      </FilterSection>

      <FilterDisclosure title="New Testament Vocab (Kubo)" summary={`${selectedNewTestamentCount} of ${decks.newTestamentVocabulary.cards.length} words selected`} count={decks.newTestamentVocabulary.cards.length} checked={newTestamentState.checked} mixed={newTestamentState.mixed} onCheckedChange={(checked) => changeGroups(newTestamentVocabularyKeys, checked)}>
        {NEW_TESTAMENT_FREQUENCY_GROUPS.map((group) => {
          const cards = decks.newTestamentVocabulary.cards.filter((card) => card.metadata?.frequencyGroupKey === group.key);
          const state = groupSelectionState([group.key]);
          const selectedCount = cards.filter((card) => exactCardSelected(decks.newTestamentVocabulary, card)).length;
          return <FilterDisclosure key={group.key} title={group.label} summary={`${selectedCount} of ${cards.length} selected`} count={cards.length} nested checked={state.checked} mixed={state.mixed} onCheckedChange={(checked) => changeGroups([group.key], checked)}>
            {cards.map((card) => <FilterCheckbox key={card.id} label={`#${card.rank} · ${card.front} — ${oneWordVocabularyGloss(card.back)}`} checked={exactCardSelected(decks.newTestamentVocabulary, card)} onChange={(checked) => changeExactCard(decks.newTestamentVocabulary, card, checked)} />)}
          </FilterDisclosure>;
        })}
      </FilterDisclosure>

      <FilterDisclosure title="Greek Lessons (Groton)" summary={`${greekLessonsState.selectedCount} of ${greekLessonKeys.length} groups selected`} checked={greekLessonsState.checked} mixed={greekLessonsState.mixed} onCheckedChange={(checked) => changeGroups(greekLessonKeys, checked)}>
      <FilterDisclosure title="Lesson 1" nested summary={`${lesson1State.selectedCount} of ${lesson1Keys.length} groups selected`} checked={lesson1State.checked} mixed={lesson1State.mixed} onCheckedChange={(checked) => changeGroups(lesson1Keys, checked)}>
        <FilterDisclosure title="Alphabet" summary={`${alphabetState.selectedCount} of ${alphabetKeys.length} cases selected`} count={countFoundation(categories.uppercase) + countFoundation(categories.lowercase)} nested checked={alphabetState.checked} mixed={alphabetState.mixed} onCheckedChange={(checked) => changeGroups(alphabetKeys, checked)}>
          <FilterSection title="Letter case">
            <FilterCheckbox label="Uppercase" count={countFoundation(categories.uppercase)} checked={groupSelectionState([keys.uppercase]).checked} mixed={groupSelectionState([keys.uppercase]).mixed} onChange={(checked) => changeGroups([keys.uppercase], checked)} />
            <FilterCheckbox label="Lowercase" count={countFoundation(categories.lowercase)} checked={groupSelectionState([keys.lowercase]).checked} mixed={groupSelectionState([keys.lowercase]).mixed} onChange={(checked) => changeGroups([keys.lowercase], checked)} />
          </FilterSection>
        </FilterDisclosure>
        <FilterCheckbox label="Punctuation" count={countFoundation(categories.punctuation)} checked={groupSelectionState([keys.punctuation]).checked} mixed={groupSelectionState([keys.punctuation]).mixed} onChange={(checked) => changeGroups([keys.punctuation], checked)} />
      </FilterDisclosure>

      <FilterDisclosure title="Lesson 2" nested summary={`${lesson2State.selectedCount} of ${lesson2Keys.length} groups selected`} checked={lesson2State.checked} mixed={lesson2State.mixed} onCheckedChange={(checked) => changeGroups(lesson2Keys, checked)}>
        <FilterCheckbox label="Accent marks" count={countFoundation(categories.accents)} checked={groupSelectionState([keys.accents]).checked} mixed={groupSelectionState([keys.accents]).mixed} onChange={(checked) => changeGroups([keys.accents], checked)} />
      </FilterDisclosure>

      {lessonCardSets.map(({ config, vocabularyDeck, grammarDeck }) => {
        const lessonKeys = [config.vocabularyKey, ...config.endingKeys];
        const lessonState = groupSelectionState(lessonKeys);
        const vocabularySelection = groupSelectionState([config.vocabularyKey]);
        const endingState = groupSelectionState(config.endingKeys);
        const selectedVocabularyCount = vocabularyDeck.cards.filter((card) => exactCardSelected(vocabularyDeck, card)).length;
        return <FilterDisclosure key={config.lesson} title={`Lesson ${config.lesson}`} nested summary={`${lessonState.selectedCount} of ${lessonKeys.length} groups selected`} checked={lessonState.checked} mixed={lessonState.mixed} onCheckedChange={(checked) => changeGroups(lessonKeys, checked)}>
          <FilterDisclosure title="Vocabulary" summary={`${selectedVocabularyCount} of ${vocabularyDeck.cards.length} words selected`} count={vocabularyDeck.cards.length} nested checked={vocabularySelection.checked} mixed={vocabularySelection.mixed} onCheckedChange={(checked) => changeGroups([config.vocabularyKey], checked)}>
            {vocabularyDeck.cards.map((card) => <FilterCheckbox key={card.id} label={`#${card.rank} · ${card.front} — ${oneWordVocabularyGloss(card.back)}`} checked={exactCardSelected(vocabularyDeck, card)} onChange={(checked) => changeExactCard(vocabularyDeck, card, checked)} />)}
          </FilterDisclosure>

          <FilterDisclosure title="Endings" summary={`${endingState.selectedCount} of ${config.endingKeys.length} selected`} count={config.endingKeys.length} nested checked={endingState.checked} mixed={endingState.mixed} onCheckedChange={(checked) => changeGroups(config.endingKeys, checked)}>
            {config.endingKeys.map((key) => {
              const category = config.categoryByKey.get(key)!;
              const count = grammarDeck.cards.filter((card) => card.category === category).length;
              return <FilterCheckbox key={key} label={category} count={count} checked={groupSelectionState([key]).checked} mixed={groupSelectionState([key]).mixed} onChange={(checked) => changeGroups([key], checked)} />;
            })}
          </FilterDisclosure>
        </FilterDisclosure>;
      })}
      </FilterDisclosure>
    </StudyFilterMenu>}

    {decks ? <SelectedCardsProvider items={currentlySelectedItems} onChange={(item, checked) => checked ? excludedCards.restore(item.deckId, item.cardId) : excludedCards.exclude(item.deckId, item.cardId)}><MultiSourceStudySession
      deck={virtualDeck}
      sources={sources}
      resetKey={resetKey}
      direction={direction}
      resumeSession={resumeSession}
      savedCardRefs={savedCards.refs}
      onToggleSavedCard={savedCards.toggleSaved}
      onDeselectCard={excludedCards.exclude}
      renderFront={(card, copy, source) => {
        if (source.direction === "forward" && chartRows(card).length) return <span className="study-prompt reverse-text-prompt">{card.front}</span>;
        return <span className={source.direction === "forward" ? "greek-front" : "study-prompt reverse-text-prompt"}>{copy.prompt}</span>;
      }}
      renderBack={(card, copy, source) => {
        if (source.deck.id === decks.foundation.id) {
          const details = source.direction === "forward" ? card.back.split("\n").slice(1).join("\n") : card.reverseBack?.split("\n").slice(1).join("\n");
          return <div className="answer-block"><strong className={source.direction === "reverse" ? "greek-front compact-greek" : "greek-answer-title"}>{source.direction === "reverse" ? card.front : String(card.metadata?.backTitle ?? "Answer")}</strong><span className="answer-notes">{details}</span>{sourceRef(card) && <span className="answer-notes">{sourceRef(card)}</span>}<GreekCardAudio card={card} /></div>;
        }
        if (chartRows(card).length) return <div className="answer-block"><GreekEndingChart card={card} /></div>;
        return <div className="answer-block"><strong className={source.direction === "reverse" ? "greek-front compact-greek" : "study-answer"}>{copy.answer}</strong>{card.notes && <span className="answer-notes">{card.notes}</span>}{sourceRef(card) && <span className="answer-notes">{sourceRef(card)}</span>}{card.metadata?.audioDisabled !== true && <GreekCardAudio card={card} />}</div>;
      }}
    /></SelectedCardsProvider> : <div className="study-loading panel-surface"><span className="loading-mark">α</span><p>Preparing Greek…</p></div>}
  </main>;
}
