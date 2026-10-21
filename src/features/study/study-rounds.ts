import type { ReviewDifficulty, ReviewResult } from "./types";

export type StudyRoundKind = "original" | "needs" | "hard";
export type StudyRoundGrade = { result: ReviewResult; difficulty: ReviewDifficulty };
export type StudyRound = {
  kind: StudyRoundKind;
  keys: string[];
  covered: string[];
  grades: Record<string, StudyRoundGrade>;
};

/** These rounds are ephemeral page-study passes, never persistent Stats sessions. */
export function beginStudyRound(kind: StudyRoundKind, keys: readonly string[]): StudyRound {
  return { kind, keys: [...new Set(keys)], covered: [], grades: {} };
}

export function markStudyRoundCard(round: StudyRound, key: string, grade?: StudyRoundGrade): StudyRound {
  if (!round.keys.includes(key)) return round;
  return {
    ...round,
    covered: round.covered.includes(key) ? round.covered : [...round.covered, key],
    grades: grade ? { ...round.grades, [key]: grade } : round.grades,
  };
}

/** Back reopens a saved card within the same pass so its corrected grade counts once. */
export function undoStudyRoundCard(round: StudyRound, key: string): StudyRound {
  if (!round.covered.includes(key)) return round;
  const grades = { ...round.grades };
  delete grades[key];
  return { ...round, covered: round.covered.filter((item) => item !== key), grades };
}

/** Keep covered cards while removing deselections or adding newly selected cards. */
export function reconcileStudyRound(round: StudyRound, selected: readonly string[]): StudyRound {
  const keys = [...new Set(selected)];
  const allowed = new Set(keys);
  return { ...round, keys, covered: round.covered.filter((key) => allowed.has(key)),
    grades: Object.fromEntries(Object.entries(round.grades).filter(([key]) => allowed.has(key))) };
}

export function remainingStudyRoundKeys(round: StudyRound) {
  const covered = new Set(round.covered);
  return round.keys.filter((key) => !covered.has(key));
}

export function studyRoundComplete(round: StudyRound) {
  return round.keys.length > 0 && remainingStudyRoundKeys(round).length === 0;
}

export function nextSequentialStudyRoundKey(round: StudyRound, afterKey: string): string | null {
  const remaining = new Set(remainingStudyRoundKeys(round));
  const start = round.keys.indexOf(afterKey);
  for (let offset = 1; offset <= round.keys.length; offset += 1) {
    const key = round.keys[(start + offset) % round.keys.length];
    if (remaining.has(key)) return key;
  }
  return null;
}

export function studyRoundSubset(round: StudyRound, kind: "needs" | "hard"): string[] {
  return round.keys.filter((key) => {
    const grade = round.grades[key];
    return Boolean(grade && (grade.result === "wrong" || grade.difficulty === "hard" || (kind === "needs" && grade.difficulty === "medium")));
  });
}
