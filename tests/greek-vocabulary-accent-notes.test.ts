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

function byId(source: VocabularyCard[], id: string) {
  const found = source.find((entry) => entry.id === id);
  if (!found) throw new Error(`Missing vocabulary card ${id}.`);
  return found;
}

describe("Groton vocabulary front-form fidelity", () => {
  const lesson3 = cards("public/data/greek-lesson3-vocab.json");
  const lesson4 = cards("public/data/greek-lesson4-vocab.json");

  it("uses the printed Lesson 3 forms on the question side", () => {
    expect(lesson3.map((entry) => entry.greek)).toEqual([
      "γράφω",
      "ἐθέλω",
      "θῡ́ω",
      "κλέπτω",
      "παιδεύω",
      "σπεύδω",
      "φυλάττω",
      "μή",
      "οὐ (οὐκ, οὐχ)",
      "καί",
      "καὶ...καί",
    ]);
  });

  it("locks κλέπτω to Groton's polytonic acute form", () => {
    expect(byId(lesson3, "lesson3-v4").greek).toBe("κλέπτω");
  });

  it("uses the printed Lesson 4 forms on the question side", () => {
    expect(lesson4.map((entry) => entry.greek)).toEqual([
      "πέμπω",
      "ἀγορᾱ́, -ᾶς, ἡ",
      "ἐπιστολή, -ῆς, ἡ",
      "ἡσυχίᾱ, -ᾱς, ἡ",
      "θεᾱ́, -ᾶς, ἡ",
      "σκηνή, -ῆς, ἡ",
      "χώρᾱ, -ᾱς, ἡ",
      "εἰς",
      "ἐκ (ἐξ)",
      "ἐν",
      "ὦ",
    ]);
  });

  it("keeps Groton references but no longer adds accent-rationale copy to vocabulary cards", () => {
    for (const entry of [...lesson3, ...lesson4]) {
      expect(entry.source_ref, entry.id).toMatch(/^Groton /);
      expect(entry.accent_note, entry.id).toBeUndefined();
    }
  });
});
