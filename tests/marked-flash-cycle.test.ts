import { describe, expect, it } from "vitest";
import { beginMarkedFlashCycle, recordMarkedFlashGrade, restartMarkedFlashCycle } from "../src/features/study/marked-flash-cycle";

describe("Ever wrong flash completion gate", () => {
  it("tracks Wrong from this pass, not historically wrong membership or Hard ratings", () => {
    let cycle = beginMarkedFlashCycle(["a", "b", "c"]);
    cycle = recordMarkedFlashGrade(cycle, "a", "right");
    cycle = recordMarkedFlashGrade(cycle, "b", "wrong");
    // Card c is skipped: it must never be treated as Wrong.
    expect(cycle.wrongKeys).toEqual(["b"]);
    expect(restartMarkedFlashCycle(cycle, "wrong")?.activeKeys).toEqual(["b"]);
    expect(restartMarkedFlashCycle(cycle, "all")?.activeKeys).toEqual(["a", "b", "c"]);
  });

  it("repeats only newly missed cards and can narrow again to a single card", () => {
    let first = beginMarkedFlashCycle(["a", "b", "c"]);
    first = recordMarkedFlashGrade(first, "a", "wrong");
    first = recordMarkedFlashGrade(first, "b", "wrong");
    first = recordMarkedFlashGrade(first, "c", "right");
    let focused = restartMarkedFlashCycle(first, "wrong")!;
    expect(focused.activeKeys).toEqual(["a", "b"]);
    expect(focused.wrongKeys).toEqual([]);
    focused = recordMarkedFlashGrade(focused, "a", "right");
    focused = recordMarkedFlashGrade(focused, "b", "wrong");
    const next = restartMarkedFlashCycle(focused, "wrong")!;
    expect(next.activeKeys).toEqual(["b"]);
    expect(restartMarkedFlashCycle(next, "all")?.activeKeys).toEqual(["a", "b", "c"]);
  });

  it("disables an empty wrong-only repeat, including when every card was skipped", () => {
    expect(restartMarkedFlashCycle(beginMarkedFlashCycle(["a", "b"]), "wrong")).toBeNull();
    let cycle = beginMarkedFlashCycle(["a"]);
    cycle = recordMarkedFlashGrade(cycle, "a", "right");
    expect(restartMarkedFlashCycle(cycle, "wrong")).toBeNull();
  });

  it("removes wrong answers after Back and correctly applies a changed grade", () => {
    let cycle = beginMarkedFlashCycle(["a", "b"]);
    cycle = recordMarkedFlashGrade(cycle, "a", "wrong");
    cycle = recordMarkedFlashGrade(cycle, "a", null);
    expect(cycle.wrongKeys).toEqual([]);
    cycle = recordMarkedFlashGrade(cycle, "a", "right");
    expect(restartMarkedFlashCycle(cycle, "wrong")).toBeNull();
    cycle = recordMarkedFlashGrade(cycle, "a", "wrong");
    expect(cycle.wrongKeys).toEqual(["a"]);
    cycle = recordMarkedFlashGrade(cycle, "a", "wrong");
    expect(cycle.wrongKeys).toEqual(["a"]);
    expect(recordMarkedFlashGrade(cycle, "outside", "wrong")).toBe(cycle);
  });

  it("deduplicates card keys and ignores non-original cards", () => {
    const cycle = beginMarkedFlashCycle(["a", "a", "b"], ["b", "b", "c"]);
    expect(cycle.originalKeys).toEqual(["a", "b"]);
    expect(cycle.activeKeys).toEqual(["b"]);
    expect(restartMarkedFlashCycle(cycle, "all")?.activeKeys).toEqual(["a", "b"]);
  });
});
