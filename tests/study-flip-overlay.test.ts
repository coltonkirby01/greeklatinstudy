import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("Greek and Latin Flip card action", () => {
  const ui = fs.readFileSync("src/features/study/study-session-ui.tsx", "utf8");
  const multi = fs.readFileSync("src/features/study/multi-source-study-session.tsx", "utf8");
  const standard = fs.readFileSync("src/features/study/study-session.tsx", "utf8");

  it("places a Save-card-style Flip button inside the lower-left of both card faces", () => {
    expect(ui).toContain(".flashcard-flip-control{position:absolute;left:.7rem;bottom:.7rem;z-index:13");
    expect(ui).toContain(".flashcard-flip-control{left:.45rem;bottom:.45rem}");
    expect(ui).toContain('{revealed && <div className="flashcard-flip-control">');
    expect(ui).toContain('className="small-outline-button card-overlay-button flip-card-button"');
    expect(ui).toContain('data-study-control="flip-card" onClick={onFlip}');
    expect(ui).toContain('Flip card <kbd>F</kbd>');
    expect(ui).toContain('aria-label={showingAnswer ? "Flip to question" : "Flip to answer"}');
  });

  it("removes the old Flip button below the flashcard without changing grading", () => {
    const controls = ui.split("export function StudyRatingControls")[1].split("function MarkedFlashTile")[0];
    expect(controls).not.toContain("Flip question / answer");
    expect(controls).not.toContain("onFlip");
    expect(controls).toContain("Right");
    expect(controls).toContain("Wrong");
    expect(controls).toContain("Save & Next");
    expect(multi).toContain('onFlip={toggleReviewFace} front={front}');
    expect(standard).toContain('onFlip={toggleReviewFace} front={front}');
    expect(multi).not.toContain('onReveal={reveal} onFlip={toggleReviewFace} onResult={setResult}');
    expect(standard).not.toContain('onReveal={reveal} onFlip={toggleReviewFace} onResult={setResult}');
  });

  it("keeps F shortcut and native Enter activation of the focused Flip button", () => {
    expect(ui).toContain('target?.closest(\'[data-study-control="flip-card"]\')');
    expect(multi).toContain('shortcut.type === "flip"');
    expect(standard).toContain('shortcut.type === "flip"');
  });
});
