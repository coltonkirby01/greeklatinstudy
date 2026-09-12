import fs from "node:fs";
import { describe, expect, it } from "vitest";

type VocabularyCard = {
  id: string;
  greek: string;
  source_ref?: string;
  accent_note?: string;
};

function cards(path: string) {
  return JSON.parse(fs.readFileSync(path, "utf8")) as VocabularyCard[];
}

function card(source: VocabularyCard[], id: string) {
  const found = source.find((entry) => entry.id === id);
  if (!found) throw new Error(`Missing vocabulary card ${id}.`);
  return found;
}

describe("Groton vocabulary accent notes", () => {
  const lesson3 = cards("public/data/greek-lesson3-vocab.json");
  const lesson4 = cards("public/data/greek-lesson4-vocab.json");

  it("gives every Lesson 3–4 vocabulary card a Groton reference and explicit accent note", () => {
    for (const entry of [...lesson3, ...lesson4]) {
      expect(entry.source_ref, entry.id).toMatch(/^Groton /);
      expect(entry.accent_note?.trim().length, entry.id).toBeGreaterThan(10);
    }
  });

  it("explicitly identifies κλέπτω as acute on the penult and not subject to grave substitution", () => {
    const klepto = card(lesson3, "lesson3-v4");
    expect(klepto.greek).toBe("κλέπτω");
    expect(klepto.accent_note).toContain("Acute on the penult");
    expect(klepto.accent_note).toContain("does not change to grave");
    expect(klepto.source_ref).toBe("Groton 3.24");
  });

  it("distinguishes isolated ultima acute from contextual grave where Groton requires it", () => {
    expect(card(lesson3, "lesson3-v8").accent_note).toContain("μὴ");
    expect(card(lesson3, "lesson3-v10").accent_note).toContain("καὶ");
    expect(card(lesson3, "lesson3-v11").accent_note).toContain("grave");
    expect(card(lesson3, "lesson3-v11").accent_note).toContain("acute");
    expect(card(lesson4, "lesson4-v2").accent_note).toContain("ἀγορὰ");
    expect(card(lesson4, "lesson4-v5").accent_note).toContain("θεὰ");
  });

  it("labels circumflex and unaccented vocabulary entries explicitly", () => {
    expect(card(lesson4, "lesson4-v11").accent_note).toContain("Circumflex");
    expect(card(lesson4, "lesson4-v8").accent_note).toContain("without a written accent");
    expect(card(lesson4, "lesson4-v9").accent_note).toContain("without a written accent");
  });

  it("maps accent notes into the UI-facing card notes and metadata", () => {
    const loader = fs.readFileSync("src/data/builtin-decks.ts", "utf8");
    expect(loader).toContain('card.accent_note ? `Accent: ${card.accent_note}` : ""');
    expect(loader).toContain("accentNote: card.accent_note");
  });
});
