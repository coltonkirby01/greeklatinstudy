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

describe("Groton Lessons 9–10 expansion", () => {
  it("adds the Lesson 9 vocabulary list as eleven stable source cards", () => {
    const cards = readJson<VocabCard[]>("public/data/greek-lesson9-vocab.json");
    expect(cards).toHaveLength(11);
    expect(cards.every((card) => card.lesson === 9 && card.source_ref === "Groton 9.63")).toBe(true);
    expect(cards.map((card) => card.id)).toEqual(Array.from({ length: 11 }, (_, index) => `lesson9-v${index + 1}`));
    expect(cards.map((card) => card.greek)).toEqual([
      "δουλεύω, δουλεύσω",
      "δεσπότης, -ου, ὁ",
      "μαθητής, -οῦ, ὁ",
      "νεᾱνίᾱς, -ου, ὁ",
      "οἰκέτης, -ου, ὁ",
      "ἀθάνατος, -ον",
      "ἀνάξιος, -ον",
      "δοῦλος, -η, -ον",
      "ἐλεύθερος, -ᾱ, -ον",
      "κακός, -ή, -όν",
      "πρότερος, -ᾱ, -ον",
    ]);
  });

  it("adds first-declension masculine endings and the two Lesson 9 model paradigms", () => {
    const cards = readJson<GrammarCard[]>("public/data/greek-lesson9-grammar.json");
    expect(cards).toHaveLength(3);

    expect(cards.find((card) => card.id === "lesson9-chart-first-declension-masculine-endings")?.rows).toEqual([
      { label: "Nominative", cells: ["-ης", "-ᾱς", "-αι"] },
      { label: "Genitive", cells: ["-ου", "-ου", "-ων"] },
      { label: "Dative", cells: ["-ῃ", "-ᾳ", "-αις"] },
      { label: "Accusative", cells: ["-ην", "-ᾱν", "-ᾱς"] },
      { label: "Vocative", cells: ["-α/-η", "-ᾱ", "-αι"] },
    ]);

    expect(cards.find((card) => card.id === "lesson9-chart-first-declension-mathetes")?.rows).toEqual([
      { label: "Nominative", cells: ["μαθητής", "μαθηταί"] },
      { label: "Genitive", cells: ["μαθητοῦ", "μαθητῶν"] },
      { label: "Dative", cells: ["μαθητῇ", "μαθηταῖς"] },
      { label: "Accusative", cells: ["μαθητήν", "μαθητᾱ́ς"] },
      { label: "Vocative", cells: ["μαθητά", "μαθηταί"] },
    ]);
    expect(cards.find((card) => card.id === "lesson9-chart-first-declension-neanias")?.rows).toEqual([
      { label: "Nominative", cells: ["νεᾱνίᾱς", "νεᾱνίαι"] },
      { label: "Genitive", cells: ["νεᾱνίου", "νεᾱνιῶν"] },
      { label: "Dative", cells: ["νεᾱνίᾳ", "νεᾱνίαις"] },
      { label: "Accusative", cells: ["νεᾱνίᾱν", "νεᾱνίᾱς"] },
      { label: "Vocative", cells: ["νεᾱνίᾱ", "νεᾱνίαι"] },
    ]);
  });

  it("adds the Lesson 10 vocabulary list and imperfect active indicative", () => {
    const vocabulary = readJson<VocabCard[]>("public/data/greek-lesson10-vocab.json");
    const grammar = readJson<GrammarCard[]>("public/data/greek-lesson10-grammar.json");

    expect(vocabulary).toHaveLength(12);
    expect(vocabulary.every((card) => card.lesson === 10 && card.source_ref === "Groton 10.69")).toBe(true);
    expect(vocabulary.map((card) => card.id)).toEqual(Array.from({ length: 12 }, (_, index) => `lesson10-v${index + 1}`));
    expect(vocabulary[0]?.greek).toBe("λέγω, ἐρῶ/λέξω");
    expect(vocabulary[1]?.greek).toBe("πρᾱ́ττω, πρᾱ́ξω");
    expect(vocabulary[2]?.greek).toBe("φεύγω, φεύξομαι");
    expect(vocabulary.at(-1)?.greek).toBe("οὖν");

    expect(grammar).toHaveLength(2);
    expect(grammar.find((card) => card.id === "lesson10-chart-imperfect-active-indicative-endings")?.rows).toEqual([
      { label: "1st person", cells: ["-ον", "-ομεν"] },
      { label: "2nd person", cells: ["-ες", "-ετε"] },
      { label: "3rd person", cells: ["-ε(ν)", "-ον"] },
    ]);
    expect(grammar.find((card) => card.id === "lesson10-chart-imperfect-active-indicative")?.rows).toEqual([
      { label: "1st person", cells: ["ἐπαίδευον", "ἐπαιδεύομεν"] },
      { label: "2nd person", cells: ["ἐπαίδευες", "ἐπαιδεύετε"] },
      { label: "3rd person", cells: ["ἐπαίδευε(ν)", "ἐπαίδευον"] },
    ]);
  });

  it("keeps new source data polytonic and registers audio definitions without paid prewarming", () => {
    const paths = [
      "public/data/greek-lesson9-vocab.json",
      "public/data/greek-lesson9-grammar.json",
      "public/data/greek-lesson10-vocab.json",
      "public/data/greek-lesson10-grammar.json",
    ];
    for (const path of paths) expect(hasAmbiguousGreekTonos(fs.readFileSync(path, "utf8")), path).toBe(false);

    const vocabulary = [
      ...readJson<VocabCard[]>("public/data/greek-lesson9-vocab.json"),
      ...readJson<VocabCard[]>("public/data/greek-lesson10-vocab.json"),
    ];
    const grammar = [
      ...readJson<GrammarCard[]>("public/data/greek-lesson9-grammar.json"),
      ...readJson<GrammarCard[]>("public/data/greek-lesson10-grammar.json"),
    ];
    for (const card of [...vocabulary, ...grammar]) {
      const asset = resolveBuiltinGreekAsset(card.id);
      expect(asset, card.id).not.toBeNull();
      expect(asset?.canonicalIpa, card.id).toBeTruthy();
      expect(asset?.ttsText, card.id).toBeTruthy();
    }

    const prewarm = fs.readFileSync(".github/workflows/prewarm-greek-audio.yml", "utf8");
    expect(prewarm).not.toContain("lesson9-v1");
    expect(prewarm).not.toContain("lesson10-v1");
  });

  it("wires Lessons 9 and 10 into the Greek selector and built-in Stats registry", () => {
    const page = fs.readFileSync("src/pages/greek-page.tsx", "utf8");
    const catalog = fs.readFileSync("src/features/study/builtin-study-catalog.ts", "utf8");

    expect(page).toContain('title="Lesson 9"');
    expect(page).toContain('title="Lesson 10"');
    expect(page).toContain("decks.lesson9Vocabulary");
    expect(page).toContain("decks.lesson9Grammar");
    expect(page).toContain("decks.lesson10Vocabulary");
    expect(page).toContain("decks.lesson10Grammar");
    expect(page).toContain("firstDeclensionMasculineEndings");
    expect(page).toContain("imperfectActiveIndicativeEndings");
    expect(catalog).toContain('id: "alpha-omega-lesson9-vocab"');
    expect(catalog).toContain('id: "alpha-omega-lesson9-grammar"');
    expect(catalog).toContain('id: "alpha-omega-lesson10-vocab"');
    expect(catalog).toContain('id: "alpha-omega-lesson10-grammar"');
  });
});
