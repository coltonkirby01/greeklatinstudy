import fs from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadLatinDeck } from "../src/data/builtin-decks";
import { cardsAvailableToState, createModeState, pickNextCard, studyStats } from "../src/features/study/engine";

afterEach(() => vi.unstubAllGlobals());

describe("Dickinson has no vocabulary locks", () => {
  it("loads every published card with no staged restriction", async () => {
    const csv = fs.readFileSync("public/data/dickinson-latin-core.csv", "utf8");
    vi.stubGlobal("fetch", async () => ({ ok: true, text: async () => csv }));
    const deck = await loadLatinDeck();
    expect(deck.id).toBe("dickinson-latin-core");
    expect(deck.cards).toHaveLength(997);
    expect(deck.staged).toBeUndefined();
  });

  it("ignores an old saved 100-card unlock limit when the deck no longer has stages", async () => {
    const csv = fs.readFileSync("public/data/dickinson-latin-core.csv", "utf8");
    vi.stubGlobal("fetch", async () => ({ ok: true, text: async () => csv }));
    const deck = await loadLatinDeck();
    const oldStage = { initialCount: 100, batchSize: 25 };
    const historicState = createModeState(deck.id, "forward", deck.cards.length, oldStage);
    expect(historicState.unlockedCount).toBe(100);
    const selected = deck.cards.slice(0, 150);
    expect(cardsAvailableToState(selected, historicState, deck.staged)).toHaveLength(150);
    expect(studyStats(selected, historicState, deck.staged).available).toBe(150);
    expect(pickNextCard([deck.cards[149]], historicState, "sequential", { staged: deck.staged })?.id).toBe(deck.cards[149].id);
    // The original legacy data remains untouched.
    expect(historicState.unlockedCount).toBe(100);
    expect(historicState.totalReviews).toBe(0);
    expect(historicState.cards).toEqual({});
  });

  it("preserves opt-in staging for other explicitly staged decks", async () => {
    const csv = fs.readFileSync("public/data/dickinson-latin-core.csv", "utf8");
    vi.stubGlobal("fetch", async () => ({ ok: true, text: async () => csv }));
    const deck = await loadLatinDeck();
    const stage = { initialCount: 100, batchSize: 25 };
    const state = createModeState(deck.id, "forward", deck.cards.length, stage);
    expect(cardsAvailableToState(deck.cards, state, stage)).toHaveLength(100);
    expect(studyStats(deck.cards, state, stage).available).toBe(100);
    expect(cardsAvailableToState(deck.cards, state)).toHaveLength(997);
  });
});
