import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("shared Greek/Latin continuous Shuffle behavior", () => {
  const controller = fs.readFileSync("src/features/study/multi-source-study-session.tsx", "utf8");

  it("disables the round/progress gate entirely in Shuffle while retaining Sequential gates", () => {
    expect(controller).toContain('roundRef.current = mode === "sequential"');
    expect(controller).toContain('if (!round || selectionMode !== "sequential") return false;');
    expect(controller).toContain('if (selectionMode !== "sequential") return;');
    expect(controller).not.toContain("roundShuffleOrderRef");
    expect(controller).not.toContain("previousRoundShuffleOrderRef");
    expect(controller).not.toContain("shuffledCycleOrder");
    expect(controller).toContain("setRoundGate(updated);");
  });

  it("uses one dedicated shuffle-cycle controller for first card and every next card", () => {
    expect(controller).toContain('const selected = chooseNext(current, next, Boolean(warmup));');
    expect(controller).toContain('nextShuffleKey([...byKey.keys()], shuffleCycleRef.current');
    expect(controller).toContain('if (advanceRound(reviewedCandidate, { result, difficulty })) return;');
    expect(controller).toContain('if (!warmup && advanceRound(previous))');
  });

  it("does not reopen Start when entering Shuffle, changing its filters, or returning to it", () => {
    expect(controller).toContain('resetUi(); setStartGateOpen(next !== "shuffle");');
    expect(controller).toContain('if (!internalSelectionChange) setStartGateOpen(selectionMode !== "shuffle");');
    expect(controller).toContain('setStartGateOpen(selectionMode !== "shuffle");');
  });

  it("still lets the user pause manually without conflating pause with a completion gate", () => {
    expect(controller).toContain('onClick={() => setStartGateOpen(startGateOpen ? false : true)}');
    expect(controller).toContain('resetOriginalRound(next);');
  });
});
