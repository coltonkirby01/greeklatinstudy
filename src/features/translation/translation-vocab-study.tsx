import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ExactCardSelection, FilterCheckbox, FilterDisclosure } from "../study/study-filter-menu";
import type { CardSelectionRef } from "../study/card-exclusions";
import type { StudySourceDefinition } from "../study/multi-source-study-session";
import type { DeckDefinition, StudyCard, StudyDirection } from "../study/types";
import { savedCardRef } from "../study/saved-cards";
import type { TranslationHelperLanguage } from "./dictionary-sources";
import { listTranslationVocabEntries } from "./translation-vocab-repository";
import { translationVocabDeck } from "./translation-vocab-model";

type Exclusions = {
  refs: ReadonlySet<string>;
  setMany(cards: readonly CardSelectionRef[], excluded: boolean): void;
  exclude(deckId: string, cardId: string): void;
  restore(deckId: string, cardId: string): void;
  isExcluded(deckId: string, cardId: string): boolean;
};

const preferenceKey = (language: TranslationHelperLanguage) => `greeklatinstudy:${language}:translation-helper-vocab-enabled:v1`;

function loadEnabled(language: TranslationHelperLanguage) {
  if (typeof localStorage === "undefined") return false;
  try { return localStorage.getItem(preferenceKey(language)) === "true"; } catch { return false; }
}

function saveEnabled(language: TranslationHelperLanguage, enabled: boolean) {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(preferenceKey(language), String(enabled)); } catch { /* Ignore unavailable browser storage. */ }
}

export type TranslationVocabStudyState = {
  user: User | null;
  deck: DeckDefinition;
  source: StudySourceDefinition | null;
  ready: boolean;
  error: string | null;
  enabled: boolean;
  selectedCount: number;
  signature: string;
  selectAll(): void;
  selectNone(): void;
  changeCard(card: StudyCard, checked: boolean): void;
  changeCards(cards: readonly StudyCard[], checked: boolean): void;
};

export function useTranslationVocabStudy(
  language: TranslationHelperLanguage,
  user: User | null,
  direction: StudyDirection,
  exclusions: Exclusions,
): TranslationVocabStudyState {
  const [entries, setEntries] = useState<Awaited<ReturnType<typeof listTranslationVocabEntries>>>([]);
  const [ready, setReady] = useState(!user);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(() => loadEnabled(language));

  useEffect(() => { saveEnabled(language, enabled); }, [enabled, language]);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setEntries([]);
      setReady(true);
      setError(null);
      return () => { cancelled = true; };
    }
    setReady(false);
    listTranslationVocabEntries(user, language)
      .then((next) => {
        if (cancelled) return;
        setEntries(next);
        setError(null);
      })
      .catch((loadError) => {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Translation Helper vocabulary could not be loaded.");
      })
      .finally(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, [language, user?.id]);

  const deck = useMemo(() => translationVocabDeck(entries, language), [entries, language]);
  const selectedCards = useMemo(() => enabled
    ? deck.cards.filter((card) => !exclusions.refs.has(savedCardRef(deck.id, card.id)))
    : [], [deck, enabled, exclusions.refs]);
  const source = useMemo<StudySourceDefinition | null>(() => selectedCards.length ? {
    id: `translation-helper-vocab-${language}`,
    label: "Translation Helper Vocab",
    deck,
    cards: selectedCards,
    studyKey: direction,
    direction,
  } : null, [deck, direction, language, selectedCards]);

  const selectAll = useCallback(() => {
    setEnabled(true);
    exclusions.setMany(deck.cards.map((card) => ({ deckId: deck.id, cardId: card.id })), false);
  }, [deck, exclusions.setMany]);

  const selectNone = useCallback(() => setEnabled(false), []);

  const changeCards = useCallback((cards: readonly StudyCard[], checked: boolean) => {
    if (!cards.length) return;
    const targets = cards.map((card) => ({ deckId: deck.id, cardId: card.id }));
    if (!checked) {
      exclusions.setMany(targets, true);
      return;
    }
    if (!enabled) {
      setEnabled(true);
      exclusions.setMany(deck.cards.map((card) => ({ deckId: deck.id, cardId: card.id })), true);
    }
    exclusions.setMany(targets, false);
  }, [deck, enabled, exclusions.setMany]);

  const changeCard = useCallback((card: StudyCard, checked: boolean) => {
    changeCards([card], checked);
  }, [changeCards]);

  const signature = `${enabled ? "on" : "off"}:${selectedCards.map((card) => card.id).sort().join(",")}`;

  return {
    user,
    deck,
    source,
    ready,
    error,
    enabled,
    selectedCount: selectedCards.length,
    signature,
    selectAll,
    selectNone,
    changeCard,
    changeCards,
  };
}

export function TranslationVocabDeckFilter({ study }: { study: TranslationVocabStudyState }) {
  if (!study.user) return null;
  if (!study.deck.cards.length) {
    return <FilterCheckbox
      label="Translation Helper Vocab"
      count={0}
      checked={false}
      disabled
      onChange={() => undefined}
    />;
  }
  const checked = study.enabled && study.selectedCount === study.deck.cards.length;
  const mixed = study.enabled && study.selectedCount > 0 && study.selectedCount < study.deck.cards.length;
  return <FilterDisclosure
    title="Translation Helper Vocab"
    count={study.deck.cards.length}
    summary={`${study.selectedCount} of ${study.deck.cards.length} saved words selected`}
    checked={checked}
    mixed={mixed}
    onCheckedChange={(next) => next ? study.selectAll() : study.selectNone()}
  >
    <ExactCardSelection
      cards={study.deck.cards}
      chunkSize={10}
      sectionTitle="Saved from Translation Helper"
      isSelected={(card) => study.enabled && study.source?.cards.some((item) => item.id === card.id) === true}
      onCardChange={study.changeCard}
      onCardsChange={study.changeCards}
      labelForCard={(card) => `${card.front} — ${card.back}`}
    />
  </FilterDisclosure>;
}
