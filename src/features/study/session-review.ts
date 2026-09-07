import { normalizeResponseTime } from "./engine";
import type { CardProgress, ReviewDifficulty, ReviewResult, StudyStats } from "./types";

export type AutoReviewDefaults = { result: ReviewResult; difficulty: ReviewDifficulty };

/**
 * Suggested grade from active front-side recall time. These are defaults only;
 * the user can override either correctness or difficulty before saving.
 */
export function autoReviewDefaults(responseTimeMs: number): AutoReviewDefaults {
  const elapsed = normalizeResponseTime(responseTimeMs);
  if (elapsed < 3_000) return { result: "right", difficulty: "easy" };
  if (elapsed < 10_000) return { result: "wrong", difficulty: "medium" };
  return { result: "wrong", difficulty: "hard" };
}

export type SessionProgressItem = { progress: CardProgress };
export type SessionProgressSummary = {
  stats: StudyStats;
  initialReviewed: number;
  initialTotal: number;
  initialPercent: number;
};

/**
 * Builds the sidebar summary from reviews belonging to one ranked session only.
 * Long-term card state remains untouched and continues to drive adaptive review.
 */
export function sessionProgressSummary(items: readonly SessionProgressItem[], sessionId: string): SessionProgressSummary {
  let reviewed = 0;
  let everWrong = 0;
  let markedHard = 0;
  let rightOnce = 0;
  let totalReviews = 0;
  let rightReviews = 0;
  let responseTotal = 0;
  let responseCount = 0;
  const chronological: Array<{ reviewedAt: number; result: ReviewResult }> = [];

  for (const { progress } of items) {
    const reviews = progress.history.filter((review) =>
      review.sessionId === sessionId
      && (review.activityKind ?? "study") === "study"
      && !review.statsExcluded,
    );
    if (!reviews.length) continue;
    reviewed += 1;
    if (reviews.some((review) => review.result === "wrong")) everWrong += 1;
    if (reviews.some((review) => review.difficulty === "hard")) markedHard += 1;
    if (reviews.some((review) => review.result === "right")) rightOnce += 1;
    for (const review of reviews) {
      totalReviews += 1;
      if (review.result === "right") rightReviews += 1;
      responseTotal += review.responseTimeMs;
      responseCount += 1;
      chronological.push({ reviewedAt: review.reviewedAt, result: review.result });
    }
  }

  chronological.sort((a, b) => a.reviewedAt - b.reviewedAt);
  let streak = 0;
  let bestStreak = 0;
  for (const review of chronological) {
    if (review.result === "right") {
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
    } else {
      streak = 0;
    }
  }

  const initialTotal = items.length;
  const initialPercent = initialTotal ? reviewed / initialTotal * 100 : 0;
  return {
    stats: {
      available: initialTotal,
      reviewed,
      accuracy: totalReviews ? rightReviews / totalReviews : null,
      everWrong,
      markedHard,
      averageResponseTimeMs: responseCount ? responseTotal / responseCount : 0,
      mastered: rightOnce,
      totalReviews,
      bestStreak,
    },
    initialReviewed: reviewed,
    initialTotal,
    initialPercent,
  };
}
