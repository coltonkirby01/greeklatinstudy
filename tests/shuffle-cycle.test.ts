import { describe, expect, it } from "vitest";
import { emptyShuffleCycle, nextShuffleKey, shuffledCycleOrder } from "../src/features/study/shuffle-cycle";

describe("shuffle study order", () => {
  it("visits every selected card exactly once before starting a new cycle", () => {
    const keys = ["a", "b", "c", "d"];
    let state = emptyShuffleCycle();
    const firstCycle: string[] = [];

    for (let index = 0; index < keys.length; index += 1) {
      const next = nextShuffleKey(keys, state, { random: () => 0.42 });
      state = next.state;
      expect(next.key).not.toBeNull();
      firstCycle.push(next.key!);
    }

    expect(new Set(firstCycle)).toEqual(new Set(keys));
    expect(firstCycle).toHaveLength(keys.length);
  });

  it("forces a fresh pattern when the random source would repeat the prior cycle", () => {
    const keys = ["a", "b", "c", "d"];
    const first = shuffledCycleOrder(keys, [], undefined, () => 0.25);
    const second = shuffledCycleOrder(keys, first, undefined, () => 0.25);

    expect(second).not.toEqual(first);
    expect(new Set(second)).toEqual(new Set(keys));
  });

  it("avoids immediately repeating the card that just finished at a cycle boundary", () => {
    const keys = ["a", "b", "c"];
    const order = shuffledCycleOrder(keys, [], "a", () => 0);
    expect(order[0]).not.toBe("a");
    expect(new Set(order)).toEqual(new Set(keys));
  });
});
