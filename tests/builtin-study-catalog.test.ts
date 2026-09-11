import { describe, expect, it } from "vitest";
import { BUILTIN_STUDY_DECKS, builtinSessionDeckIds, statsSourcesForBuiltinDeck, type BuiltinDeckRegistration } from "../src/features/study/builtin-study-catalog";
import type { DeckDefinition } from "../src/features/study/types";

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

  it("expands every Stats mode with the deck's complete current card array", () => {
    const cards = [
      { id: "weekly-1", front: "one", back: "uno" },
      { id: "weekly-2", front: "two", back: "duo" },
      { id: "weekly-3", front: "three", back: "tres" },
    ];
    const deck = { id: "weekly-deck", slug: "weekly-deck", title: "Weekly", language: "latin", cards } as DeckDefinition;
    const registration: BuiltinDeckRegistration = {
      id: deck.id,
      language: "Latin",
      source: "Weekly",
      load: async () => deck,
      modes: [
        { mode: "Forward", direction: "forward", studyKey: "forward" },
        { mode: "Reverse", direction: "reverse", studyKey: "reverse" },
      ],
    };

    const sources = statsSourcesForBuiltinDeck(registration, deck);
    expect(sources).toHaveLength(2);
    for (const source of sources) {
      expect(source.cards).toBe(deck.cards);
      expect(source.cards.map((card) => card.id)).toEqual(["weekly-1", "weekly-2", "weekly-3"]);
    }
  });
});
