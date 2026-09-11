import { describe, expect, it } from "vitest";
import { BUILTIN_STUDY_DECKS, builtinSessionDeckIds, loadBuiltinStatsSources } from "../src/features/study/builtin-study-catalog";

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

  it("loads every registered deck with its complete current card set for Stats", async () => {
    const statsSources = await loadBuiltinStatsSources();
    for (const registration of BUILTIN_STUDY_DECKS) {
      const deck = await registration.load();
      const expectedCardIds = deck.cards.map((card) => card.id);
      expect(deck.id).toBe(registration.id);
      expect(expectedCardIds.length).toBeGreaterThan(0);
      expect(new Set(expectedCardIds).size).toBe(expectedCardIds.length);

      const sources = statsSources.filter((source) => source.deck.id === registration.id);
      expect(sources).toHaveLength(registration.modes.length);
      for (const source of sources) {
        expect(source.cards.map((card) => card.id)).toEqual(expectedCardIds);
      }
    }
  });
});
