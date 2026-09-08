import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { latinRowsToCards, parseCsv } from "../src/data/builtin-decks";
import { jsonToCards, rowsToCards } from "../src/features/decks/import-parser";
import { buildHenleCharts } from "../src/features/henle/henle-data";

type GreekGrammarChart = { id: string; category: string; prompt: string; columns: string[]; rows: Array<{ label: string; cells: string[] }> };

describe("authoritative source migration", () => {
  it("preserves source counts while using three whole-paradigm Lesson 3 grammar cards", () => {
    const greek = JSON.parse(fs.readFileSync("public/data/greek-cards.json", "utf8"));
    const greekLesson3Vocabulary = JSON.parse(fs.readFileSync("public/data/greek-lesson3-vocab.json", "utf8"));
    const greekLesson3Grammar = JSON.parse(fs.readFileSync("public/data/greek-lesson3-grammar.json", "utf8")) as GreekGrammarChart[];
    const latin = latinRowsToCards(parseCsv(fs.readFileSync("public/data/dickinson-latin-core.csv", "utf8")));
    const henle = JSON.parse(fs.readFileSync("public/data/henle-part1-forms.json", "utf8"));
    expect(greek).toHaveLength(55);
    expect(greekLesson3Vocabulary).toHaveLength(11);
    expect(greekLesson3Grammar).toHaveLength(3);
    expect(new Set(greekLesson3Grammar.map((card) => card.category))).toEqual(new Set(["Present Active Indicative", "Present Active Infinitive", "Present Active Imperative"]));
    expect(greekLesson3Grammar.map((card) => card.id).sort()).toEqual([
      "lesson3-chart-present-active-imperative",
      "lesson3-chart-present-active-indicative",
      "lesson3-chart-present-active-infinitive",
    ]);
    expect(greekLesson3Grammar.some((card) => card.id.startsWith("lesson3-g-"))).toBe(false);

    const indicative = greekLesson3Grammar.find((card) => card.category === "Present Active Indicative");
    expect(indicative?.columns).toEqual(["Singular", "Plural"]);
    expect(indicative?.rows).toEqual([
      { label: "1st person", cells: ["παιδεύ-ω", "παιδεύ-ομεν"] },
      { label: "2nd person", cells: ["παιδεύ-εις", "παιδεύ-ετε"] },
      { label: "3rd person", cells: ["παιδεύ-ει", "παιδεύ-ουσι(ν)"] },
    ]);

    const infinitive = greekLesson3Grammar.find((card) => card.category === "Present Active Infinitive");
    expect(infinitive?.rows).toEqual([{ label: "Present Active Infinitive", cells: ["παιδεύ-ειν"] }]);

    const imperative = greekLesson3Grammar.find((card) => card.category === "Present Active Imperative");
    expect(imperative?.columns).toEqual(["Singular", "Plural"]);
    expect(imperative?.rows).toEqual([
      { label: "2nd person", cells: ["παίδευ-ε", "παιδεύ-ετε"] },
      { label: "3rd person", cells: ["παιδευ-έτω", "παιδευ-όντων"] },
    ]);

    expect(latin).toHaveLength(997);
    expect(henle.cards).toHaveLength(2_062);
    expect(new Set(henle.cards.map((card: { id: string }) => card.id)).size).toBe(2_062);
    expect(new Set(henle.cards.map((card: { rule: number }) => card.rule)).size).toBe(331);
    expect(henle.cards.every((card: { reverse_front?: string; reverse_back?: string }) => card.reverse_front && card.reverse_back)).toBe(true);
    expect(buildHenleCharts(henle.cards)).toHaveLength(248);
  });
});

describe("administrator importer", () => {
  it("parses CSV fields including Reverse Prompt", () => {
    const rows = parseCsv('Front,Back,Category,Rank,Reverse Prompt\n"amō","I love",Verb,1,"say I love"\n');
    expect(rowsToCards(rows)).toEqual([{ front: "amō", back: "I love", category: "Verb", rank: 1, source: "", notes: "", reversePrompt: "say I love" }]);
  });
  it("accepts JSON card arrays", () => {
    expect(jsonToCards([{ Front: "λόγος", Back: "word", Category: "Noun" }])[0]).toMatchObject({ front: "λόγος", back: "word", category: "Noun" });
  });
});
