import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { createEnvelope } from "./engine";
import { loadProgressEnvelope, saveProgressEnvelope } from "./progress-repository";

export type SavedCardLanguage = "greek" | "latin";

const savedDeckId = (language: SavedCardLanguage, user: User | null) => user ? `user-saved-cards-${language}:${user.id}` : `guest-saved-cards-${language}`;
const savedFilterKey = (language: SavedCardLanguage) => `greeklatinstudy:${language}:include-saved-cards:v1`;
const savedCardRemovalRequestEvent = "greeklatinstudy:saved-card-removal-request";

export function savedCardRef(deckId: string, cardId: string) {
  return `${deckId}\u001f${cardId}`;
}

export function parseSavedCardRef(ref: string) {
  const separator = ref.indexOf("\u001f");
  if (separator <= 0 || separator >= ref.length - 1) return null;
  return { deckId: ref.slice(0, separator), cardId: ref.slice(separator + 1) };
}

export function requestSavedCardRemoval(ref: string) {
  if (typeof window === "undefined" || typeof CustomEvent === "undefined") return;
  if (!parseSavedCardRef(ref)) return;
  window.dispatchEvent(new CustomEvent(savedCardRemovalRequestEvent, { detail: { ref } }));
}

export function loadIncludeSavedCards(language: SavedCardLanguage) {
  if (typeof window === "undefined") return false;
  try { return window.localStorage.getItem(savedFilterKey(language)) === "true"; } catch { return false; }
}

export function saveIncludeSavedCards(language: SavedCardLanguage, selected: boolean) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(savedFilterKey(language), String(selected)); } catch { /* Ignore unavailable browser storage. */ }
}

async function loadSavedCardRefs(language: SavedCardLanguage, user: User | null) {
  const loaded = await loadProgressEnvelope(savedDeckId(language, user), user);
  return new Set(loaded.envelope?.savedCardRefs ?? []);
}

async function persistSavedCardRefs(language: SavedCardLanguage, user: User | null, refs: ReadonlySet<string>) {
  const deckId = savedDeckId(language, user);
  const loaded = await loadProgressEnvelope(deckId, user);
  const current = loaded.envelope ?? createEnvelope(deckId);
  const now = Date.now();
  await saveProgressEnvelope({
    ...current,
    updatedAt: now,
    savedCardRefs: [...refs].sort(),
    savedCardsUpdatedAt: now,
  }, user);
}

export function useSavedCards(language: SavedCardLanguage, user: User | null) {
  const [refs, setRefs] = useState<Set<string>>(() => new Set());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refsRef = useRef(refs);
  const persistQueue = useRef<Promise<void>>(Promise.resolve());

  const setSaved = useCallback((deckId: string, cardId: string, saved: boolean) => {
    const key = savedCardRef(deckId, cardId);
    const next = new Set(refsRef.current);
    saved ? next.add(key) : next.delete(key);
    refsRef.current = next;
    setRefs(next);
    setError(null);
    persistQueue.current = persistQueue.current.catch(() => undefined).then(async () => {
      await persistSavedCardRefs(language, user, next);
    }).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : "Saved cards could not be synced.");
    });
  }, [language, user]);

  useEffect(() => {
    let active = true;
    setReady(false);
    setError(null);
    void loadSavedCardRefs(language, user).then((loaded) => {
      if (!active) return;
      refsRef.current = loaded;
      setRefs(loaded);
      setReady(true);
    }).catch((reason: unknown) => {
      if (!active) return;
      setError(reason instanceof Error ? reason.message : "Saved cards could not be loaded.");
      setReady(true);
    });
    return () => { active = false; };
  }, [language, user?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onRemovalRequest = (event: Event) => {
      const ref = (event as CustomEvent<{ ref?: unknown }>).detail?.ref;
      if (typeof ref !== "string" || !refsRef.current.has(ref)) return;
      const target = parseSavedCardRef(ref);
      if (!target) return;
      setSaved(target.deckId, target.cardId, false);
    };
    window.addEventListener(savedCardRemovalRequestEvent, onRemovalRequest);
    return () => window.removeEventListener(savedCardRemovalRequestEvent, onRemovalRequest);
  }, [setSaved]);

  const toggleSaved = useCallback((deckId: string, cardId: string) => {
    const key = savedCardRef(deckId, cardId);
    setSaved(deckId, cardId, !refsRef.current.has(key));
  }, [setSaved]);

  const isSaved = useCallback((deckId: string, cardId: string) => refs.has(savedCardRef(deckId, cardId)), [refs]);

  return { refs, ready, error, isSaved, setSaved, toggleSaved };
}
