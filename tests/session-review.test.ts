import { describe, expect, it } from "vitest";
import { blankCardProgress } from "../src/features/study/engine";
import { AUTO_WRONG_REVIEW_COUNT, autoReviewDefaults, sessionProgressSummary } from "../src/features/study/session-review";
import type { CardProgress, ReviewRecord } from "../src/features/study/types";

function progressWith(...history: ReviewRecord[]): CardProgress {
  return { ...blankCardProgress(), history };
}

function review(id: string, reviewedAt: number, result: "right" | "wrong", difficulty: "easy" | "medium" | "hard", responseTimeMs: number, sessionId = "session-a"): ReviewRecord {
  return { id, reviewedAt, result, difficulty, responseTimeMs, intervalMs: 60_000, strength: 0.1, sessionId, activityKind: "study" };
}

describe("automatic review defaults", () => {
  it("defaults the first seven reviews to wrong and review eight onward to right", () => {
    expect(AUTO_WRONG_REVIEW_COUNT).toBe(7);
    expect(autoReviewDefaults(2_999, 0)).toEqual({ result: "wrong", difficulty: "easy" });
    expect(autoReviewDefaults(3_000, 6)).toEqual({ result: "wrong", difficulty: "medium" });
    expect(autoReviewDefaults(9_999, 7)).toEqual({ result: "right", difficulty: "medium" });
    expect(autoReviewDefaults(10_000, 12)).toEqual({ result: "right", difficulty: "hard" });
  });
});

describe("session progress summary", () => {
  it("counts only the selected ranked session and tracks first-pass coverage", () => {
    const first = progressWith(
      review("a1", 100, "right", "easy", 2_000),
      review("other", 150, "wrong", "hard", 20_000, "session-b"),
      review("a2", 200, "wrong", "medium", 5_000),
    );
    const second = progressWith(review("a3", 300, "right", "hard", 8_000));
    const third = progressWith();

    const summary = sessionProgressSummary([{ progress: first }, { progress: second }, { progress: third }], "session-a");
    expect(summary.initialReviewed).toBe(2);
    expect(summary.initialTotal).toBe(3);
    expect(summary.initialPercent).toBeCloseTo(66.666, 2);
    expect(summary.stats.reviewed).toBe(2);
    expect(summary.stats.totalReviews).toBe(3);
    expect(summary.stats.accuracy).toBeCloseTo(2 / 3);
    expect(summary.stats.everWrong).toBe(1);
    expect(summary.stats.markedHard).toBe(1);
    expect(summary.stats.mastered).toBe(2);
    expect(summary.stats.averageResponseTimeMs).toBe(5_000);
    expect(summary.stats.bestStreak).toBe(1);
  });

  it("excludes warm-up and stats-excluded history", () => {
    const warmup = { ...review("warm", 100, "right", "easy", 1_000), activityKind: "warmup" as const };
    const excluded = { ...review("excluded", 200, "right", "easy", 1_000), statsExcluded: true };
    const summary = sessionProgressSummary([{ progress: progressWith(warmup, excluded) }], "session-a");
    expect(summary.stats.totalReviews).toBe(0);
    expect(summary.initialReviewed).toBe(0);
  });
});
