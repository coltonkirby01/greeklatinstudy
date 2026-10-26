import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("Dickinson published frequency rank badge", () => {
  const page = fs.readFileSync("src/pages/latin-page.tsx", "utf8");

  it("renders a compact #rank on both question and answer sides", () => {
    expect(page.match(/className="dickinson-rank-badge" aria-label=/g)).toHaveLength(2);
    expect(page.match(/>\#\{card.rank\}<\/span>/g)).toHaveLength(2);
    expect(page).toContain("Dickinson frequency rank");
    expect(page).toContain(".flashcard-face .dickinson-rank-badge");
  });

  it("uses the published rank only on Dickinson vocabulary, in both directions", () => {
    expect(page.match(/source.deck.id === vocabularyDeck.id && Number.isInteger\(card.rank\)/g)).toHaveLength(2);
    expect(page).toContain('source.direction === "forward" ? "latin-front" : "study-prompt reverse-text-prompt"');
    expect(page).toContain('source.direction === "reverse" ? "latin-front compact-latin" : "study-answer"');
  });
});
