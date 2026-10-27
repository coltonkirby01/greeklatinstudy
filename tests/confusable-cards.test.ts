import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { buildConfusableIndex, confusableSelectedKeys, confusablePartner } from "../src/features/study/confusable-cards";
import type { StudyCard } from "../src/features/study/types";

function entry(id: string, front: string, back: string): { key: string; card: StudyCard } {
  return { key: "vocab:" + id, card: { id, deckId: "test", front, back, metadata: { partOfSpeech: "verb" } } };
}

describe("Confusables study mode", () => {
  const items = [
    entry("amo", "amō -āre", "love, like"),
    entry("diligo", "dīligō -ere", "love, esteem"),
    entry("carus", "cārus -a -um", "dear, precious"),
    entry("clarus", "clārus -a -um", "clear, famous"),
    entry("porto", "portō -āre", "carry"),
    entry("lego", "legō -ere", "read"),
    entry("logos", "λόγος", "word, speech"),
    entry("rhema", "ῥῆμα", "word, saying"),
    entry("unrelated", "equus", "horse"),
  ];
  const index = buildConfusableIndex(items);

  it("finds same-meaning terms and visually similar but distinct headwords", () => {
    expect(index.get("vocab:amo")).toContainEqual({ key: "vocab:diligo", reason: "shared meaning" });
    expect(index.get("vocab:carus")).toContainEqual({ key: "vocab:clarus", reason: "similar form" });
    expect(index.get("vocab:logos")).toContainEqual({ key: "vocab:rhema", reason: "shared meaning" });
    expect(index.has("vocab:unrelated")).toBe(false);
  });

  it("filters matches strictly to the user's currently selected cards", () => {
    expect(confusableSelectedKeys(index, ["vocab:carus", "vocab:clarus", "vocab:unrelated"])).toEqual(new Set(["vocab:carus", "vocab:clarus"]));
    expect(confusableSelectedKeys(index, ["vocab:amo", "vocab:unrelated"])).toEqual(new Set());
    expect(confusablePartner(index, "vocab:amo", ["vocab:unrelated"])).toBeNull();
    expect(confusablePartner(index, "vocab:amo", ["vocab:diligo"])?.key).toBe("vocab:diligo");
  });

  it("does not conflate the same headword with another or use superficial function words as meanings", () => {
    const related = buildConfusableIndex([
      entry("one", "videō", "to see"),
      entry("two", "videō -ēre", "to watch"),
      entry("three", "mōtus", "the movement"),
      entry("four", "celer", "a fast thing"),
    ]);
    expect(related.get("vocab:one")).toBeUndefined();
    expect(related.get("vocab:three")).toBeUndefined();
    expect(related.get("vocab:four")).toBeUndefined();
  });

  it("wires a genuine study-order option, contrast note, and standard review persistence", () => {
    const session = fs.readFileSync("src/features/study/multi-source-study-session.tsx", "utf8");
    expect(session).toContain('<option value="confusables"');
    expect(session).toContain('confusableSelectedKeys(confusableIndex');
    expect(session).toContain('confusablePartner(confusableIndex');
    expect(session).toContain("Compare with:");
    expect(session).toContain("const selected = chooseNext(current); if (selected) present(selected)");
    expect(session).toContain("recordReview(");
    expect(session).not.toContain("Confusables Grammar"); // No generated parallel deck.
  });
});
