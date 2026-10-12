import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { hasAmbiguousGreekTonos } from "../src/features/greek/greek-orthography";
import { resolveBuiltinGreekAsset } from "../supabase/functions/course-audio/builtin-greek-assets";

type VocabCard = {
  id: string;
  greek: string;
  meaning: string;
  part_of_speech: string;
  lesson: number;
  source_ref?: string;
};

type GrammarCard = {
  id: string;
  category: string;
  prompt: string;
  columns: string[];
  rows: Array<{ label: string; cells: string[] }>;
  source_ref?: string;
};

const readJson = <T>(path: string) => JSON.parse(fs.readFileSync(path, "utf8")) as T;

describe("Groton Lesson 12", () => {
  it("adds the ten Lesson 12 vocabulary cards with stable ids", () => {
    const cards = readJson<VocabCard[]>("public/data/greek-lesson12-vocab.json");

    expect(cards).toHaveLength(10);
    expect(cards.every((card) => card.lesson === 12 && card.source_ref === "Groton 12.81")).toBe(true);
    expect(cards.map((card) => card.id)).toEqual(Array.from({ length: 10 }, (_, index) => `lesson12-v${index + 1}`));
    expect(cards.map((card) => card.greek)).toEqual([
      "εἰμί, ἔσομαι",
      "λῡ́ω, λῡ́σω",
      "ἀρχή, -ῆς, ἡ",
      "εἰρήνη, -ης, ἡ",
      "λόγος, -ου, ὁ",
      "πόλεμος, -ου, ὁ",
      "ἐχθρός, -ᾱ́, -όν",
      "πολέμιος, -ᾱ, -ον",
      "διά (δι᾽)",
      "γε (γ᾽)",
    ]);
  });

  it("adds exactly six εἰμί morphology charts", () => {
    const cards = readJson<GrammarCard[]>("public/data/greek-lesson12-grammar.json");

    expect(cards).toHaveLength(6);
    expect(cards.map((card) => card.category)).toEqual([
      "εἰμί — Present Active Indicative Forms",
      "εἰμί — Future Middle Indicative Forms",
      "εἰμί — Imperfect Active Indicative Forms",
      "εἰμί — Present Active Imperative Forms",
      "εἰμί — Present Active Infinitive Form",
      "εἰμί — Future Middle Infinitive Form",
    ]);

    expect(cards.find((card) => card.id === "lesson12-chart-eimi-present-active-indicative-forms")?.rows).toEqual([
      { label: "1st person", cells: ["εἰμί", "ἐσμέν"] },
      { label: "2nd person", cells: ["εἶ", "ἐστέ"] },
      { label: "3rd person", cells: ["ἐστί(ν)", "εἰσί(ν)"] },
    ]);
    expect(cards.find((card) => card.id === "lesson12-chart-eimi-future-middle-indicative-forms")?.rows).toEqual([
      { label: "1st person", cells: ["ἔσομαι", "ἐσόμεθα"] },
      { label: "2nd person", cells: ["ἔσῃ / ἔσει", "ἔσεσθε"] },
      { label: "3rd person", cells: ["ἔσται", "ἔσονται"] },
    ]);
    expect(cards.find((card) => card.id === "lesson12-chart-eimi-imperfect-active-indicative-forms")?.rows).toEqual([
      { label: "1st person", cells: ["ἦ / ἦν", "ἦμεν"] },
      { label: "2nd person", cells: ["ἦσθα", "ἦτε / ἦστε"] },
      { label: "3rd person", cells: ["ἦν", "ἦσαν"] },
    ]);
    expect(cards.find((card) => card.id === "lesson12-chart-eimi-present-active-imperative-forms")?.rows).toEqual([
      { label: "2nd person", cells: ["ἴσθι", "ἔστε"] },
      { label: "3rd person", cells: ["ἔστω", "ἔστων"] },
    ]);
    expect(cards.find((card) => card.id === "lesson12-chart-eimi-present-active-infinitive-form")?.rows).toEqual([
      { label: "Present Active Infinitive", cells: ["εἶναι"] },
    ]);
    expect(cards.find((card) => card.id === "lesson12-chart-eimi-future-middle-infinitive-form")?.rows).toEqual([
      { label: "Future Middle Infinitive", cells: ["ἔσεσθαι"] },
    ]);
  });

  it("keeps Lesson 12 polytonic and registers cached audio definitions", () => {
    const paths = [
      "public/data/greek-lesson12-vocab.json",
      "public/data/greek-lesson12-grammar.json",
    ];
    for (const path of paths) expect(hasAmbiguousGreekTonos(fs.readFileSync(path, "utf8")), path).toBe(false);

    const vocabulary = readJson<VocabCard[]>(paths[0]);
    const grammar = readJson<GrammarCard[]>(paths[1]);
    for (const card of [...vocabulary, ...grammar]) {
      const asset = resolveBuiltinGreekAsset(card.id);
      expect(asset, card.id).not.toBeNull();
      expect(asset?.canonicalIpa, card.id).toBeTruthy();
      expect(asset?.ttsText, card.id).toBeTruthy();
    }

    const prewarm = fs.readFileSync(".github/workflows/prewarm-greek-audio.yml", "utf8");
    expect(prewarm).not.toContain("lesson12-v1");
  });

  it("wires Lesson 12 into the active Greek selector and built-in Stats registry", () => {
    const page = fs.readFileSync("src/pages/greek-page-v2.tsx", "utf8");
    const catalog = fs.readFileSync("src/features/study/builtin-study-catalog.ts", "utf8");

    expect(page).toContain("loadGreekLesson12VocabularyDeck");
    expect(page).toContain("loadGreekLesson12GrammarDeck");
    expect(page).toContain('vocabularyDeck: "lesson12Vocabulary"');
    expect(page).toContain('grammarDeck: "lesson12Grammar"');
    expect(page).toContain("eimiPresentActiveIndicativeForms");
    expect(page).toContain("eimiFutureMiddleInfinitiveForm");
    expect(catalog).toContain('id: "alpha-omega-lesson12-vocab"');
    expect(catalog).toContain('id: "alpha-omega-lesson12-grammar"');
  });
});
