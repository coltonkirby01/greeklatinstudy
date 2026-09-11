import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  loadGreekDeck,
  loadGreekLesson3GrammarDeck,
  loadGreekLesson3VocabularyDeck,
  loadGreekLesson4GrammarDeck,
  loadGreekLesson4VocabularyDeck,
} from "../data/builtin-decks";
import { useAuth } from "../features/auth/auth-context";
import { ClassicalGreekAudio } from "../features/greek/classical-greek-audio";
import { loadGreekFilterSelection, saveGreekFilterSelection } from "../features/study/filter-preferences";
import { MultiSourceStudySession, type StudySourceDefinition } from "../features/study/multi-source-study-session";
import { loadIncludeSavedCards, saveIncludeSavedCards, savedCardRef, useSavedCards } from "../features/study/saved-cards";
import { FilterCheckbox, FilterDisclosure, FilterSection, StudyFilterMenu } from "../features/study/study-filter-menu";
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
const allVocabularyKeys = [keys.lesson3Vocabulary, keys.lesson4Vocabulary] as const;
const allGrammarKeys = [...lesson1Keys, ...lesson2Keys, ...lesson3GrammarKeys, ...lesson4GrammarKeys] as const;

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
  const firstColumnLabel = lesson === 3 ? (columns.length === 1 ? "Form" : "Person") : "Case";
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
    const [foundation, lesson3Vocabulary, lesson3Grammar, lesson4Vocabulary, lesson4Grammar] = await Promise.all([
      loadGreekDeck(),
      loadGreekLesson3VocabularyDeck(),
      loadGreekLesson3GrammarDeck(),
      loadGreekLesson4VocabularyDeck(),
      loadGreekLesson4GrammarDeck(),
    ]);
    return { foundation, lesson3Vocabulary, lesson3Grammar, lesson4Vocabulary, lesson4Grammar };
  }, []);
  const { user } = useAuth();
  const savedCards = useSavedCards("greek", user);
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

  const lesson1State = groupState(selected, lesson1Keys);
  const alphabetState = groupState(selected, alphabetKeys);
  const lesson2State = groupState(selected, lesson2Keys);
  const lesson3State = groupState(selected, lesson3Keys);
  const lesson3EndingsState = groupState(selected, lesson3EndingsKeys);
  const lesson3ParadigmState = groupState(selected, lesson3ParadigmKeys);
  const lesson4State = groupState(selected, lesson4Keys);
  const lesson4EndingsState = groupState(selected, lesson4EndingsKeys);
  const lesson4ParadigmState = groupState(selected, lesson4ParadigmKeys);
  const vocabularyState = groupState(selected, allVocabularyKeys);
  const grammarState = groupState(selected, allGrammarKeys);

  const foundationCards = useMemo(() => decks?.foundation.cards.filter((card) => {
    if (card.category === categories.uppercase) return selected.has(keys.uppercase);
    if (card.category === categories.lowercase) return selected.has(keys.lowercase);
    if (card.category === categories.punctuation) return selected.has(keys.punctuation);
    if (card.category === categories.accents) return selected.has(keys.accents);
    return false;
  }) ?? [], [decks, selected]);

  const lesson3VocabularyCards = useMemo(() => selected.has(keys.lesson3Vocabulary) ? decks?.lesson3Vocabulary.cards ?? [] : [], [decks, selected]);
  const lesson3GrammarCards = useMemo(() => decks?.lesson3Grammar.cards.filter((card) => {
    for (const [key, category] of lesson3GrammarCategoryByKey) if (card.category === category) return selected.has(key);
    return false;
  }) ?? [], [decks, selected]);
  const lesson4VocabularyCards = useMemo(() => selected.has(keys.lesson4Vocabulary) ? decks?.lesson4Vocabulary.cards ?? [] : [], [decks, selected]);
  const lesson4GrammarCards = useMemo(() => decks?.lesson4Grammar.cards.filter((card) => {
    for (const [key, category] of lesson4GrammarCategoryByKey) if (card.category === category) return selected.has(key);
    return false;
  }) ?? [], [decks, selected]);

  const savedCardCount = useMemo(() => {
    if (!decks) return 0;
    return [decks.foundation, decks.lesson3Vocabulary, decks.lesson3Grammar, decks.lesson4Vocabulary, decks.lesson4Grammar]
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

    if (includeSavedCards) {
      const alreadySelected = new Set(next.flatMap((source) => source.cards.map((card) => savedCardRef(source.deck.id, card.id))));
      const appendSaved = (id: string, sourceDeck: DeckDefinition, studyKey: string, sourceDirection: StudyDirection) => {
        const cards = sourceDeck.cards.filter((card) => {
          const ref = savedCardRef(sourceDeck.id, card.id);
          return savedCards.refs.has(ref) && !alreadySelected.has(ref);
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
    }
    return next;
  }, [decks, direction, foundationCards, includeSavedCards, lesson3GrammarCards, lesson3VocabularyCards, lesson4GrammarCards, lesson4VocabularyCards, savedCards.refs]);

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
  const resetKey = `${direction}|${[...selected].sort().join("|")}|saved:${savedSelectionKey}`;

  const countFoundation = (category: string) => decks?.foundation.cards.filter((card) => card.category === category).length ?? 0;
  const countLesson3Grammar = (category: string) => decks?.lesson3Grammar.cards.filter((card) => card.category === category).length ?? 0;
  const countLesson4Grammar = (category: string) => decks?.lesson4Grammar.cards.filter((card) => card.category === category).length ?? 0;
  const savedHint = "Cards you save with the card button or S shortcut are private to your account or this guest browser.";

  return <main className="page-shell study-page">
    <div className="study-page-heading">
      <div><h1>Greek</h1></div>
    </div>
    {!user && <div className="guest-banner"><span>You are studying as a guest. Progress stays on this device.</span><Link to="/account">Sign in to sync</Link></div>}
    {(error || savedCards.error) && <div className="inline-alert">{error ?? savedCards.error}</div>}

    {decks && <StudyFilterMenu summary={`${selectedCards.length} cards in the current pool`}>
      <FilterSection title="Quick select" onAll={() => setSelected(new Set(allKeys))} onNone={() => { setSelected(new Set()); setIncludeSavedCards(false); }}>
        <FilterCheckbox label="Saved Cards" count={savedCardCount} checked={includeSavedCards} disabled={!savedCards.ready || savedCardCount === 0} onChange={setIncludeSavedCards} hint={savedHint} />
        <FilterCheckbox label="All Vocabulary" checked={vocabularyState.checked} mixed={vocabularyState.mixed} onChange={(checked) => setSelected((current) => updateSet(current, allVocabularyKeys, checked))} />
        <FilterCheckbox label="All Grammar" checked={grammarState.checked} mixed={grammarState.mixed} onChange={(checked) => setSelected((current) => updateSet(current, allGrammarKeys, checked))} />
      </FilterSection>

      <FilterDisclosure title="Lesson 1" summary={`${lesson1State.selectedCount} of ${lesson1Keys.length} groups selected`} checked={lesson1State.checked} mixed={lesson1State.mixed} onCheckedChange={(checked) => setSelected((current) => updateSet(current, lesson1Keys, checked))}>
        <FilterDisclosure title="Alphabet" summary={`${alphabetState.selectedCount} of ${alphabetKeys.length} cases selected`} count={countFoundation(categories.uppercase) + countFoundation(categories.lowercase)} nested checked={alphabetState.checked} mixed={alphabetState.mixed} onCheckedChange={(checked) => setSelected((current) => updateSet(current, alphabetKeys, checked))}>
          <FilterSection title="Letter case">
            <FilterCheckbox label="Uppercase" count={countFoundation(categories.uppercase)} checked={selected.has(keys.uppercase)} onChange={(checked) => setSelected((current) => updateSet(current, [keys.uppercase], checked))} />
            <FilterCheckbox label="Lowercase" count={countFoundation(categories.lowercase)} checked={selected.has(keys.lowercase)} onChange={(checked) => setSelected((current) => updateSet(current, [keys.lowercase], checked))} />
          </FilterSection>
        </FilterDisclosure>
        <FilterCheckbox label="Punctuation" count={countFoundation(categories.punctuation)} checked={selected.has(keys.punctuation)} onChange={(checked) => setSelected((current) => updateSet(current, [keys.punctuation], checked))} />
      </FilterDisclosure>

      <FilterDisclosure title="Lesson 2" summary={`${lesson2State.selectedCount} of ${lesson2Keys.length} groups selected`} checked={lesson2State.checked} mixed={lesson2State.mixed} onCheckedChange={(checked) => setSelected((current) => updateSet(current, lesson2Keys, checked))}>
        <FilterCheckbox label="Accent marks" count={countFoundation(categories.accents)} checked={selected.has(keys.accents)} onChange={(checked) => setSelected((current) => updateSet(current, [keys.accents], checked))} />
      </FilterDisclosure>

      <FilterDisclosure title="Lesson 3" summary={`${lesson3State.selectedCount} of ${lesson3Keys.length} groups selected`} checked={lesson3State.checked} mixed={lesson3State.mixed} onCheckedChange={(checked) => setSelected((current) => updateSet(current, lesson3Keys, checked))}>
        <FilterDisclosure title="Vocabulary" summary="11 entries" count={decks.lesson3Vocabulary.cards.length} nested checked={selected.has(keys.lesson3Vocabulary)} onCheckedChange={(checked) => setSelected((current) => updateSet(current, [keys.lesson3Vocabulary], checked))}>
          <FilterCheckbox label="All Lesson 3 vocabulary" count={decks.lesson3Vocabulary.cards.length} checked={selected.has(keys.lesson3Vocabulary)} onChange={(checked) => setSelected((current) => updateSet(current, [keys.lesson3Vocabulary], checked))} />
        </FilterDisclosure>

        <FilterDisclosure title="Endings" summary={`${lesson3EndingsState.selectedCount} of ${lesson3EndingsKeys.length} selected`} count={lesson3EndingsKeys.length} nested checked={lesson3EndingsState.checked} mixed={lesson3EndingsState.mixed} onCheckedChange={(checked) => setSelected((current) => updateSet(current, lesson3EndingsKeys, checked))}>
          <FilterCheckbox label="Present Active Indicative Endings" count={countLesson3Grammar("Present Active Indicative Endings")} checked={selected.has(keys.presentActiveIndicativeEndings)} onChange={(checked) => setSelected((current) => updateSet(current, [keys.presentActiveIndicativeEndings], checked))} />
          <FilterCheckbox label="Present Active Infinitive Ending" count={countLesson3Grammar("Present Active Infinitive Endings")} checked={selected.has(keys.presentActiveInfinitiveEndings)} onChange={(checked) => setSelected((current) => updateSet(current, [keys.presentActiveInfinitiveEndings], checked))} />
          <FilterCheckbox label="Present Active Imperative Endings" count={countLesson3Grammar("Present Active Imperative Endings")} checked={selected.has(keys.presentActiveImperativeEndings)} onChange={(checked) => setSelected((current) => updateSet(current, [keys.presentActiveImperativeEndings], checked))} />
        </FilterDisclosure>

        <FilterDisclosure title="Paradigms" summary={`${lesson3ParadigmState.selectedCount} of ${lesson3ParadigmKeys.length} selected`} count={lesson3ParadigmKeys.length} nested checked={lesson3ParadigmState.checked} mixed={lesson3ParadigmState.mixed} onCheckedChange={(checked) => setSelected((current) => updateSet(current, lesson3ParadigmKeys, checked))}>
          <FilterCheckbox label="Present Active Indicative — παιδεύω" count={countLesson3Grammar("Present Active Indicative")} checked={selected.has(keys.presentActiveIndicative)} onChange={(checked) => setSelected((current) => updateSet(current, [keys.presentActiveIndicative], checked))} />
          <FilterCheckbox label="Present Active Infinitive — παιδεύω" count={countLesson3Grammar("Present Active Infinitive")} checked={selected.has(keys.presentActiveInfinitive)} onChange={(checked) => setSelected((current) => updateSet(current, [keys.presentActiveInfinitive], checked))} />
          <FilterCheckbox label="Present Active Imperative — παιδεύω" count={countLesson3Grammar("Present Active Imperative")} checked={selected.has(keys.presentActiveImperative)} onChange={(checked) => setSelected((current) => updateSet(current, [keys.presentActiveImperative], checked))} />
        </FilterDisclosure>
      </FilterDisclosure>

      <FilterDisclosure title="Lesson 4" summary={`${lesson4State.selectedCount} of ${lesson4Keys.length} groups selected`} checked={lesson4State.checked} mixed={lesson4State.mixed} onCheckedChange={(checked) => setSelected((current) => updateSet(current, lesson4Keys, checked))}>
        <FilterDisclosure title="Vocabulary" summary={`${decks.lesson4Vocabulary.cards.length} entries`} count={decks.lesson4Vocabulary.cards.length} nested checked={selected.has(keys.lesson4Vocabulary)} onCheckedChange={(checked) => setSelected((current) => updateSet(current, [keys.lesson4Vocabulary], checked))}>
          <FilterCheckbox label="All Lesson 4 vocabulary" count={decks.lesson4Vocabulary.cards.length} checked={selected.has(keys.lesson4Vocabulary)} onChange={(checked) => setSelected((current) => updateSet(current, [keys.lesson4Vocabulary], checked))} />
        </FilterDisclosure>

        <FilterDisclosure title="Endings" summary={`${lesson4EndingsState.selectedCount} of ${lesson4EndingsKeys.length} selected`} count={lesson4EndingsKeys.length} nested checked={lesson4EndingsState.checked} mixed={lesson4EndingsState.mixed} onCheckedChange={(checked) => setSelected((current) => updateSet(current, lesson4EndingsKeys, checked))}>
          {lesson4EndingsKeys.map((key) => {
  const category = lesson4GrammarCategoryByKey.get(key)!;
  return <FilterCheckbox key={key} label={category} count={countLesson4Grammar(category)} checked={selected.has(key)} onChange={(checked) => setSelected((current) => updateSet(current, [key], checked))} />;
})}
        </FilterDisclosure>

        <FilterDisclosure title="Paradigms" summary={`${lesson4ParadigmState.selectedCount} of ${lesson4ParadigmKeys.length} selected`} count={lesson4ParadigmKeys.length} nested checked={lesson4ParadigmState.checked} mixed={lesson4ParadigmState.mixed} onCheckedChange={(checked) => setSelected((current) => updateSet(current, lesson4ParadigmKeys, checked))}>
          {lesson4ParadigmKeys.map((key) => {
            const category = lesson4GrammarCategoryByKey.get(key)!;
            return <FilterCheckbox key={key} label={category} count={countLesson4Grammar(category)} checked={selected.has(key)} onChange={(checked) => setSelected((current) => updateSet(current, [key], checked))} />;
          })}
        </FilterDisclosure>
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
      cardMeta={(card, source) => source.deck.id === decks.foundation.id ? `Lessons ${Number(card.metadata?.lesson ?? 1)} · Card ${card.rank ?? 0}` : source.deck.id === decks.lesson3Vocabulary.id ? `Lesson 3 vocabulary · ${card.notes ?? ""}` : source.deck.id === decks.lesson4Vocabulary.id ? `Lesson 4 vocabulary · ${card.notes ?? ""}` : `Lesson ${Number(card.metadata?.lesson ?? 3)} grammar · ${card.category ?? ""}`}
      renderFront={(card, copy, source) => {
        if (source.deck.id === decks.lesson3Grammar.id || source.deck.id === decks.lesson4Grammar.id) return <span className="study-prompt reverse-text-prompt">{card.front}</span>;
        return <span className={source.direction === "forward" ? "greek-front" : "study-prompt reverse-text-prompt"}>{copy.prompt}</span>;
      }}
      renderBack={(card, copy, source) => {
        if (source.deck.id === decks.foundation.id) {
          const details = source.direction === "forward" ? card.back.split("\n").slice(1).join("\n") : card.reverseBack?.split("\n").slice(1).join("\n");
          return <div className="answer-block"><strong className={source.direction === "reverse" ? "greek-front compact-greek" : "greek-answer-title"}>{source.direction === "reverse" ? card.front : String(card.metadata?.backTitle ?? "Answer")}</strong><span className="answer-notes">{details}</span>{sourceRef(card) && <span className="answer-notes">{sourceRef(card)}</span>}<GreekCardAudio card={card} /></div>;
        }
        if (source.deck.id === decks.lesson3Grammar.id || source.deck.id === decks.lesson4Grammar.id) return <div className="answer-block"><GreekParadigm card={card} /></div>;
        return <div className="answer-block"><strong className={source.direction === "reverse" ? "greek-front compact-greek" : "study-answer"}>{copy.answer}</strong>{card.notes && <span className="answer-notes">{card.notes}</span>}{sourceRef(card) && <span className="answer-notes">{sourceRef(card)}</span>}<GreekCardAudio card={card} /></div>;
      }}
    /> : <div className="study-loading panel-surface"><span className="loading-mark">α</span><p>Preparing Greek…</p></div>}
  </main>;
}
