import type { CardProgress } from "./types";

export type AdaptiveStrength = 1 | 2 | 3;

export type AdaptiveProfile = {
  coverageMultiplier: number;
  recentAvoidance: number;
  rankedPoolSize: number;
  temperature: number;
  wrongBoost: number;
  hardBoost: number;
  lastWrongBoost: number;
};

export const ADAPTIVE_PROFILES: Record<AdaptiveStrength, AdaptiveProfile> = {
  1: {
    coverageMultiplier: 1.0,
    recentAvoidance: 14,
    rankedPoolSize: 128,
    temperature: 52,
    wrongBoost: 0.25,
    hardBoost: 0.1,
    lastWrongBoost: 0.5,
  },
  2: {
    coverageMultiplier: 1.1,
    recentAvoidance: 11,
    rankedPoolSize: 96,
    temperature: 44,
    wrongBoost: 0.75,
    hardBoost: 0.35,
    lastWrongBoost: 1.5,
  },
  3: {
    coverageMultiplier: 1.25,
    recentAvoidance: 8,
    rankedPoolSize: 72,
    temperature: 36,
    wrongBoost: 2,
    hardBoost: 0.8,
    lastWrongBoost: 4,
  },
};

export function normalizeAdaptiveStrength(value: number): AdaptiveStrength {
  if (value <= 1) return 1;
  if (value >= 3) return 3;
  return 2;
}

function rankedSessionReviews(progress: CardProgress, sessionId: string) {
  return progress.history.filter((review) => review.sessionId === sessionId && (review.activityKind ?? "study") === "study" && !review.statsExcluded);
}

/**
 * Strength 1 strongly favors breadth during first coverage; strength 3 leaves
 * more room to repeat weak cards before unseen cards become mandatory.
 */
export function constrainAdaptiveCoverage<T>(items: readonly T[], sessionId: string, progressFor: (item: T) => CardProgress, strength: AdaptiveStrength): T[] {
  if (!items.length) return [];
  const unseen = items.filter((item) => rankedSessionReviews(progressFor(item), sessionId).length === 0);
  if (!unseen.length) return [...items];
  const presentations = items.reduce((sum, item) => sum + rankedSessionReviews(progressFor(item), sessionId).length, 0);
  const maximumInitialPresentations = Math.ceil(items.length * ADAPTIVE_PROFILES[strength].coverageMultiplier);
  const remainingBudget = Math.max(0, maximumInitialPresentations - presentations);
  return remainingBudget <= unseen.length ? unseen : [...items];
}

/**
 * Adds a deliberately stronger short-term weakness signal as adaptation rises.
 * Long-term scheduling remains supplied by priorityScore; this only changes how
 * aggressively the adaptive picker revisits recent misses and hard recalls.
 */
export function adaptiveNeedBoost(progress: CardProgress, strength: AdaptiveStrength) {
  const profile = ADAPTIVE_PROFILES[strength];
  const recent = progress.history.slice(-3);
  const recentWrong = recent.filter((review) => review.result === "wrong").length;
  const recentHard = recent.filter((review) => review.difficulty === "hard").length;
  return recentWrong * profile.wrongBoost + recentHard * profile.hardBoost + (progress.lastResult === "wrong" ? profile.lastWrongBoost : 0);
}

// Across a large selected pool, repeated reviews of one card should slowly
// yield to other selected cards without discarding long-term learning evidence.
export function adaptiveRepeatPenalty(progress: CardProgress, sessionId: string, strength: AdaptiveStrength) {
  const repetitions = rankedSessionReviews(progress, sessionId).length;
  return Math.min(80, repetitions * ({ 1: 16, 2: 12, 3: 9 }[strength]));
}
