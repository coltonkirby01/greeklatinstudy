import { describe, expect, it } from "vitest";
import { blankCardProgress } from "../src/features/study/engine";
import { visitProgressSummary } from "../src/features/study/session-review";

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
