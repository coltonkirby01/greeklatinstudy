import { describe, expect, it } from "vitest";
import { studyEnterShortcut, studyShortcut } from "../src/features/study/study-shortcuts";

const context = { startGateOpen: false, revealed: false, result: null, difficulty: null, typingTarget: false, controlsTarget: false } as const;

describe("study keyboard shortcuts", () => {
  it("uses the first non-control key only to start when the gate is open", () => {
    expect(studyShortcut({ ...context, key: " ", startGateOpen: true })).toEqual({ type: "start" });
    expect(studyShortcut({ ...context, key: "r", startGateOpen: true, revealed: true })).toEqual({ type: "start" });
    expect(studyShortcut({ ...context, key: "f", startGateOpen: true, revealed: true })).toEqual({ type: "start" });
  });

  it("leaves form and toolbar controls usable while the gate is open", () => {
    expect(studyShortcut({ ...context, key: "ArrowDown", startGateOpen: true, typingTarget: true })).toBeNull();
    expect(studyShortcut({ ...context, key: " ", startGateOpen: true, controlsTarget: true })).toBeNull();
    expect(studyShortcut({ ...context, key: "Enter", startGateOpen: true, controlsTarget: true })).toBeNull();
  });

  it("does not trigger study shortcuts while typing after the gate is dismissed", () => {
    expect(studyShortcut({ ...context, key: " ", typingTarget: true })).toBeNull();
    expect(studyShortcut({ ...context, key: "f", revealed: true, typingTarget: true })).toBeNull();
  });

  it("uses Space to reveal on the front and waits for a correctness grade before saving", () => {
    expect(studyShortcut({ ...context, key: " " })).toEqual({ type: "reveal" });
    expect(studyShortcut({ ...context, key: " ", revealed: true })).toBeNull();
    expect(studyShortcut({ ...context, key: " ", revealed: true, result: "right" })).toEqual({ type: "save" });
  });

  it("maps F to flip and 1/2/3 to difficulty only after reveal", () => {
    expect(studyShortcut({ ...context, key: "f" })).toBeNull();
    expect(studyShortcut({ ...context, key: "f", revealed: true })).toEqual({ type: "flip" });
    expect(studyShortcut({ ...context, key: "F", revealed: true })).toEqual({ type: "flip" });
    expect(studyShortcut({ ...context, key: "1", revealed: true })).toEqual({ type: "difficulty", value: "easy" });
    expect(studyShortcut({ ...context, key: "2", revealed: true })).toEqual({ type: "difficulty", value: "medium" });
    expect(studyShortcut({ ...context, key: "3", revealed: true })).toEqual({ type: "difficulty", value: "hard" });
  });

  it("does not use R or W as correctness shortcuts", () => {
    expect(studyShortcut({ ...context, key: "r", revealed: true })).toBeNull();
    expect(studyShortcut({ ...context, key: "R", revealed: true })).toBeNull();
    expect(studyShortcut({ ...context, key: "w", revealed: true })).toBeNull();
    expect(studyShortcut({ ...context, key: "W", revealed: true })).toBeNull();
  });

  it("uses Enter alone to toggle correctness and captures it even on focused buttons", () => {
    expect(studyShortcut({ ...context, key: "Enter", revealed: true })).toBeNull();
    expect(studyEnterShortcut({ key: "Enter", shiftKey: false, revealed: true, result: "right", typingTarget: false })).toEqual({ type: "result", value: "wrong" });
    expect(studyEnterShortcut({ key: "Enter", shiftKey: false, revealed: true, result: "wrong", typingTarget: false })).toEqual({ type: "result", value: "right" });
    expect(studyEnterShortcut({ key: "Enter", shiftKey: false, revealed: true, result: "right", typingTarget: false, controlsTarget: true })).toEqual({ type: "result", value: "wrong" });
    expect(studyEnterShortcut({ key: "Enter", shiftKey: true, revealed: true, result: "right", typingTarget: false })).toBeNull();
  });

  it("does not hijack Enter while typing", () => {
    expect(studyEnterShortcut({ key: "Enter", shiftKey: false, revealed: true, result: "right", typingTarget: true })).toBeNull();
  });

  it("saves with Space after the automatically supplied grade or manual overrides", () => {
    expect(studyShortcut({ ...context, key: " ", revealed: true, result: "right" })).toEqual({ type: "save" });
    expect(studyShortcut({ ...context, key: " ", revealed: true, result: "right", difficulty: "medium" })).toEqual({ type: "save" });
    expect(studyShortcut({ ...context, key: " ", revealed: true, result: "wrong", difficulty: "hard" })).toEqual({ type: "save" });
  });
});
