import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("flashcard answer layout", () => {
  it("loads the shared no-scroll layout after the base styles", () => {
    const main = fs.readFileSync("src/main.tsx", "utf8");
    expect(main.indexOf('import "./styles.css";')).toBeGreaterThanOrEqual(0);
    expect(main.indexOf('import "./flashcard-no-scroll.css";')).toBeGreaterThan(main.indexOf('import "./styles.css";'));
  });

  it("lets every study-card face grow with its content instead of scrolling internally", () => {
    const css = fs.readFileSync("src/flashcard-no-scroll.css", "utf8");
    expect(css).toContain(".study-panel .flashcard-inner");
    expect(css).toContain("display: grid");
    expect(css).toContain("height: auto");
    expect(css).toContain(".study-panel .flashcard-face");
    expect(css).toContain("position: relative");
    expect(css).toContain("grid-area: 1 / 1");
    expect(css).toContain("overflow: visible");
    expect(css).toContain(".study-panel .flashcard-face:has(.chart-scroll)");
    expect(css).toContain('.study-panel .flashcard-face[aria-hidden="true"]');
  });
});
