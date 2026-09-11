import { describe, expect, it } from "vitest";
import { createEnvelope } from "../src/features/study/engine";
import { mergeProgressEnvelopes } from "../src/features/study/progress-repository";
import { savedCardRef } from "../src/features/study/saved-cards";

describe("saved cards", () => {
  it("uses deck and card identity so cards from different sources cannot collide", () => {
    expect(savedCardRef("greek-foundation", "one")).not.toBe(savedCardRef("latin-dickinson", "one"));
  });

  it("uses the newer saved-card collection during local/cloud merge", () => {
    const local = createEnvelope("user-saved-cards-greek:test", 1);
    local.savedCardRefs = [savedCardRef("greek-foundation", "alpha")];
    local.savedCardsUpdatedAt = 20;
    local.updatedAt = 20;

    const remote = createEnvelope("user-saved-cards-greek:test", 1);
    remote.savedCardRefs = [savedCardRef("greek-foundation", "beta")];
    remote.savedCardsUpdatedAt = 10;
    remote.updatedAt = 30;

    const merged = mergeProgressEnvelopes(local, remote)!;
    expect(merged.savedCardRefs).toEqual(local.savedCardRefs);
    expect(merged.savedCardsUpdatedAt).toBe(20);
    expect(merged.updatedAt).toBe(30);
  });

  it("allows a newer empty collection to clear saved cards", () => {
    const local = createEnvelope("user-saved-cards-latin:test", 1);
    local.savedCardRefs = [];
    local.savedCardsUpdatedAt = 30;
    local.updatedAt = 30;

    const remote = createEnvelope("user-saved-cards-latin:test", 1);
    remote.savedCardRefs = [savedCardRef("latin-dickinson", "amo")];
    remote.savedCardsUpdatedAt = 20;
    remote.updatedAt = 20;

    const merged = mergeProgressEnvelopes(local, remote)!;
    expect(merged.savedCardRefs).toEqual([]);
    expect(merged.savedCardsUpdatedAt).toBe(30);
  });
});
