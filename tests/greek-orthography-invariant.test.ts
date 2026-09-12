import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  hasAmbiguousGreekTonos,
  normalizeGreekCardValue,
  normalizeGreekDisplayAccents,
} from "../src/features/greek/greek-orthography";

describe("future Greek card accent invariant", () => {
  it("converts modern tonos glyphs to explicit polytonic acute/oxia forms", () => {
    expect(normalizeGreekDisplayAccents("γράφω κλέπτω καί μή")).toBe("γράφω κλέπτω καί μή");
    expect(hasAmbiguousGreekTonos("γράφω")).toBe(true);
    expect(hasAmbiguousGreekTonos("γράφω")).toBe(false);
  });

  it("never changes a supplied grave or circumflex into an acute", () => {
    expect(normalizeGreekDisplayAccents("καὶ μὴ θεᾶς ὦ")).toBe("καὶ μὴ θεᾶς ὦ");
  });

  it("normalizes Greek recursively inside imported chart/pronunciation metadata", () => {
    expect(normalizeGreekCardValue({
      pronunciationText: "παίδευε, παιδευέτω",
      chartRows: [{ label: "2nd", cells: ["παίδευε", "παιδεύετε", "καὶ"] }],
    })).toEqual({
      pronunciationText: "παίδευε, παιδευέτω",
      chartRows: [{ label: "2nd", cells: ["παίδευε", "παιδεύετε", "καὶ"] }],
    });
  });

  it("keeps the directional Greek font on every generic study surface", () => {
    const css = fs.readFileSync("public/greek-font.css", "utf8");
    for (const selector of [".greek-front", ".greek-script", ".greek-answer-title", ".greek-answer-copy", ".priority-script"]) {
      expect(css, selector).toContain(selector);
    }
    expect(css).toContain('font-family: "Noto Serif"');
  });

  it("keeps current Groton vocabulary sources free of ambiguous tonos encodings", () => {
    for (const path of ["public/data/greek-lesson3-vocab.json", "public/data/greek-lesson4-vocab.json"]) {
      const source = fs.readFileSync(path, "utf8");
      expect(hasAmbiguousGreekTonos(source), path).toBe(false);
    }
  });
});
