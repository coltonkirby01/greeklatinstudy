import { describe, expect, it } from "vitest";
import { emptyShuffleCycle, nextShuffleKey, reconcileShuffleCycle, shuffledCycleOrder } from "../src/features/study/shuffle-cycle";

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

  it("moves directly into another full cycle, without a completion-gate reset", () => {
    const keys = ["a", "b", "c", "d", "e"];
    let state = emptyShuffleCycle();
    const visits: string[] = [];
    for (let i = 0; i < keys.length * 3; i += 1) {
      const next = nextShuffleKey(keys, state, { avoidKey: visits.at(-1), random: () => 0.31 });
      expect(next.key).not.toBeNull();
      state = next.state;
      visits.push(next.key!);
    }
    for (let i = 0; i < 3; i += 1) {
      const pass = visits.slice(i * keys.length, (i + 1) * keys.length);
      expect(new Set(pass)).toEqual(new Set(keys));
      expect(pass).toHaveLength(keys.length);
    }
    for (let i = 1; i < visits.length; i += 1) {
      expect(visits[i]).not.toBe(visits[i - 1]);
    }
  });

  it("restarts a fresh randomized pool when the selected set changes", () => {
    let state = emptyShuffleCycle();
    const first = nextShuffleKey(["a", "b", "c"], state, { random: () => 0 });
    state = first.state;
    const changed = nextShuffleKey(["a", "c", "d"], state, { avoidKey: first.key ?? undefined, random: () => 0 });
    expect(changed.state.signature).toBe("a|c|d");
    expect(changed.key).not.toBe(first.key);
    expect([changed.key, ...changed.state.remaining].sort()).toEqual(["a", "c", "d"]);
  });

  it("shuffles a full mixed Greek vocabulary-and-endings pool without repeats within each pass", () => {
    const keys = [
      ...Array.from({ length: 10 }, (_, i) => `lesson13-vocabulary:v${i}`),
      ...Array.from({ length: 6 }, (_, i) => `lesson13-endings:g${i}`),
      ...Array.from({ length: 9 }, (_, i) => `new-testament-vocabulary:k${i}`),
    ];
    let state = emptyShuffleCycle();
    const visits: string[] = [];
    for (let i = 0; i < keys.length * 4; i += 1) {
      const next = nextShuffleKey(keys, state, { avoidKey: visits.at(-1), random: () => (i % 7) / 7 });
      state = next.state;
      visits.push(next.key!);
    }
    for (let cycle = 0; cycle < 4; cycle += 1) {
      const pass = visits.slice(cycle * keys.length, (cycle + 1) * keys.length);
      expect(new Set(pass)).toEqual(new Set(keys));
      expect(pass).toHaveLength(keys.length);
    }
    for (let i = 1; i < visits.length; i += 1) expect(visits[i]).not.toBe(visits[i - 1]);
  });

  it("keeps an unchanged cycle, but counts the Greek card on screen as visited after filter changes", () => {
    const keys = ["lesson3-vocabulary:a", "lesson3-vocabulary:b", "lesson4-vocabulary:c", "lesson4-vocabulary:d"];
    const first = nextShuffleKey(keys, emptyShuffleCycle(), { random: () => 0.12 });
    expect(reconcileShuffleCycle(keys, first.state, first.key!, () => 0.6)).toEqual(first.state);
    const changedKeys = [...keys, "new-testament-vocabulary:e"];
    const rebuilt = reconcileShuffleCycle(changedKeys, first.state, first.key!, () => 0.27);
    expect(rebuilt.remaining).toHaveLength(changedKeys.length - 1);
    expect(rebuilt.remaining).not.toContain(first.key);
    expect(new Set([first.key!, ...rebuilt.remaining])).toEqual(new Set(changedKeys));
    let state = rebuilt;
    const visits: string[] = [];
    for (let i = 0; i < changedKeys.length - 1; i += 1) {
      const next = nextShuffleKey(changedKeys, state, { avoidKey: visits.at(-1) ?? first.key!, random: () => 0.4 });
      state = next.state;
      visits.push(next.key!);
    }
    expect(visits).not.toContain(first.key);
    expect(new Set([first.key!, ...visits])).toEqual(new Set(changedKeys));
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
