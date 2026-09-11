import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { loadLatinDeck } from "../data/builtin-decks";
import { loadLatinActiveIndicativeParadigmsDeck } from "../data/latin-active-indicative-paradigms";
import { loadLatinPassiveIndicativeParadigmsDeck } from "../data/latin-passive-indicative-paradigms";
import { useAuth } from "../features/auth/auth-context";
import { LatinParadigmTable } from "../features/latin/latin-paradigm-table";
import { loadLatinFilterPreferences, saveLatinFilterPreferences, type LatinMaterial } from "../features/study/filter-preferences";
import { matchesVocabularyCard, vocabularyFamily, type OptionalSelection } from "../features/study/latin-study-filters";
import { MultiSourceStudySession, type StudySourceDefinition } from "../features/study/multi-source-study-session";
import { loadIncludeSavedCards, saveIncludeSavedCards, savedCardRef, useSavedCards } from "../features/study/saved-cards";
import { FilterCheckbox, FilterDisclosure, FilterSection, StudyFilterMenu } from "../features/study/study-filter-menu";
import type { DeckDefinition, StudyDirection } from "../features/study/types";
import { useAsync } from "../hooks/use-async";

type Material = LatinMaterial;

const activeParadigmTenses = ["Present Tense", "Imperfect Tense", "Future Tense", "Perfect Tense", "Pluperfect Tense", "Future Perfect Tense"] as const;
const passiveParadigmTenses = ["Present Tense", "Imperfect Tense", "Future Tense"] as const;

function setValues(current: OptionalSelection, allValues: readonly string[], values: readonly string[], checked: boolean): OptionalSelection {
  const next = current === null ? new Set(allValues) : new Set(current);
  for (const value of values) checked ? next.add(value) : next.delete(value);
  return next.size === allValues.length ? null : next;
}

function selected(selection: OptionalSelection, value: string) {
  return selection === null || selection.has(value);
}

function selectionKey(selection: OptionalSelection) {
  return selection === null ? "*" : [...selection].sort().join(",");
}

function selectionState(selection: OptionalSelection, allValues: readonly string[], active = true) {
  if (!active) return { checked: false, mixed: false, selectedCount: 0 };
  const selectedCount = selection === null ? allValues.length : allValues.filter((value) => selection.has(value)).length;
  return {
    checked: selectedCount === allValues.length,
    mixed: selectedCount > 0 && selectedCount < allValues.length,
    selectedCount,
  };
}

function ParadigmDeckFilters({
  title,
  material,
  deck,
  tenses,
  active,
  selection,
  allParadigmIds,
  onDeckChange,
  onValuesChange,
}: {
  title: string;
  material: Material;
  deck: DeckDefinition | null | undefined;
  tenses: readonly string[];
  active: boolean;
  selection: OptionalSelection;
  allParadigmIds: readonly string[];
  onDeckChange: (material: Material, ids: readonly string[], checked: boolean) => void;
  onValuesChange: (material: Material, ids: readonly string[], checked: boolean) => void;
}) {
  const deckIds = deck?.cards.map((card) => card.id) ?? [];
  const state = selectionState(selection, deckIds, active);

  return (
    <FilterDisclosure
      title={title}
      count={deck?.cards.length ?? 0}
      summary={`${state.selectedCount} of ${deckIds.length || 0} selected`}
      nested
      checked={state.checked}
      mixed={state.mixed}
      onCheckedChange={(checked) => onDeckChange(material, deckIds, checked)}
    >
      {deck && tenses.map((tense) => {
        const prefix = title.startsWith("Active") ? "Active Indicative" : "Passive Indicative";
        const cards = deck.cards.filter((card) => card.category === `${prefix} — ${tense}`);
        const ids = cards.map((card) => card.id);
        const tenseState = selectionState(selection, ids, active);
        return (
          <FilterDisclosure
            key={tense}
            title={tense}
            count={cards.length}
            summary={`${tenseState.selectedCount} of ${cards.length} conjugations selected`}
            nested
            checked={tenseState.checked}
            mixed={tenseState.mixed}
            onCheckedChange={(checked) => onValuesChange(material, ids, checked)}
          >
            <FilterSection title={tense} description="Choose the conjugations you want in the paradigm study pool.">
              {cards.map((card) => {
                const promptWithoutRule = card.front.split(" — R.")[0];
                const label = promptWithoutRule.split(", ").at(-1) ?? promptWithoutRule;
                return (
                  <FilterCheckbox
                    key={card.id}
                    label={label}
                    checked={active && selected(selection, card.id)}
                    onChange={(checked) => onValuesChange(material, [card.id], checked)}
                  />
                );
              })}
            </FilterSection>
          </FilterDisclosure>
        );
      })}
    </FilterDisclosure>
  );
}

export function LatinPage() {
  const { value: vocabularyDeck, error: vocabularyError } = useAsync(loadLatinDeck, []);
  const { value: activeParadigmDeck, error: activeParadigmError } = useAsync(loadLatinActiveIndicativeParadigmsDeck, []);
  const { value: passiveParadigmDeck, error: passiveParadigmError } = useAsync(loadLatinPassiveIndicativeParadigmsDeck, []);
  const { user } = useAuth();
  const savedCards = useSavedCards("latin", user);
  const [searchParams] = useSearchParams();
  const [initialFilters] = useState(loadLatinFilterPreferences);
  const [direction, setDirection] = useState<StudyDirection>("forward");
  const [materials, setMaterials] = useState<Set<Material>>(() => new Set(initialFilters.materials));
  const [vocabularyParts, setVocabularyParts] = useState<OptionalSelection>(() => initialFilters.vocabularyParts === null ? null : new Set(initialFilters.vocabularyParts));
  const [paradigmCards, setParadigmCards] = useState<OptionalSelection>(() => initialFilters.paradigmCards === null ? null : new Set(initialFilters.paradigmCards));
  const [includeSavedCards, setIncludeSavedCards] = useState(() => loadIncludeSavedCards("latin"));

  const resumeSession = useMemo(() => {
    const id = searchParams.get("session");
    const startedAt = Number(searchParams.get("sessionStartedAt"));
    return id && Number.isFinite(startedAt) && startedAt > 0 ? { id, startedAt } : null;
  }, [searchParams]);

  useEffect(() => {
    saveLatinFilterPreferences({
      materials: new Set(materials),
      vocabularyParts: vocabularyParts === null ? null : new Set(vocabularyParts),
      paradigmCards: paradigmCards === null ? null : new Set(paradigmCards),
    });
  }, [materials, paradigmCards, vocabularyParts]);
  useEffect(() => { saveIncludeSavedCards("latin", includeSavedCards); }, [includeSavedCards]);

  const vocabularyGroups = useMemo(() => {
    const groups = new Map<string, Array<{ value: string; count: number }>>();
    if (!vocabularyDeck) return groups;
    const counts = new Map<string, number>();
    for (const card of vocabularyDeck.cards) {
      const value = String(card.metadata?.partOfSpeech ?? card.category ?? "Vocabulary");
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    for (const [value, count] of [...counts.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      const family = vocabularyFamily(value);
      groups.set(family, [...(groups.get(family) ?? []), { value, count }]);
    }
    return groups;
  }, [vocabularyDeck]);

  const allVocabularyParts = useMemo(() => [...vocabularyGroups.values()].flat().map((item) => item.value), [vocabularyGroups]);
  const vocabularyActive = materials.has("vocabulary");
  const vocabularyState = selectionState(vocabularyParts, allVocabularyParts, vocabularyActive);

  const activeParadigmIds = useMemo(() => activeParadigmDeck?.cards.map((card) => card.id) ?? [], [activeParadigmDeck]);
  const passiveParadigmIds = useMemo(() => passiveParadigmDeck?.cards.map((card) => card.id) ?? [], [passiveParadigmDeck]);
  const allParadigmIds = useMemo(() => [...activeParadigmIds, ...passiveParadigmIds], [activeParadigmIds, passiveParadigmIds]);
  const activeParadigmsActive = materials.has("active-indicative-paradigms");
  const passiveParadigmsActive = materials.has("passive-indicative-paradigms");
  const activeParadigmState = selectionState(paradigmCards, activeParadigmIds, activeParadigmsActive);
  const passiveParadigmState = selectionState(paradigmCards, passiveParadigmIds, passiveParadigmsActive);
  const grammarSelectedCount = activeParadigmState.selectedCount + passiveParadigmState.selectedCount;
  const grammarChecked = activeParadigmState.checked && passiveParadigmState.checked;
  const grammarMixed = (activeParadigmsActive || passiveParadigmsActive) && (!grammarChecked || activeParadigmState.mixed || passiveParadigmState.mixed);

  const vocabularyCards = useMemo(() => vocabularyDeck?.cards.filter((card) => matchesVocabularyCard(card, vocabularyParts)) ?? [], [vocabularyDeck, vocabularyParts]);
  const activeParadigmStudyCards = useMemo(() => activeParadigmDeck?.cards.filter((card) => selected(paradigmCards, card.id)) ?? [], [activeParadigmDeck, paradigmCards]);
  const passiveParadigmStudyCards = useMemo(() => passiveParadigmDeck?.cards.filter((card) => selected(paradigmCards, card.id)) ?? [], [paradigmCards, passiveParadigmDeck]);

  const savedCardCount = useMemo(() => {
    const decks = [vocabularyDeck, activeParadigmDeck, passiveParadigmDeck].filter((item): item is DeckDefinition => Boolean(item));
    return decks.flatMap((sourceDeck) => sourceDeck.cards.map((card) => savedCardRef(sourceDeck.id, card.id))).filter((ref) => savedCards.refs.has(ref)).length;
  }, [activeParadigmDeck, passiveParadigmDeck, savedCards.refs, vocabularyDeck]);

  const sources = useMemo(() => {
    const next: StudySourceDefinition[] = [];
    const paradigmStudyKey = direction === "forward" ? "chart" : "reverse";
    if (vocabularyActive && vocabularyDeck && vocabularyCards.length) {
      next.push({ id: "vocabulary", label: "Dickinson vocabulary", deck: vocabularyDeck, cards: vocabularyCards, studyKey: direction, direction });
    }
    if (activeParadigmsActive && activeParadigmDeck && activeParadigmStudyCards.length) {
      next.push({ id: "active-indicative-paradigms", label: "Active indicative paradigm", deck: activeParadigmDeck, cards: activeParadigmStudyCards, studyKey: paradigmStudyKey, direction });
    }
    if (passiveParadigmsActive && passiveParadigmDeck && passiveParadigmStudyCards.length) {
      next.push({ id: "passive-indicative-paradigms", label: "Passive indicative paradigm", deck: passiveParadigmDeck, cards: passiveParadigmStudyCards, studyKey: paradigmStudyKey, direction });
    }

    if (includeSavedCards) {
      const alreadySelected = new Set(next.flatMap((source) => source.cards.map((card) => savedCardRef(source.deck.id, card.id))));
      const appendSaved = (id: string, sourceDeck: DeckDefinition | null | undefined, studyKey: string) => {
        if (!sourceDeck) return;
        const cards = sourceDeck.cards.filter((card) => {
          const ref = savedCardRef(sourceDeck.id, card.id);
          return savedCards.refs.has(ref) && !alreadySelected.has(ref);
        });
        if (!cards.length) return;
        next.push({ id, label: "Saved Cards", deck: sourceDeck, cards, studyKey, direction });
        cards.forEach((card) => alreadySelected.add(savedCardRef(sourceDeck.id, card.id)));
      };
      appendSaved("saved-vocabulary", vocabularyDeck, direction);
      appendSaved("saved-active-indicative-paradigms", activeParadigmDeck, paradigmStudyKey);
      appendSaved("saved-passive-indicative-paradigms", passiveParadigmDeck, paradigmStudyKey);
    }
    return next;
  }, [activeParadigmDeck, activeParadigmStudyCards, activeParadigmsActive, direction, includeSavedCards, passiveParadigmDeck, passiveParadigmStudyCards, passiveParadigmsActive, savedCards.refs, vocabularyActive, vocabularyCards, vocabularyDeck]);

  const selectedCards = useMemo(() => sources.flatMap((source) => source.cards), [sources]);
  const virtualDeck = useMemo<DeckDefinition>(() => ({
    id: "latin-study-app",
    slug: "latin",
    title: "Latin",
    eyebrow: "Vocabulary · grammar",
    description: "A unified Latin study surface for Dickinson vocabulary and selected Latin paradigms.",
    language: "latin",
    cards: selectedCards,
    supportsReverse: true,
  }), [selectedCards]);
  const resetKey = `${direction}|${[...materials].sort().join(",")}|v:${selectionKey(vocabularyParts)}|p:${selectionKey(paradigmCards)}|saved:${includeSavedCards ? "on" : "off"}`;

  function toggleMaterial(material: Material, checked: boolean) {
    setMaterials((current) => {
      const next = new Set(current);
      checked ? next.add(material) : next.delete(material);
      return next;
    });
  }

  function activateVocabularyOnly(values: readonly string[]) {
    toggleMaterial("vocabulary", true);
    setVocabularyParts(new Set(values));
  }

  function changeVocabulary(values: readonly string[], checked: boolean) {
    if (!vocabularyActive && checked) {
      activateVocabularyOnly(values);
      return;
    }
    setVocabularyParts((current) => setValues(current, allVocabularyParts, values, checked));
  }

  function currentlySelectedParadigmIds(current: OptionalSelection) {
    if (current !== null) return new Set(current);
    const next = new Set<string>();
    if (activeParadigmsActive) activeParadigmIds.forEach((id) => next.add(id));
    if (passiveParadigmsActive) passiveParadigmIds.forEach((id) => next.add(id));
    return next;
  }

  function changeParadigmDeck(material: Material, ids: readonly string[], checked: boolean) {
    toggleMaterial(material, checked);
    setParadigmCards((current) => {
      if (checked) {
        if (current === null) return null;
        const next = new Set(current);
        ids.forEach((id) => next.add(id));
        return next.size === allParadigmIds.length ? null : next;
      }
      const next = current === null ? new Set(allParadigmIds) : new Set(current);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }

  function changeParadigmValues(material: Material, values: readonly string[], checked: boolean) {
    const active = materials.has(material);
    if (!active && checked) {
      setMaterials((current) => new Set(current).add(material));
      setParadigmCards((current) => {
        const next = currentlySelectedParadigmIds(current);
        values.forEach((value) => next.add(value));
        return next.size === allParadigmIds.length ? null : next;
      });
      return;
    }
    setParadigmCards((current) => setValues(current, allParadigmIds, values, checked));
  }

  function changeGrammarParent(checked: boolean) {
    setMaterials((current) => {
      const next = new Set(current);
      if (checked) {
        next.add("active-indicative-paradigms");
        next.add("passive-indicative-paradigms");
      } else {
        next.delete("active-indicative-paradigms");
        next.delete("passive-indicative-paradigms");
      }
      return next;
    });
    setParadigmCards(checked ? null : new Set());
  }

  const paradigmError = activeParadigmError ?? passiveParadigmError;

  return (
    <main className="page-shell study-page latin-page">
      <div className="study-page-heading">
        <div><h1>Latin</h1></div>
      </div>

      {!user && <div className="guest-banner"><span>You are studying as a guest. Progress stays on this device.</span><Link to="/account">Sign in to sync</Link></div>}
      {(vocabularyError || paradigmError || savedCards.error) && <div className="inline-alert">{vocabularyError ?? paradigmError ?? savedCards.error}</div>}

      <StudyFilterMenu summary={`${selectedCards.length.toLocaleString()} cards in the current pool`}>
        <FilterSection title="Saved cards">
          <FilterCheckbox label="Saved Cards" count={savedCardCount} checked={includeSavedCards} disabled={!savedCards.ready || savedCardCount === 0} onChange={setIncludeSavedCards} hint="Cards you save with the card button or S shortcut are private to your account or this guest browser." />
        </FilterSection>

        <FilterDisclosure
          title="Latin (Dickinson)"
          ariaLabel="Latin Dickinson"
          count={vocabularyDeck?.cards.length ?? 997}
          summary="Frequency-ranked · top 100, then 25-card unlocks"
          checked={vocabularyState.checked}
          mixed={vocabularyState.mixed}
          onCheckedChange={(checked) => {
            toggleMaterial("vocabulary", checked);
            setVocabularyParts(checked ? null : new Set());
          }}
        >
          {vocabularyDeck && (
            <FilterSection title="Vocabulary categories" description="Choose a category directly, or open a category with multiple subtypes for a narrower selection.">
              {[...vocabularyGroups.entries()].map(([family, items]) => {
                const values = items.map((item) => item.value);
                const state = selectionState(vocabularyParts, values, vocabularyActive);
                const count = items.reduce((sum, item) => sum + item.count, 0);
                if (items.length === 1) {
                  const item = items[0];
                  return <FilterCheckbox key={family} label={family} count={count} checked={vocabularyActive && selected(vocabularyParts, item.value)} onChange={(checked) => changeVocabulary([item.value], checked)} />;
                }
                return (
                  <FilterDisclosure
                    key={family}
                    title={family}
                    count={count}
                    summary={`${state.selectedCount} of ${values.length} types selected`}
                    checked={state.checked}
                    mixed={state.mixed}
                    onCheckedChange={(checked) => {
                      if (!vocabularyActive && checked) {
                        activateVocabularyOnly(values);
                        return;
                      }
                      changeVocabulary(values, checked);
                    }}
                    nested
                  >
                    <FilterSection title={family} description={`Choose all ${family.toLowerCase()} vocabulary or only specific types.`}>
                      {items.map((item) => (
                        <FilterCheckbox
                          key={item.value}
                          label={item.value.includes(":") ? item.value.split(":").slice(1).join(":").trim() : item.value}
                          count={item.count}
                          checked={vocabularyActive && selected(vocabularyParts, item.value)}
                          onChange={(checked) => changeVocabulary([item.value], checked)}
                        />
                      ))}
                    </FilterSection>
                  </FilterDisclosure>
                );
              })}
            </FilterSection>
          )}
        </FilterDisclosure>

        <FilterDisclosure
          title="Grammer (Henle)"
          ariaLabel="Grammer Henle"
          count={allParadigmIds.length || 36}
          summary={`${grammarSelectedCount} of ${allParadigmIds.length || 36} paradigms selected`}
          checked={grammarChecked}
          mixed={grammarMixed}
          onCheckedChange={changeGrammarParent}
        >
          <ParadigmDeckFilters
            title="Active Indicative Paradigms"
            material="active-indicative-paradigms"
            deck={activeParadigmDeck}
            tenses={activeParadigmTenses}
            active={activeParadigmsActive}
            selection={paradigmCards}
            allParadigmIds={allParadigmIds}
            onDeckChange={changeParadigmDeck}
            onValuesChange={changeParadigmValues}
          />
          <ParadigmDeckFilters
            title="Passive Indicative Paradigms"
            material="passive-indicative-paradigms"
            deck={passiveParadigmDeck}
            tenses={passiveParadigmTenses}
            active={passiveParadigmsActive}
            selection={paradigmCards}
            allParadigmIds={allParadigmIds}
            onDeckChange={changeParadigmDeck}
            onValuesChange={changeParadigmValues}
          />
        </FilterDisclosure>
      </StudyFilterMenu>

      {vocabularyDeck ? (
        <MultiSourceStudySession
          deck={virtualDeck}
          sources={sources}
          resetKey={resetKey}
          direction={direction}
          onDirectionChange={setDirection}
          directionLabels={{ forward: "Forward", reverse: "Reverse" }}
          resumeSession={resumeSession}
          savedCardRefs={savedCards.refs}
          onToggleSavedCard={savedCards.toggleSaved}
          cardMeta={(card, source) => source.deck.id === vocabularyDeck.id
            ? `Entry ${Number(card.metadata?.deckPosition ?? 0)} of ${vocabularyDeck.cards.length} · Dickinson rank ${card.rank}`
            : `${card.category ?? "Indicative paradigm"} · whole paradigm`}
          priorityPrompt={(card, copy) => String(card.metadata?.studySource).includes("indicative-paradigm") ? (direction === "reverse" ? "Identify the complete paradigm" : `${card.front} · Complete chart`) : copy.prompt}
          renderFront={(card, copy, source) => {
            const isParadigm = source.deck.id === activeParadigmDeck?.id || source.deck.id === passiveParadigmDeck?.id;
            if (isParadigm) {
              if (source.direction === "reverse") return <span className="henle-chart-face"><span className="chart-instruction">Identify this paradigm.</span><LatinParadigmTable card={card} revealed /></span>;
              return <span className="henle-chart-face"><strong className="henle-card-title">{card.front}</strong><span className="chart-instruction">Reconstruct the complete paradigm from memory.</span><LatinParadigmTable card={card} revealed={false} /></span>;
            }
            return <span className={source.direction === "forward" ? "latin-front" : "study-prompt reverse-text-prompt"}>{copy.prompt}</span>;
          }}
          renderBack={(card, copy, source) => {
            const isParadigm = source.deck.id === activeParadigmDeck?.id || source.deck.id === passiveParadigmDeck?.id;
            if (isParadigm) {
              if (source.direction === "reverse") return <span className="answer-block"><strong className="henle-card-title">{card.front}</strong>{card.notes && <span className="answer-notes">{card.notes}</span>}</span>;
              return <span className="henle-chart-face"><strong className="henle-card-title">{card.front}</strong><LatinParadigmTable card={card} revealed /></span>;
            }
            return <span className="answer-block"><strong className={source.direction === "reverse" ? "latin-front compact-latin" : "study-answer"}>{copy.answer}</strong>{card.notes && <span className="answer-notes">{card.notes}</span>}</span>;
          }}
        />
      ) : (
        <div className="study-loading panel-surface"><span className="loading-mark">A</span><p>Preparing Latin…</p></div>
      )}
    </main>
  );
}
