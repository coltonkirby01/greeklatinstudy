import { describe, expect, it } from "vitest";
import { loadCardExclusions, saveCardExclusions } from "../src/features/study/card-exclusions";
import { savedCardRef } from "../src/features/study/saved-cards";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

describe("per-card study exclusions", () => {
  it("persists exclusions independently for Greek and Latin", () => {
    const storage = memoryStorage();
    const greekRef = savedCardRef("greek-deck", "g-1");
    const latinRef = savedCardRef("latin-deck", "l-1");

    saveCardExclusions("greek", new Set([greekRef]), storage);
    saveCardExclusions("latin", new Set([latinRef]), storage);

    expect([...loadCardExclusions("greek", storage)]).toEqual([greekRef]);
    expect([...loadCardExclusions("latin", storage)]).toEqual([latinRef]);
  });

  it("falls back safely when stored data is missing or malformed", () => {
    const storage = memoryStorage();
    expect(loadCardExclusions("greek", storage).size).toBe(0);
    storage.setItem("greeklatinstudy:greek:card-exclusions:v1", "not-json");
    expect(loadCardExclusions("greek", storage).size).toBe(0);
  });
});
