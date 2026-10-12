import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("flashcard answer layout", () => {
  it("keeps the no-scroll override in the JS-rendered style path", () => {
    const main = fs.readFileSync("src/main.tsx", "utf8");
    expect(main).toContain("const flashcardNoScrollCss");
    expect(main).toContain("<style>{flashcardNoScrollCss}</style>");
  });

  it("lets every study-card face grow with its content instead of scrolling internally", () => {
    const main = fs.readFileSync("src/main.tsx", "utf8");
    expect(main).toContain(".study-panel .flashcard-inner{display:grid;height:auto}");
    expect(main).toContain(".study-panel .flashcard-face{position:relative;inset:auto;grid-area:1/1;height:auto;overflow:visible}");
    expect(main).toContain(".study-panel .flashcard-face:has(.chart-scroll){overflow:visible}");
    expect(main).toContain(".study-panel .flashcard-face[aria-hidden=true]{pointer-events:none}");
  });
});
