import type { ReviewResult } from "./types";

/** Transient review state for a flash run. This does not affect saved card history. */
export type MarkedFlashCycle = {
  originalKeys: string[];
  activeKeys: string[];
  wrongKeys: string[];
};

/** Capture the original flash cohort once; every later focus pass is a subset of it. */
export function beginMarkedFlashCycle(originalKeys: readonly string[], activeKeys: readonly string[] = originalKeys): MarkedFlashCycle {
  const original = [...new Set(originalKeys)];
  const allowed = new Set(original);
  return {
    originalKeys: original,
    activeKeys: [...new Set(activeKeys)].filter((key) => allowed.has(key)),
    wrongKeys: [],
  };
}

/** null reverses a saved grade (Back); Right supersedes Wrong on correction. */
export function recordMarkedFlashGrade(cycle: MarkedFlashCycle, key: string, result: ReviewResult | null): MarkedFlashCycle {
  if (!cycle.activeKeys.includes(key)) return cycle;
  const wrongKeys = cycle.wrongKeys.filter((entry) => entry !== key);
  if (result === "wrong") wrongKeys.push(key);
  return { ...cycle, wrongKeys };
}

/** "all" restores the original cohort; "wrong" uses *only* this pass's graded mistakes. */
export function restartMarkedFlashCycle(cycle: MarkedFlashCycle, scope: "all" | "wrong"): MarkedFlashCycle | null {
  const nextKeys = scope === "all"
    ? cycle.originalKeys
    : cycle.activeKeys.filter((key) => cycle.wrongKeys.includes(key));
  return nextKeys.length ? beginMarkedFlashCycle(cycle.originalKeys, nextKeys) : null;
}
