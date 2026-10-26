import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("unified Greek/Latin shuffle gate behavior", () => {
  const multi = fs.readFileSync("src/features/study/multi-source-study-session.tsx", "utf8");
  it("enters Shuffle without reopening the Start gate", () => {
    expect(multi).toContain('resetUi(); setStartGateOpen(next !== "shuffle");');
    expect(multi).toContain('if (!internalSelectionChange) setStartGateOpen(selectionMode !== "shuffle");');
  });
  it("moves immediately from a completed Shuffle cycle into the next permutation", () => {
    expect(multi).toContain('if (selectionMode === "shuffle") {\n        // Shuffle is continuous');
    expect(multi).toContain('resetOriginalRound("shuffle");');
    expect(multi).toContain('setStartGateOpen(false);');
    expect(multi).toContain('setRoundGate(updated);');
  });
  it("leaves manual pause and Start gates available for other study modes", () => {
    expect(multi).toContain('onClick={() => setStartGateOpen(startGateOpen ? false : true)}');
    expect(multi).toContain('next !== "shuffle"');
  });
});
