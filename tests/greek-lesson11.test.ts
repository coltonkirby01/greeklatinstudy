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

describe("Groton Lesson 11", () => {
  it("adds the ten Lesson 11 vocabulary cards with stable ids", () => {
    const cards = readJson<VocabCard[]>("public/data/greek-lesson11-vocab.json");

    expect(cards).toHaveLength(10);
    expect(cards.every((card) => card.lesson === 11 && card.source_ref === "Groton 11.77")).toBe(true);
    expect(cards.map((card) => card.id)).toEqual(Array.from({ length: 10 }, (_, index) => `lesson11-v${index + 1}`));
    expect(cards.map((card) => card.greek)).toEqual([
      "πείθω, πείσω",
      "τρέπω, τρέψω",
      "ἅμαξα, -ης, ἡ",
      "λίμνη, -ης, ἡ",
      "τόπος, -ου, ὁ",
      "τρόπος, -ου, ὁ",
      "μακρός, -ᾱ́, -όν",
      "μῑκρός, -ᾱ́, -όν",
      "πόρρω",
      "ὑπό (ὑπ᾽, ὑφ᾽)",
    ]);
  });

  it("adds exactly the six Lesson 11 middle/passive ending charts", () => {
    const cards = readJson<GrammarCard[]>("public/data/greek-lesson11-grammar.json");

    expect(cards).toHaveLength(6);
    expect(cards.every((card) => card.category.endsWith("Endings"))).toBe(true);
    expect(cards.map((card) => card.category)).toEqual([
      "Present Middle/Passive Indicative Endings",
      "Present Middle/Passive Infinitive Endings",
      "Future Middle Indicative Endings",
      "Future Middle Infinitive Endings",
      "Imperfect Middle/Passive Indicative Endings",
      "Present Middle/Passive Imperative Endings",
    ]);

    expect(cards.find((card) => card.id === "lesson11-chart-present-middle-passive-indicative-endings")?.rows).toEqual([
      { label: "1st person", cells: ["-ομαι", "-ομεθα"] },
      { label: "2nd person", cells: ["-ῃ", "-εσθε"] },
      { label: "3rd person", cells: ["-εται", "-ονται"] },
    ]);
    expect(cards.find((card) => card.id === "lesson11-chart-present-middle-passive-infinitive-endings")?.rows).toEqual([
      { label: "Present Middle/Passive Infinitive", cells: ["-εσθαι"] },
    ]);
    expect(cards.find((card) => card.id === "lesson11-chart-future-middle-indicative-endings")?.rows).toEqual([
      { label: "1st person", cells: ["-σομαι", "-σομεθα"] },
      { label: "2nd person", cells: ["-σῃ", "-σεσθε"] },
      { label: "3rd person", cells: ["-σεται", "-σονται"] },
    ]);
    expect(cards.find((card) => card.id === "lesson11-chart-future-middle-infinitive-endings")?.rows).toEqual([
      { label: "Future Middle Infinitive", cells: ["-σεσθαι"] },
    ]);
    expect(cards.find((card) => card.id === "lesson11-chart-imperfect-middle-passive-indicative-endings")?.rows).toEqual([
      { label: "1st person", cells: ["-όμην", "-όμεθα"] },
      { label: "2nd person", cells: ["-ου", "-εσθε"] },
      { label: "3rd person", cells: ["-ετο", "-οντο"] },
    ]);
    expect(cards.find((card) => card.id === "lesson11-chart-present-middle-passive-imperative-endings")?.rows).toEqual([
      { label: "2nd person", cells: ["-ου", "-εσθε"] },
      { label: "3rd person", cells: ["-έσθω", "-έσθων"] },
    ]);
  });

  it("keeps Lesson 11 polytonic and registers cached audio definitions", () => {
    const paths = [
      "public/data/greek-lesson11-vocab.json",
      "public/data/greek-lesson11-grammar.json",
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
    expect(prewarm).not.toContain("lesson11-v1");
  });

  it("wires Lesson 11 into the active Greek selector and built-in Stats registry", () => {
    const page = fs.readFileSync("src/pages/greek-page-v2.tsx", "utf8");
    const catalog = fs.readFileSync("src/features/study/builtin-study-catalog.ts", "utf8");

    expect(page).toContain("loadGreekLesson11VocabularyDeck");
    expect(page).toContain("loadGreekLesson11GrammarDeck");
    expect(page).toContain('vocabularyDeck: "lesson11Vocabulary"');
    expect(page).toContain('grammarDeck: "lesson11Grammar"');
    expect(page).toContain("presentMiddlePassiveIndicativeEndings");
    expect(page).toContain("presentMiddlePassiveImperativeEndings");
    expect(catalog).toContain('id: "alpha-omega-lesson11-vocab"');
    expect(catalog).toContain('id: "alpha-omega-lesson11-grammar"');
  });
});
