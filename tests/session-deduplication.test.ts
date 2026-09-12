import { describe, expect, it } from "vitest";
import { createEnvelope, createModeState, presentCard, recordReview } from "../src/features/study/engine";
import { builtinSessionId, displayManagedSessionName, managedSessionsForLanguage } from "../src/features/study/session-management";
import type { StudyCard } from "../src/features/study/types";

const legacyCard: StudyCard = { id: "legacy-form", deckId: "henle-part1-forms", front: "form", back: "answer" };

function legacyLearnerEnvelope() {
  const envelope = createEnvelope("henle-part1-forms", 1);
  let mode = createModeState("henle-part1-forms", "forward", 1, undefined, 1);
  mode = presentCard(mode, legacyCard, 2);
  mode = recordReview(mode, legacyCard, {
    id: "legacy-learner-review",
    result: "right",
    difficulty: "medium",
    responseTimeMs: 1_500,
    reviewedAt: 3,
    sessionId: "older-latin-learner-id",
    sessionStartedAt: 1,
    sessionName: "Learner",
  });
  envelope.modes.forward = mode;
  envelope.updatedAt = mode.updatedAt;
  return envelope;
}

describe("built-in session deduplication", () => {
  it("collapses a legacy Latin session named Learner into the permanent Learner session", () => {
    const sessions = managedSessionsForLanguage({ "henle-part1-forms": legacyLearnerEnvelope() }, "Latin");
    const learners = sessions.filter((session) => displayManagedSessionName(session) === "Learner");

    expect(learners).toHaveLength(1);
    expect(learners[0]).toMatchObject({ id: builtinSessionId("Latin", "learner"), builtin: true, reviews: 1 });
    expect(learners[0].reviewIds).toContain("legacy-learner-review");
  });
});
