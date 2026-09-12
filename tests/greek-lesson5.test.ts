import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { hasAmbiguousGreekTonos } from "../src/features/greek/greek-orthography";
import { resolveBuiltinGreekAsset } from "../supabase/functions/course-audio/builtin-greek-assets";
import { lesson5CourseAudioAssets } from "../supabase/functions/course-audio/lesson5-assets";

type VocabCard = { id: string; greek: string; meaning: string; source_ref: string; accent_note?: string };
type GrammarCard = { id: string; category: string; source_ref: string; rows: Array<{ label: string; cells: string[] }>; accent_note?: string };

const vocabulary = JSON.parse(fs.readFileSync("public/data/greek-lesson5-vocab.json", "utf8")) as VocabCard[];
const grammar = JSON.parse(fs.readFileSync("public/data/greek-lesson5-grammar.json", "utf8")) as GrammarCard[];

describe("Groton Lesson 5", () => {
  it("contains the ten section 5.36 vocabulary entries in textbook order", () => {
    expect(vocabulary.map((card) => card.greek)).toEqual([
      "ἀκούω",
      "βλάπτω",
      "κελεύω",
      "δέσποινα, -ης, ἡ",
      "θάλαττα, -ης, ἡ",
      "θεράπαινα, -ης, ἡ",
      "κλίνη, -ης, ἡ",
      "μοῖρα, -ᾱς, ἡ",
      "ὥρᾱ, -ᾱς, ἡ",
      "ἐπεί, ἐπειδή",
    ]);
    expect(vocabulary.every((card) => card.source_ref === "Groton 5.36")).toBe(true);
    expect(vocabulary.every((card) => card.accent_note === undefined)).toBe(true);
  });

  it("contains both 5.34 ending charts and the μοῖρα and θάλαττα paradigms", () => {
    expect(grammar.map((card) => card.id)).toEqual([
      "lesson5-chart-first-declension-endings-short-alpha-as",
      "lesson5-chart-first-declension-endings-short-alpha-eta",
      "lesson5-chart-first-declension-moira",
      "lesson5-chart-first-declension-thalatta",
    ]);
    expect(grammar.every((card) => card.source_ref === "Groton 5.34")).toBe(true);
    expect(grammar.every((card) => card.accent_note === undefined)).toBe(true);

    expect(grammar[0].rows.map((row) => row.cells)).toEqual([
      ["-α", "-αι"], ["-ᾱς", "-ων"], ["-ᾳ", "-αις"], ["-αν", "-ᾱς"], ["-α", "-αι"],
    ]);
    expect(grammar[1].rows.map((row) => row.cells)).toEqual([
      ["-α", "-αι"], ["-ης", "-ων"], ["-ῃ", "-αις"], ["-αν", "-ᾱς"], ["-α", "-αι"],
    ]);
    expect(grammar[2].rows.map((row) => row.cells)).toEqual([
      ["μοῖρ - α", "μοῖρ - αι"], ["μοίρ - ᾱς", "μοιρ - ῶν"], ["μοίρ - ᾳ", "μοίρ - αις"], ["μοῖρ - αν", "μοίρ - ᾱς"], ["μοῖρ - α", "μοῖρ - αι"],
    ]);
    expect(grammar[3].rows.map((row) => row.cells)).toEqual([
      ["θάλαττ - α", "θάλαττ - αι"], ["θαλάττ - ης", "θαλαττ - ῶν"], ["θαλάττ - ῃ", "θαλάττ - αις"], ["θάλαττ - αν", "θαλάττ - ᾱς"], ["θάλαττ - α", "θάλαττ - αι"],
    ]);
  });

  it("uses the permanent spaced stem-ending separator only on paradigms", () => {
    for (const card of grammar.slice(0, 2)) {
      expect(card.rows.flatMap((row) => row.cells).every((cell) => cell.startsWith("-") && !cell.includes(" - "))).toBe(true);
    }
    for (const card of grammar.slice(2)) {
      expect(card.rows.flatMap((row) => row.cells).every((cell) => cell.includes(" - "))).toBe(true);
    }
  });

  it("keeps Lesson 5 question-side Greek in explicit polytonic encoding", () => {
    expect(hasAmbiguousGreekTonos(fs.readFileSync("public/data/greek-lesson5-vocab.json", "utf8"))).toBe(false);
    expect(hasAmbiguousGreekTonos(fs.readFileSync("public/data/greek-lesson5-grammar.json", "utf8"))).toBe(false);
  });

  it("provides a built-in audio definition for every Lesson 5 card", () => {
    expect(lesson5CourseAudioAssets.map((asset) => asset.id).sort()).toEqual(grammar.map((card) => card.id).sort());
    for (const card of [...vocabulary, ...grammar]) expect(resolveBuiltinGreekAsset(card.id), card.id).not.toBeNull();
    for (const asset of lesson5CourseAudioAssets) {
      expect(asset.canonicalIpa).toMatch(/^\/.*\/$/u);
      expect(asset.ttsText).toMatch(/^\/.*\/$/u);
      expect(asset.ttsText).not.toContain(" - ");
    }
  });

  it("wires Lesson 5 into the Greek selection menu without adding accent rationale", () => {
    const page = fs.readFileSync("src/pages/greek-page.tsx", "utf8");
    const decks = fs.readFileSync("src/data/builtin-decks.ts", "utf8");
    expect(page).toContain('title="Lesson 5"');
    expect(page).toContain('label="All Lesson 5 vocabulary"');
    expect(page).toContain("lesson5EndingsKeys");
    expect(page).toContain("lesson5ParadigmKeys");
    expect(decks).toContain('deckId: "alpha-omega-lesson5-vocab"');
    expect(decks).toContain('deckId: "alpha-omega-lesson5-grammar"');
    expect(decks).not.toContain('source: "From Alpha to Omega, Lesson 5",\n        notes: [card.part_of_speech, card.accent_note');
  });
});
