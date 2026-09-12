import { normalizeResponseTime } from "./engine";
import type { CardProgress, ReviewDifficulty, ReviewResult, StudyStats } from "./types";

export const EASY_RECALL_LIMIT_MS = 3_000;
export const HARD_RECALL_START_MS = 10_000;
export const INITIAL_AUTO_WRONG_REVIEWS = 3;
export const RECENT_AUTO_GRADE_WINDOW = 3;
export const INITIAL_COVERAGE_MULTIPLIER = 1.25;

export type AutoReviewDefaults = { result: ReviewResult; difficulty: ReviewDifficulty };

/**
 * Correctness defaults are personal learning-state suggestions. A card defaults
 * to Wrong for its first three saved reviews in the current study mode/direction.
 * Beginning with attempt four, the majority result from the three most recent
 * saved reviews wins. Recall time continues to choose only the default difficulty.
 */
export function autoReviewResult(progress?: Pick<CardProgress, "reviews" | "history"> | null): ReviewResult {
  if (!progress || progress.reviews < INITIAL_AUTO_WRONG_REVIEWS || progress.history.length < RECENT_AUTO_GRADE_WINDOW) return "wrong";
  const recent = progress.history.slice(-RECENT_AUTO_GRADE_WINDOW);
  const right = recent.filter((review) => review.result === "right").length;
  return right >= 2 ? "right" : "wrong";
}

export function autoReviewDefaults(responseTimeMs: number, progress?: Pick<CardProgress, "reviews" | "history"> | null): AutoReviewDefaults {
  const elapsed = normalizeResponseTime(responseTimeMs);
  const result = autoReviewResult(progress);
  if (elapsed < EASY_RECALL_LIMIT_MS) return { result, difficulty: "easy" };
  if (elapsed < HARD_RECALL_START_MS) return { result, difficulty: "medium" };
  return { result, difficulty: "hard" };
}

function rankedSessionReviews(progress: CardProgress, sessionId: string) {
  return progress.history.filter((review) => review.sessionId === sessionId && (review.activityKind ?? "study") === "study" && !review.statsExcluded);
}

/**
 * During the first adaptive pass, repeats are allowed but may use at most 25%
 * extra presentations. Once the remaining 125%-budget slots equal the number
 * of unseen selected cards, only unseen cards are eligible until coverage is
 * complete. After every selected card has one ranked review in the session,
 * the normal adaptive pool is returned unchanged.
 */
export function constrainAdaptiveInitialCoverage<T>(items: readonly T[], sessionId: string, progressFor: (item: T) => CardProgress): T[] {
  if (!items.length) return [];
  const unseen = items.filter((item) => rankedSessionReviews(progressFor(item), sessionId).length === 0);
  if (!unseen.length) return [...items];
  const presentations = items.reduce((sum, item) => sum + rankedSessionReviews(progressFor(item), sessionId).length, 0);
  const maximumInitialPresentations = Math.ceil(items.length * INITIAL_COVERAGE_MULTIPLIER);
  const remainingBudget = Math.max(0, maximumInitialPresentations - presentations);
  return remainingBudget <= unseen.length ? unseen : [...items];
}

export type SessionProgressItem = { progress: CardProgress };
export type SessionProgressSummary = {
  stats: StudyStats;
  initialReviewed: number;
  initialTotal: number;
  initialPercent: number;
  initialMastered: number;
  initialMasteryPercent: number;
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
  const initialMasteryPercent = initialTotal ? rightOnce / initialTotal * 100 : 0;
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
    initialMastered: rightOnce,
    initialMasteryPercent,
  };
}
