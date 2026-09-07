import { describe, expect, it } from "vitest";
import { blankCardProgress, createEnvelope, createModeState } from "../src/features/study/engine";
import { LESSON3_GRAMMAR_DECK_ID, purgeRetiredLesson3GrammarProgress, RETIRED_LESSON3_GRAMMAR_CARD_IDS } from "../src/features/study/progress-migrations";

describe("Lesson 3 grammar replacement migration", () => {
  it("physically removes retired individual-form progress while preserving new chart progress", () => {
    const envelope = createEnvelope(LESSON3_GRAMMAR_DECK_ID, 1);
    const mode = createModeState(LESSON3_GRAMMAR_DECK_ID, "forward", 3, undefined, 1);
    const retired = blankCardProgress();
    retired.reviews = 4;
    retired.right = 3;
    retired.wrong = 1;
    const chart = blankCardProgress();
    chart.reviews = 2;
    chart.right = 2;
    mode.cards["lesson3-g-ind-1s"] = retired;
    mode.cards["lesson3-chart-present-active-indicative"] = chart;
    mode.currentCardId = "lesson3-g-ind-1s";
    mode.reviewSequence = ["lesson3-g-ind-1s", "lesson3-chart-present-active-indicative"];
    mode.totalReviews = 6;
    mode.rightReviews = 5;
    mode.wrongReviews = 1;
    envelope.modes.forward = mode;

    const migrated = purgeRetiredLesson3GrammarProgress(envelope);
    expect(migrated.modes.forward.cards["lesson3-g-ind-1s"]).toBeUndefined();
    expect(migrated.modes.forward.cards["lesson3-chart-present-active-indicative"]).toBe(chart);
    expect(migrated.modes.forward.currentCardId).toBeNull();
    expect(migrated.modes.forward.reviewSequence).toEqual(["lesson3-chart-present-active-indicative"]);
    expect(migrated.modes.forward.totalReviews).toBe(2);
    expect(migrated.modes.forward.rightReviews).toBe(2);
    expect(migrated.modes.forward.wrongReviews).toBe(0);
    expect(new Set(migrated.retiredCardIds)).toEqual(new Set(RETIRED_LESSON3_GRAMMAR_CARD_IDS));
  });

  it("does not alter progress belonging to another deck", () => {
    const envelope = createEnvelope("greek-i", 1);
    expect(purgeRetiredLesson3GrammarProgress(envelope)).toBe(envelope);
  });
});
