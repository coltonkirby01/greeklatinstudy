import { describe, expect, it } from "vitest";
import { ADAPTIVE_PROFILES, adaptiveNeedBoost, constrainAdaptiveCoverage } from "../src/features/study/adaptive-settings";
import { blankCardProgress } from "../src/features/study/engine";
import type { CardProgress, ReviewRecord } from "../src/features/study/types";

function review(id: string, reviewedAt: number, result: "right" | "wrong" = "wrong", difficulty: "easy" | "medium" | "hard" = "medium"): ReviewRecord {
  return { id, reviewedAt, result, difficulty, responseTimeMs: 2_000, intervalMs: 60_000, strength: 0.1, sessionId: "session-a", activityKind: "study" };
}

function progress(...history: ReviewRecord[]): CardProgress {
  const state = { ...blankCardProgress(), history: [...history] };
  state.reviews = history.length;
  state.wrong = history.filter((item) => item.result === "wrong").length;
  state.right = history.filter((item) => item.result === "right").length;
  state.hard = history.filter((item) => item.difficulty === "hard").length;
  state.lastResult = history.at(-1)?.result ?? null;
  state.lastDifficulty = history.at(-1)?.difficulty ?? null;
  return state;
}

describe("adaptive repetition strength", () => {
  it("makes level 1 broadest and level 3 most concentrated on high-need cards", () => {
    expect(ADAPTIVE_PROFILES[1].coverageMultiplier).toBeLessThan(ADAPTIVE_PROFILES[2].coverageMultiplier);
    expect(ADAPTIVE_PROFILES[2].coverageMultiplier).toBeLessThan(ADAPTIVE_PROFILES[3].coverageMultiplier);
    expect(ADAPTIVE_PROFILES[1].rankedPoolSize).toBeGreaterThan(ADAPTIVE_PROFILES[3].rankedPoolSize);
    expect(ADAPTIVE_PROFILES[1].temperature).toBeGreaterThan(ADAPTIVE_PROFILES[3].temperature);
    expect(ADAPTIVE_PROFILES[1].recentAvoidance).toBeGreaterThan(ADAPTIVE_PROFILES[3].recentAvoidance);
  });

  it("forces unseen cards sooner at level 1 than level 3", () => {
    const items = Array.from({ length: 20 }, (_, id) => ({ id, progress: progress() }));
    for (let index = 0; index < 16; index += 1) items[index].progress.history.push(review(`first-${index}`, index + 1));
    for (let index = 0; index < 5; index += 1) items[index].progress.history.push(review(`repeat-${index}`, 30 + index));

    const light = constrainAdaptiveCoverage(items, "session-a", (item) => item.progress, 1);
    const intensive = constrainAdaptiveCoverage(items, "session-a", (item) => item.progress, 3);
    expect(light.map((item) => item.id)).toEqual([16, 17, 18, 19]);
    expect(intensive).toHaveLength(20);
  });

  it("amplifies recent wrong and hard reviews as adaptation rises", () => {
    const weak = progress(
      review("a", 1, "wrong", "hard"),
      review("b", 2, "wrong", "medium"),
      review("c", 3, "wrong", "hard"),
    );
    expect(adaptiveNeedBoost(weak, 1)).toBeLessThan(adaptiveNeedBoost(weak, 2));
    expect(adaptiveNeedBoost(weak, 2)).toBeLessThan(adaptiveNeedBoost(weak, 3));
  });
});
