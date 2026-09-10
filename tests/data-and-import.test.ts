import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { formatGreekLesson3ParadigmCell, greekLesson3ParadigmSpeechText, latinRowsToCards, parseCsv } from "../src/data/builtin-decks";
import { jsonToCards, rowsToCards } from "../src/features/decks/import-parser";

type GreekGrammarChart = { id: string; category: string; prompt: string; columns: string[]; rows: Array<{ label: string; cells: string[] }> };

describe("authoritative source migration", () => {
  it("preserves source counts while using three whole-paradigm Lesson 3 grammar cards", () => {
    const greek = JSON.parse(fs.readFileSync("public/data/greek-cards.json", "utf8"));
    const greekLesson3Vocabulary = JSON.parse(fs.readFileSync("public/data/greek-lesson3-vocab.json", "utf8"));
    const greekLesson3Grammar = JSON.parse(fs.readFileSync("public/data/greek-lesson3-grammar.json", "utf8")) as GreekGrammarChart[];
    const latin = latinRowsToCards(parseCsv(fs.readFileSync("public/data/dickinson-latin-core.csv", "utf8")));
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
  });

  it("adds the stem-ending dash to undashed Lesson 3 forms for all three paradigms", () => {
    expect([
      "παιδεύω",
      "παιδεύομεν",
      "παιδεύεις",
      "παιδεύετε",
      "παιδεύει",
      "παιδεύουσι(ν)",
      "παιδεύειν",
      "παίδευε",
      "παιδευέτω",
      "παιδευόντων",
    ].map(formatGreekLesson3ParadigmCell)).toEqual([
      "παιδεύ-ω",
      "παιδεύ-ομεν",
      "παιδεύ-εις",
      "παιδεύ-ετε",
      "παιδεύ-ει",
      "παιδεύ-ουσι(ν)",
      "παιδεύ-ειν",
      "παίδευ-ε",
      "παιδευ-έτω",
      "παιδευ-όντων",
    ]);
    expect(formatGreekLesson3ParadigmCell("παιδεύ-ετε")).toBe("παιδεύ-ετε");
  });

  it("builds paradigm speech vertically and omits visual dashes and parenthetical letters", () => {
    expect(greekLesson3ParadigmSpeechText([
      { cells: ["παιδεύ-ω", "παιδεύ-ομεν"] },
      { cells: ["παιδεύ-εις", "παιδεύ-ετε"] },
      { cells: ["παιδεύ-ει", "παιδεύ-ουσι(ν)"] },
    ])).toBe("παιδεύω, παιδεύεις, παιδεύει, παιδεύομεν, παιδεύετε, παιδεύουσι");
    expect(greekLesson3ParadigmSpeechText([{ cells: ["παιδεύ-ειν"] }])).toBe("παιδεύειν");
    expect(greekLesson3ParadigmSpeechText([
      { cells: ["παίδευ-ε", "παιδεύ-ετε"] },
      { cells: ["παιδευ-έτω", "παιδευ-όντων"] },
    ])).toBe("παίδευε, παιδευέτω, παιδεύετε, παιδευόντων");
  });
});

describe("administrator importer", () => {
  it("parses CSV fields including Reverse Prompt", () => {
    const rows = parseCsv('Front,Back,Category,Rank,Reverse Prompt\n"amō","I love",Verb,1,"say I love"\n');
    expect(rowsToCards(rows)).toEqual([{ front: "amō", back: "I love", category: "Verb", rank: 1, source: "", notes: "", reversePrompt: "say I love", metadata: undefined }]);
  });

  it("preserves uploaded Greek paradigm rows so pronunciation can be generated automatically", () => {
    const rows = parseCsv('Front,Back,Chart Columns,Chart Rows\n"Present Active","chart","[\"\"Singular\"\",\"\"Plural\"\"]","[{\"\"label\"\":\"\"1st\"\",\"\"cells\"\":[\"\"λύ-ω\"\",\"\"λύ-ομεν\"\"]}]"\n');
    const card = rowsToCards(rows)[0];
    expect(card.metadata).toMatchObject({
      studySource: "grammar-chart",
      chartColumns: ["Singular", "Plural"],
      chartRows: [{ label: "1st", cells: ["λύ-ω", "λύ-ομεν"] }],
    });
  });

  it("imports optional reviewed Greek pronunciation fields", () => {
    const rows = parseCsv('Front,Back,Pronunciation Text,Canonical IPA,ElevenLabs IPA,Pronunciation System\n"θῡ́ω","I sacrifice","θῡ́ω","/tʰyː́ɔː/","/ˈtʰyːɔː/","Reviewed Classical Attic"\n');
    expect(rowsToCards(rows)[0].metadata).toEqual({
      pronunciationText: "θῡ́ω",
      canonicalIpa: "/tʰyː́ɔː/",
      elevenLabsIpa: "/ˈtʰyːɔː/",
      pronunciationSystem: "Reviewed Classical Attic",
    });
  });

  it("accepts JSON card arrays, paradigms, and reviewed pronunciation metadata", () => {
    expect(jsonToCards([{ Front: "λόγος", Back: "word", Category: "Noun" }])[0]).toMatchObject({ front: "λόγος", back: "word", category: "Noun" });
    expect(jsonToCards([{ prompt: "Present", back: "chart", columns: ["Singular"], rows: [{ label: "1st", cells: ["λύω"] }] }])[0].metadata).toMatchObject({
      studySource: "grammar-chart",
      chartColumns: ["Singular"],
      chartRows: [{ label: "1st", cells: ["λύω"] }],
    });
    expect(jsonToCards([{
      front: "ἀνήρ",
      back: "man",
      canonicalIpa: "/anɛː́r/",
      ttsIpa: "/aˈnɛːr/",
      pronunciationSystem: "Reviewed Classical Attic",
    }])[0].metadata).toMatchObject({
      canonicalIpa: "/anɛː́r/",
      elevenLabsIpa: "/aˈnɛːr/",
      pronunciationSystem: "Reviewed Classical Attic",
    });
  });
});
