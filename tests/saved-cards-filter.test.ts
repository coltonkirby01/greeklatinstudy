import { describe, expect, it } from "vitest";
import { savedCardRef, parseSavedCardRef } from "../src/features/study/saved-cards";
import { togglePendingSavedCardRemoval } from "../src/features/study/saved-cards-filter";

describe("Saved Cards menu removal", () => {
  it("round-trips the stable deck/card reference used for a deferred removal", () => {
    const ref = savedCardRef("alpha-omega-lesson10-vocab", "lesson10-v4");
    expect(parseSavedCardRef(ref)).toEqual({ deckId: "alpha-omega-lesson10-vocab", cardId: "lesson10-v4" });
  });

  it("keeps a deselected saved card pending until the user reselects it or closes the menu", () => {
    const ref = savedCardRef("dickinson-latin-core", "amo");
    const pending = togglePendingSavedCardRemoval(new Set(), ref);
    expect([...pending]).toEqual([ref]);

    const reselected = togglePendingSavedCardRemoval(pending, ref);
    expect([...reselected]).toEqual([]);
  });
});
