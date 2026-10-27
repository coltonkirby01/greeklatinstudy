import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("Dickinson published frequency rank badge", () => {
  const page = fs.readFileSync("src/pages/latin-page.tsx", "utf8");
  const front = page.split('renderFront={(card, copy, source) => {')[1].split('renderBack={(card, copy, source) => {')[0];
  const back = page.split('renderBack={(card, copy, source) => {')[1];

  it("shows the published #rank on the answer face only", () => {
    expect(front).not.toContain("dickinson-rank-badge");
    expect(front).not.toContain("Dickinson frequency rank");
    expect(back.match(/className="dickinson-rank-badge" aria-label=/g)).toHaveLength(1);
    expect(back).toContain(">#{card.rank}</span>");
    expect(page.match(/className="dickinson-rank-badge" aria-label=/g)).toHaveLength(1);
    expect(page).toContain(".flashcard-face .dickinson-rank-badge");
  });

  it("restricts the rank badge to Dickinson and preserves Forward/Reverse card text", () => {
    expect(back).toContain("source.deck.id === vocabularyDeck.id && Number.isInteger(card.rank)");
    expect(front).toContain('source.direction === "forward" ? "latin-front" : "study-prompt reverse-text-prompt"');
    expect(back).toContain('source.direction === "reverse" ? "latin-front compact-latin" : "study-answer"');
  });
});
