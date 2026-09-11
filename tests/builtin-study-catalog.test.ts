import { describe, expect, it } from "vitest";
import { BUILTIN_STUDY_DECKS, builtinSessionDeckIds } from "../src/features/study/builtin-study-catalog";

describe("built-in study catalog", () => {
  it("has unique active deck ids and drives session coverage", () => {
    const ids = BUILTIN_STUDY_DECKS.map((deck) => deck.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const language of ["Greek", "Latin"] as const) {
      const active = BUILTIN_STUDY_DECKS.filter((deck) => deck.language === language).map((deck) => deck.id);
      expect(builtinSessionDeckIds(language)).toEqual(expect.arrayContaining(active));
    }
  });

  it("registers every active deck with at least one Stats mode and no duplicate study key", () => {
    for (const deck of BUILTIN_STUDY_DECKS) {
      expect(deck.modes.length).toBeGreaterThan(0);
      expect(new Set(deck.modes.map((mode) => mode.studyKey)).size).toBe(deck.modes.length);
    }
  });
});
