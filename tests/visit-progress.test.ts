import { describe, expect, it } from "vitest";
import { blankCardProgress } from "../src/features/study/engine";
import { selectedPoolVisitProgress, visitProgressSummary } from "../src/features/study/session-review";

function progressWithReviews(reviews: Array<{ reviewedAt: number; result: "right" | "wrong"; difficulty: "easy" | "medium" | "hard" }>) {
  const progress = blankCardProgress();
  progress.history = reviews.map((review, index) => ({
    id: `review-${index}`,
    reviewedAt: review.reviewedAt,
    result: review.result,
    difficulty: review.difficulty,
    responseTimeMs: 1_000,
    intervalMs: 60_000,
    strength: 0.2,
    activityKind: "study" as const,
  }));
  return progress;
}

describe("page-visit progress", () => {
  it("shows 100 / 150 selected Dickinson cards while the last 50 are locked", () => {
    const available = Array.from({ length: 100 }, (_, index) => ({
      progress: progressWithReviews([{ reviewedAt: 500 + index, result: "right", difficulty: "easy" }]),
    }));
    const summary = selectedPoolVisitProgress(available, 400, 150);
    expect(summary.initialTotal).toBe(150);
    expect(summary.initialReviewed).toBe(100);
    expect(summary.initialPercent).toBeCloseTo(66.667, 2);
    expect(summary.initialMasteryPercent).toBeCloseTo(66.667, 2);
    expect(summary.stats.available).toBe(100);
    expect(summary.stats.totalReviews).toBe(100);
  });

  it("reaches 150 / 150 once the full selected pool is available and reviewed", () => {
    const available = Array.from({ length: 150 }, (_, index) => ({
      progress: progressWithReviews([{ reviewedAt: 500 + index, result: "right", difficulty: "easy" }]),
    }));
    const summary = selectedPoolVisitProgress(available, 400, 150);
    expect(summary.initialTotal).toBe(150);
    expect(summary.initialReviewed).toBe(150);
    expect(summary.initialPercent).toBe(100);
    expect(summary.stats.available).toBe(150);
  });

  it("keeps Ever wrong / Marked hard counts scoped to available reviewed cards", () => {
    const reviewed = progressWithReviews([{ reviewedAt: 550, result: "wrong", difficulty: "hard" }]);
    const summary = selectedPoolVisitProgress([{ progress: reviewed }], 400, 150);
    expect(summary.initialTotal).toBe(150);
    expect(summary.stats.available).toBe(1);
    expect(summary.stats.everWrong).toBe(1);
    expect(summary.stats.markedHard).toBe(1);
  });

  it("ignores reviews saved before the current page visit", () => {
    const summary = visitProgressSummary([
      { progress: progressWithReviews([{ reviewedAt: 100, result: "right", difficulty: "easy" }]) },
      { progress: progressWithReviews([{ reviewedAt: 300, result: "wrong", difficulty: "hard" }]) },
    ], 200);

    expect(summary.initialTotal).toBe(2);
    expect(summary.initialReviewed).toBe(1);
    expect(summary.stats.totalReviews).toBe(1);
    expect(summary.stats.everWrong).toBe(1);
    expect(summary.stats.markedHard).toBe(1);
  });

  it("counts current-visit reviews regardless of the persisted named session id", () => {
    const progress = progressWithReviews([{ reviewedAt: 500, result: "right", difficulty: "medium" }]);
    progress.history[0].sessionId = "older-persistent-session";
    const summary = visitProgressSummary([{ progress }], 400);

    expect(summary.initialReviewed).toBe(1);
    expect(summary.initialMastered).toBe(1);
    expect(summary.stats.accuracy).toBe(1);
  });
});
