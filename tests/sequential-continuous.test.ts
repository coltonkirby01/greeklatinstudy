import { describe, expect, it } from "vitest";
import { nextSequentialIndex } from "../src/features/study/engine";

describe("continuous Sequential Greek/Latin card traversal", () => {
  it("visits the selected cards in defined order then wraps with no completion step", () => {
    const cards = ["a", "b", "c", "d"];
    let index = -1;
    const seen: string[] = [];
    for (let visit = 0; visit < cards.length * 3; visit += 1) {
      index = nextSequentialIndex(cards.length, index);
      seen.push(cards[index]);
    }
    expect(seen).toEqual([...cards, ...cards, ...cards]);
  });

  it("wraps when only one card is selected and never asks for a new round", () => {
    let index = nextSequentialIndex(1, -1);
    for (let i = 0; i < 5; i += 1) {
      expect(index).toBe(0);
      index = nextSequentialIndex(1, index);
    }
    expect(nextSequentialIndex(0, -1)).toBe(-1);
  });

  it("follows the current selected pool after cards are added or removed", () => {
    const before = ["a", "b", "c"];
    let index = nextSequentialIndex(before.length, before.indexOf("b"));
    expect(before[index]).toBe("c");
    const after = ["a", "c", "d"];
    index = nextSequentialIndex(after.length, after.indexOf("c"));
    expect(after[index]).toBe("d");
    index = nextSequentialIndex(after.length, index);
    expect(after[index]).toBe("a");
  });
});
