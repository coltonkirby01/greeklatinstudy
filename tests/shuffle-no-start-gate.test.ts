import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("continuous Greek/Latin study orders without a round-completion gate", () => {
  const controller = fs.readFileSync("src/features/study/multi-source-study-session.tsx", "utf8");

  it("has no round-completion overlay or round tracker in the shared study controller", () => {
    expect(controller).not.toContain("StudyRoundGate");
    expect(controller).not.toContain("roundGate");
    expect(controller).not.toContain("roundRef");
    expect(controller).not.toContain("advanceRound");
    expect(controller).not.toContain("resetOriginalRound");
    expect(controller).not.toContain('from "./study-rounds"');
  });

  it("advances after Save and Skip through the same selection controller", () => {
    expect(controller).toContain("const selected = chooseNext(current);");
    expect(controller).toContain("const selected = chooseNext(previous, selectionMode, Boolean(warmup));");
    expect(controller).toContain('if (mode === "sequential" && !personalized) {');
    expect(controller).toContain("nextSequentialIndex(candidates.length, currentIndex)");
  });

  it("still uses the independent Shuffle cycle and starts Shuffle immediately", () => {
    expect(controller).toContain("nextShuffleKey([...byKey.keys()], shuffleCycleRef.current");
    expect(controller).toContain('resetUi(); setStartGateOpen(next !== "shuffle");');
    expect(controller).toContain('if (!internalSelectionChange) setStartGateOpen(selectionMode !== "shuffle");');
  });

  it("lets Skip and Back navigate while Shuffle is running without triggering the document click pause", () => {
    expect(controller).toContain('target?.closest(\'[data-study-control="skip"], [data-study-control="back"], [data-study-control="card-order"]\')');
    expect(controller).toContain('document.addEventListener("click", pauseForPageClick, true)');
    expect(controller).toContain("shuffleCycleRef.current = reconcileShuffleCycle(");
    expect(controller).toContain('<select data-study-control="card-order" value={selectionMode}');
  });

  it("keeps the pause/Start gate and separate Ever wrong flash-completion choices", () => {
    expect(controller).toContain('<StudyStartGate onStart={() => setStartGateOpen(false)}');
    expect(controller).toContain('onClick={() => setStartGateOpen(startGateOpen ? false : true)}');
    expect(controller).toContain("Reflash all (");
    expect(controller).toContain("Reflash wrong again (");
    expect(controller).toContain("Return to main deck");
  });
});
