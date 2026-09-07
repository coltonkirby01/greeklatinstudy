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
 * Plain Enter toggles Right/Wrong; Shift+Enter flips the revealed card face.
 */
export function studyEnterShortcut({ key, shiftKey, revealed, result, typingTarget, controlsTarget = false }: EnterShortcutContext): StudyShortcut {
  if (key !== "Enter" || !revealed || typingTarget || controlsTarget) return null;
  if (shiftKey) return { type: "flip" };
  return { type: "result", value: result === "wrong" ? "right" : "wrong" };
}

export function studyShortcut({ key, startGateOpen, revealed, result, typingTarget, controlsTarget = false }: ShortcutContext): StudyShortcut {
  // Toolbar/select controls keep their normal keyboard behavior while the timer gate is open.
  if (typingTarget || controlsTarget) return null;
  // Outside those controls, the gate owns the first keypress. It must never leak through.
  if (startGateOpen) return { type: "start" };
  if (key === " " && !revealed) return { type: "reveal" };
  if (!revealed) return null;

  const normalized = key.toLowerCase();
  if (normalized === "r") return { type: "result", value: "right" };
  if (normalized === "w") return { type: "result", value: "wrong" };
  if (key === "1") return { type: "difficulty", value: "easy" };
  if (key === "2") return { type: "difficulty", value: "medium" };
  if (key === "3") return { type: "difficulty", value: "hard" };
  // Enter/Shift+Enter are handled by studyEnterShortcut in StudyRatingControls.
  if (key === " " && result) return { type: "save" };
  return null;
}