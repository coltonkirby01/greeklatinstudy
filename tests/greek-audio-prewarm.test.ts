import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("published Greek deck audio prewarming", () => {
  const service = fs.readFileSync("src/features/decks/deck-service.ts", "utf8");

  it("generates shared audio when a Greek deck is published", () => {
    expect(service).toContain('if (changes.published === true) await prewarmDeckIfPublishedGreek(deck);');
    expect(service).toContain('api.functions.invoke("course-audio", { body: { cloudCardId } })');
    expect(service).toContain('deck.language !== "greek" || !deck.published');
  });

  it("warms imported and individually edited cards for already-published Greek decks", () => {
    expect(service).toContain('await prewarmDeckIfPublishedGreek(deck, loaded);');
    expect(service).toContain('await prewarmDeckIfPublishedGreek(deck, [saved]);');
  });
});
