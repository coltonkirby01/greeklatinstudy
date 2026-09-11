import { describe, expect, it } from "vitest";
import { blankCardProgress } from "../src/features/study/engine";
import { INITIAL_AUTO_WRONG_REVIEWS, RECENT_AUTO_GRADE_WINDOW, autoReviewDefaults, autoReviewResult, sessionProgressSummary } from "../src/features/study/session-review";
import type { CardProgress, ReviewRecord } from "../src/features/study/types";

function progressWith(...history: ReviewRecord[]): CardProgress {
  return { ...blankCardProgress(), history };
}

function review(id: string, reviewedAt: number, result: "right" | "wrong", difficulty: "easy" | "medium" | "hard", responseTimeMs: number, sessionId = "session-a"): ReviewRecord {
  return { id, reviewedAt, result, difficulty, responseTimeMs, intervalMs: 60_000, strength: 0.1, sessionId, activityKind: "study" };
}

describe("automatic review defaults", () => {
  it("defaults attempts one through three to wrong", () => {
    expect(INITIAL_AUTO_WRONG_REVIEWS).toBe(3);
    expect(RECENT_AUTO_GRADE_WINDOW).toBe(3);
    expect(autoReviewResult(progressWith())).toBe("wrong");
    expect(autoReviewResult(progressWith(review("a", 1, "right", "easy", 1_000)))).toBe("wrong");
    expect(autoReviewResult(progressWith(review("a", 1, "right", "easy", 1_000), review("b", 2, "right", "easy", 1_000)))).toBe("wrong");
  });

  it("uses the majority of the three most recent saved reviews after attempt three", () => {
    const mostlyRight = progressWith(
      review("a", 1, "wrong", "hard", 10_000),
      review("b", 2, "right", "medium", 5_000),
      review("c", 3, "right", "easy", 2_000),
    );
    mostlyRight.reviews = 3;
    const mostlyWrong = progressWith(
      review("a", 1, "right", "easy", 2_000),
      review("b", 2, "wrong", "medium", 5_000),
      review("c", 3, "wrong", "hard", 10_000),
    );
    mostlyWrong.reviews = 3;
    expect(autoReviewResult(mostlyRight)).toBe("right");
    expect(autoReviewResult(mostlyWrong)).toBe("wrong");
    expect(autoReviewDefaults(2_999, mostlyRight)).toEqual({ result: "right", difficulty: "easy" });
    expect(autoReviewDefaults(10_000, mostlyWrong)).toEqual({ result: "wrong", difficulty: "hard" });
  });

  it("changes with the rolling last-three window rather than lifetime accuracy", () => {
    const progress = progressWith(
      review("a", 1, "right", "easy", 1_000),
      review("b", 2, "right", "easy", 1_000),
      review("c", 3, "right", "easy", 1_000),
      review("d", 4, "wrong", "hard", 10_000),
      review("e", 5, "wrong", "hard", 10_000),
    );
    progress.reviews = 5;
    expect(autoReviewResult(progress)).toBe("wrong");
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
