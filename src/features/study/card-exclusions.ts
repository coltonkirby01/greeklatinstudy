import { useCallback, useEffect, useMemo, useState } from "react";
import { savedCardRef } from "./saved-cards";

export type CardExclusionLanguage = "greek" | "latin";
export type CardSelectionRef = { deckId: string; cardId: string };

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

const exclusionKey = (language: CardExclusionLanguage) => `greeklatinstudy:${language}:card-exclusions:v1`;

function availableStorage(storage?: StorageLike | null) {
  if (storage !== undefined) return storage;
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function loadCardExclusions(language: CardExclusionLanguage, storage?: StorageLike | null) {
  const target = availableStorage(storage);
  if (!target) return new Set<string>();
  try {
    const raw = target.getItem(exclusionKey(language));
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw) as unknown;
    return new Set(Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : []);
  } catch {
    return new Set<string>();
  }
}

export function saveCardExclusions(language: CardExclusionLanguage, refs: ReadonlySet<string>, storage?: StorageLike | null) {
  const target = availableStorage(storage);
  if (!target) return;
  try { target.setItem(exclusionKey(language), JSON.stringify([...refs].sort())); } catch { /* Ignore unavailable browser storage. */ }
}

export function useCardExclusions(language: CardExclusionLanguage) {
  const [refs, setRefs] = useState<Set<string>>(() => loadCardExclusions(language));

  useEffect(() => { saveCardExclusions(language, refs); }, [language, refs]);

  const exclude = useCallback((deckId: string, cardId: string) => {
    setRefs((current) => new Set(current).add(savedCardRef(deckId, cardId)));
  }, []);

  const restore = useCallback((deckId: string, cardId: string) => {
    setRefs((current) => {
      const next = new Set(current);
      next.delete(savedCardRef(deckId, cardId));
      return next;
    });
  }, []);

  const setMany = useCallback((cards: readonly CardSelectionRef[], excluded: boolean) => {
    setRefs((current) => {
      const next = new Set(current);
      for (const card of cards) {
        const ref = savedCardRef(card.deckId, card.cardId);
        if (excluded) next.add(ref);
        else next.delete(ref);
      }
      return next;
    });
  }, []);

  const replace = useCallback((cards: readonly CardSelectionRef[]) => {
    setRefs(new Set(cards.map((card) => savedCardRef(card.deckId, card.cardId))));
  }, []);

  const clear = useCallback(() => setRefs(new Set()), []);
  const isExcluded = useCallback((deckId: string, cardId: string) => refs.has(savedCardRef(deckId, cardId)), [refs]);
  const signature = useMemo(() => [...refs].sort().join(","), [refs]);

  return { refs, exclude, restore, setMany, replace, clear, isExcluded, signature };
}
