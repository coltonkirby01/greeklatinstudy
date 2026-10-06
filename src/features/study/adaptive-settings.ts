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
    coverageMultiplier: 1.05,
    recentAvoidance: 6,
    rankedPoolSize: 36,
    temperature: 18,
    wrongBoost: 0.5,
    hardBoost: 0.25,
    lastWrongBoost: 1,
  },
  2: {
    coverageMultiplier: 1.25,
    recentAvoidance: 4,
    rankedPoolSize: 24,
    temperature: 11,
    wrongBoost: 1.5,
    hardBoost: 0.75,
    lastWrongBoost: 3,
  },
  3: {
    coverageMultiplier: 1.75,
    recentAvoidance: 2,
    rankedPoolSize: 12,
    temperature: 6,
    wrongBoost: 5,
    hardBoost: 2,
    lastWrongBoost: 8,
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
