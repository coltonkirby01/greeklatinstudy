import type { ReviewDifficulty, ReviewResult } from "./types";

export type StudyShortcut =
  | { type: "start" }
  | { type: "reveal" }
  | { type: "flip" }
  | { type: "result"; value: ReviewResult }
  | { type: "difficulty"; value: ReviewDifficulty }
  | { type: "save" }
  | null;

type ShortcutContext = {
  key: string;
  startGateOpen: boolean;
  revealed: boolean;
  result: ReviewResult | null;
  difficulty: ReviewDifficulty | null;
  typingTarget: boolean;
  controlsTarget?: boolean;
};

type EnterShortcutContext = {
  key: string;
  shiftKey: boolean;
  revealed: boolean;
  result: ReviewResult | null;
  typingTarget: boolean;
  controlsTarget?: boolean;
};

/**
 * Enter is intentionally handled by the shared rating controls so the same
 * behavior applies to every study controller without duplicating key logic.
 * Plain Enter is the only keyboard shortcut that changes Right/Wrong. Once an
 * answer is revealed it is captured before focused buttons can consume Enter,
 * so Enter cannot replay audio or trigger another control. F flips the card.
 */
export function studyEnterShortcut({ key, shiftKey, revealed, result, typingTarget }: EnterShortcutContext): StudyShortcut {
  if (key !== "Enter" || shiftKey || !revealed || typingTarget) return null;
  return { type: "result", value: result === "wrong" ? "right" : "wrong" };
}

export function studyShortcut({ key, startGateOpen, revealed, typingTarget, controlsTarget = false }: ShortcutContext): StudyShortcut {
  const isSpace = key === " " || key === "Spacebar";

  // Genuine text-entry fields keep normal typing behavior. Toolbar selects are
  // also classified as typing targets by the controllers, but Space must still
  // belong to the flashcard session after Adaptive/Sequential or Learner/Reviewer
  // has been clicked. controlsTarget distinguishes those toolbar controls.
  if (typingTarget && !(isSpace && controlsTarget)) return null;

  // Space is always owned by the flashcard session, even if a toolbar button,
  // select, timer control, rating control, or other non-text control has focus.
  // Returning an action ensures the shared keydown handler calls preventDefault(),
  // so the browser cannot re-activate the last focused control with Space.
  if (isSpace) {
    if (startGateOpen) return { type: "start" };
    if (!revealed) return { type: "reveal" };
    return { type: "save" };
  }

  // While the start gate is open, no other key may dismiss it. The user must
  // click the on-screen Start control or press Space.
  if (startGateOpen) return null;

  // Non-Space shortcuts do not override toolbar/start-card controls.
  if (controlsTarget) return null;
  if (!revealed) return null;

  const normalized = key.toLowerCase();
  if (normalized === "f") return { type: "flip" };
  if (key === "1") return { type: "difficulty", value: "easy" };
  if (key === "2") return { type: "difficulty", value: "medium" };
  if (key === "3") return { type: "difficulty", value: "hard" };
  // Plain Enter is handled by studyEnterShortcut in StudyRatingControls.
  return null;
}
