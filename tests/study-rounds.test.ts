import { describe, expect, it } from "vitest";
import { beginStudyRound, markStudyRoundCard, nextSequentialStudyRoundKey, reconcileStudyRound, remainingStudyRoundKeys, studyRoundComplete, studyRoundSubset, undoStudyRoundCard } from "../src/features/study/study-rounds";

describe("in-page Sequential review rounds", () => {
  const rightEasy = { result: "right", difficulty: "easy" } as const;
  const wrongEasy = { result: "wrong", difficulty: "easy" } as const;
  const rightMedium = { result: "right", difficulty: "medium" } as const;
  const rightHard = { result: "right", difficulty: "hard" } as const;

  it("gates only after every chosen card is handled once, in any order", () => {
    let round = beginStudyRound("original", ["a", "b", "c"]);
    expect(studyRoundComplete(round)).toBe(false);
    round = markStudyRoundCard(round, "c", rightHard);
    round = markStudyRoundCard(round, "a", wrongEasy);
    expect(studyRoundComplete(round)).toBe(false);
    expect(remainingStudyRoundKeys(round)).toEqual(["b"]);
    round = markStudyRoundCard(round, "b", rightEasy);
    expect(studyRoundComplete(round)).toBe(true);
    expect(studyRoundSubset(round, "needs")).toEqual(["a", "c"]);
    expect(studyRoundSubset(round, "hard")).toEqual(["a", "c"]);
  });

  it("first review includes wrong OR medium OR hard; second includes wrong OR hard only", () => {
    let round = beginStudyRound("original", ["easy", "medium", "hard", "wrong"]);
    round = markStudyRoundCard(round, "easy", rightEasy);
    round = markStudyRoundCard(round, "medium", rightMedium);
    round = markStudyRoundCard(round, "hard", rightHard);
    round = markStudyRoundCard(round, "wrong", wrongEasy);
    expect(studyRoundSubset(round, "needs")).toEqual(["medium", "hard", "wrong"]);
    let followup = beginStudyRound("needs", studyRoundSubset(round, "needs"));
    followup = markStudyRoundCard(followup, "medium", rightMedium);
    followup = markStudyRoundCard(followup, "hard", rightEasy);
    followup = markStudyRoundCard(followup, "wrong", wrongEasy);
    expect(studyRoundComplete(followup)).toBe(true);
    expect(studyRoundSubset(followup, "hard")).toEqual(["wrong"]);
    expect(beginStudyRound("hard", studyRoundSubset(followup, "hard")).keys).toEqual(["wrong"]);
  });

  it("keeps completed cards from resurfacing until the completion gate, including skipped cards", () => {
    let round = beginStudyRound("original", ["a", "b", "c"]);
    round = markStudyRoundCard(round, "a"); // Skip does not write a grade
    expect(studyRoundSubset(round, "needs")).toEqual([]);
    expect(nextSequentialStudyRoundKey(round, "a")).toBe("b");
    round = markStudyRoundCard(round, "b", rightEasy);
    expect(nextSequentialStudyRoundKey(round, "b")).toBe("c");
    round = markStudyRoundCard(round, "c", rightEasy);
    expect(nextSequentialStudyRoundKey(round, "c")).toBeNull();
    expect(studyRoundComplete(round)).toBe(true);
  });

  it("repeating the final wrong/hard pass starts a fresh traversal of the same cards", () => {
    const final = markStudyRoundCard(beginStudyRound("hard", ["a", "b"]), "a", rightEasy);
    const repeat = beginStudyRound("hard", final.keys);
    expect(repeat.keys).toEqual(["a", "b"]);
    expect(repeat.covered).toEqual([]);
    expect(studyRoundComplete(repeat)).toBe(false);
  });

  it("correcting a saved review removes the original outcome before applying the replacement", () => {
    const round = markStudyRoundCard(beginStudyRound("original", ["a", "b"]), "a", wrongEasy);
    const undone = undoStudyRoundCard(round, "a");
    expect(undone.covered).toEqual([]);
    expect(studyRoundSubset(undone, "needs")).toEqual([]);
    expect(studyRoundSubset(markStudyRoundCard(undone, "a", rightEasy), "needs")).toEqual([]);
  });

  it("reconciles selection without forgetting the reviewed cards still in the pool", () => {
    const round = markStudyRoundCard(beginStudyRound("original", ["a", "b"]), "a", wrongEasy);
    const reconciled = reconcileStudyRound(round, ["a", "c"]);
    expect(reconciled.keys).toEqual(["a", "c"]);
    expect(reconciled.covered).toEqual(["a"]);
    expect(remainingStudyRoundKeys(reconciled)).toEqual(["c"]);
  });
});
