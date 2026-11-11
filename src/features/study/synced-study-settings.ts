import type { User } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import type { Json } from "../../lib/database.types";
import type { CardSelectionRef } from "./card-exclusions";
import { parseSavedCardRef } from "./saved-cards";
import type { SelectionMode, StudyDirection } from "./types";

export type StudyLanguage = "greek" | "latin";
export type StudyReviewSetup = { direction: StudyDirection; reviewMode: SelectionMode; adaptiveStrength: 1 | 2 | 3 };
const DEFAULT_REVIEW_SETUP: StudyReviewSetup = { direction: "forward", reviewMode: "adaptive", adaptiveStrength: 2 };
const modes: readonly SelectionMode[] = ["adaptive", "sequential", "shuffle", "confusables"];
const localReviewKey = (language: StudyLanguage) => "greeklatinstudy:" + language + ":review-setup:v1";
// Separate from actual progress envelopes; user_deck_states already enforces per-user RLS.
const accountDeckKey = (language: StudyLanguage) => "account-study-settings:" + language;

export function normalizeStudyReviewSetup(value: unknown): StudyReviewSetup {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ...DEFAULT_REVIEW_SETUP };
  const data = value as Record<string, unknown>;
  return {
    direction: data.direction === "reverse" ? "reverse" : "forward",
    reviewMode: modes.includes(data.reviewMode as SelectionMode) ? data.reviewMode as SelectionMode : "adaptive",
    adaptiveStrength: data.adaptiveStrength === 1 || data.adaptiveStrength === 2 || data.adaptiveStrength === 3 ? data.adaptiveStrength : 2,
  };
}

export function loadLocalStudyReviewSetup(language: StudyLanguage, storage?: Pick<Storage, "getItem"> | null): StudyReviewSetup {
  try {
    const target = storage === undefined ? (typeof window === "undefined" ? null : window.localStorage) : storage;
    const raw = target?.getItem(localReviewKey(language));
    return raw ? normalizeStudyReviewSetup(JSON.parse(raw)) : { ...DEFAULT_REVIEW_SETUP };
  } catch {
    return { ...DEFAULT_REVIEW_SETUP };
  }
}

export function saveLocalStudyReviewSetup(language: StudyLanguage, value: StudyReviewSetup, storage?: Pick<Storage, "setItem"> | null) {
  try {
    const target = storage === undefined ? (typeof window === "undefined" ? null : window.localStorage) : storage;
    target?.setItem(localReviewKey(language), JSON.stringify(normalizeStudyReviewSetup(value)));
  } catch { /* Private browsing may deny local storage. */ }
}

// Postgres jsonb may reorder object keys. Canonicalize so cloud reads do not
// look like user edits and loop into unnecessary writes on each focus.
export function canonicalSettingsJson(value: unknown): string {
  return JSON.stringify(value, (_key, entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return entry;
    return Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a.localeCompare(b)));
  });
}

export function validStringList(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? [...new Set(value)] : null;
}

export function restoreCardExclusions(value: unknown): CardSelectionRef[] | null {
  const list = validStringList(value);
  if (!list) return null;
  return list.flatMap((key) => {
    const parsed = parseSavedCardRef(key);
    return parsed ? [parsed] : [];
  });
}

async function readAccountStudySettings(language: StudyLanguage, userId: string): Promise<unknown | null> {
  const { supabase } = await import("../../lib/supabase");
  if (!supabase) throw new Error("Account sync is not configured.");
  const { data, error } = await supabase.from("user_deck_states")
    .select("state").eq("user_id", userId).eq("deck_id", accountDeckKey(language)).maybeSingle();
  if (error) throw error;
  return data?.state ?? null;
}

async function writeAccountStudySettings(language: StudyLanguage, userId: string, settings: object): Promise<void> {
  const { supabase } = await import("../../lib/supabase");
  if (!supabase) throw new Error("Account sync is not configured.");
  const { error } = await supabase.from("user_deck_states").upsert({
    user_id: userId,
    deck_id: accountDeckKey(language),
    state: settings as unknown as Json,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,deck_id" });
  if (error) throw error;
}

/**
 * Syncs the selected card pool, exclusions, direction and order to the account.
 * Existing review history stays in its own progress envelopes. Cloud wins on
 * another device; a missing account row is seeded from the existing local setup.
 * Hydration must finish before edits are uploaded, preventing a stale first render
 * from replacing a previously saved account configuration.
 */
export function useSyncedStudySettings<T extends object>(
  language: StudyLanguage,
  user: User | null,
  settings: T,
  applyCloudSettings: (value: unknown) => void,
) {
  const userId = user?.id ?? null;
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const applyRef = useRef(applyCloudSettings);
  const localRef = useRef(settings);
  const lastSavedRef = useRef<string | null>(null);
  const generationRef = useRef(0);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  applyRef.current = applyCloudSettings;
  localRef.current = settings;
  const serialized = canonicalSettingsJson(settings);
  const ready = !userId || loadedFor === userId;

  useEffect(() => {
    const generation = ++generationRef.current;
    setLoadedFor(null);
    setError(null);
    lastSavedRef.current = null;
    if (!userId) return;
    void (async () => {
      const cloud = await readAccountStudySettings(language, userId);
      if (generationRef.current !== generation) return;
      if (cloud !== null) {
        lastSavedRef.current = canonicalSettingsJson(cloud);
        applyRef.current(cloud);
      } else {
        const firstSettings = localRef.current;
        await writeAccountStudySettings(language, userId, firstSettings);
        if (generationRef.current !== generation) return;
        lastSavedRef.current = canonicalSettingsJson(firstSettings);
      }
      setLoadedFor(userId);
    })().catch((reason: unknown) => {
      if (generationRef.current !== generation) return;
      lastSavedRef.current = canonicalSettingsJson(localRef.current);
      setError(reason instanceof Error ? reason.message : "Study preferences could not be loaded.");
      setLoadedFor(userId); // Offline: keep the local setup usable.
    });
    return () => { generationRef.current += 1; };
  }, [language, userId]);

  useEffect(() => {
    if (!userId || !ready || error || serialized === lastSavedRef.current) return;
    const generation = generationRef.current;
    const timeout = window.setTimeout(() => {
      saveQueueRef.current = saveQueueRef.current.catch(() => undefined).then(async () => {
        if (generation !== generationRef.current) return;
        await writeAccountStudySettings(language, userId, settings);
        if (generation !== generationRef.current) return;
        lastSavedRef.current = serialized;
        setError(null);
      }).catch((reason: unknown) => {
        if (generation !== generationRef.current) return;
        setError(reason instanceof Error ? reason.message : "Study preferences could not be saved.");
      });
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [language, userId, ready, error, serialized]);

  useEffect(() => {
    if (!userId || !ready || error) return;
    const generation = generationRef.current;
    let refreshing = false;
    const refresh = () => {
      if (refreshing || canonicalSettingsJson(localRef.current) !== lastSavedRef.current) return;
      refreshing = true;
      void readAccountStudySettings(language, userId).then((cloud) => {
        if (generationRef.current !== generation || cloud === null) return;
        if (canonicalSettingsJson(localRef.current) !== lastSavedRef.current) return;
        const next = canonicalSettingsJson(cloud);
        if (next === lastSavedRef.current) return;
        lastSavedRef.current = next;
        applyRef.current(cloud);
      }).catch(() => { /* Network loss must not erase local choices. */ })
        .finally(() => { refreshing = false; });
    };
    const visible = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", visible);
    return () => { window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", visible); };
  }, [language, userId, ready, error]);

  return { ready, error };
}
