import { normalizeResponseTime } from "./engine";
import type { CardProgress, ReviewDifficulty, ReviewResult, StudyStats } from "./types";

export const EASY_RECALL_LIMIT_MS = 3_000;
export const HARD_RECALL_START_MS = 10_000;
export const AUTO_WRONG_REVIEW_COUNT = 7;

export type AutoReviewDefaults = { result: ReviewResult; difficulty: ReviewDifficulty };

/**
 * Suggested grade from active front-side recall time. The first seven saved
 * reviews of a card in the current study mode/direction default to Wrong;
 * review eight and later default to Right. Recall time only chooses the default
 * difficulty. The user can override either correctness or difficulty before saving.
 */
export function autoReviewDefaults(responseTimeMs: number, priorReviews = 0): AutoReviewDefaults {
  const elapsed = normalizeResponseTime(responseTimeMs);
  const result: ReviewResult = priorReviews < AUTO_WRONG_REVIEW_COUNT ? "wrong" : "right";
  if (elapsed < EASY_RECALL_LIMIT_MS) return { result, difficulty: "easy" };
  if (elapsed < HARD_RECALL_START_MS) return { result, difficulty: "medium" };
  return { result, difficulty: "hard" };
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
    let cardReviewed = false;
    let cardWrong = false;
    let cardHard = false;
    let cardRight = false;

    for (const review of progress.history) {
      if (review.sessionId !== sessionId || (review.activityKind ?? "study") !== "study" || review.statsExcluded) continue;
      cardReviewed = true;
      if (review.result === "right") {
        cardRight = true;
        rightReviews += 1;
      } else {
        cardWrong = true;
      }
      if (review.difficulty === "hard") cardHard = true;
      totalReviews += 1;
      responseTotal += review.responseTimeMs;
      responseCount += 1;
      chronological.push({ reviewedAt: review.reviewedAt, result: review.result });
    }

    if (!cardReviewed) continue;
    reviewed += 1;
    if (cardWrong) everWrong += 1;
    if (cardHard) markedHard += 1;
    if (cardRight) rightOnce += 1;
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
