import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { formatGreekLesson3ParadigmCell, greekLesson3ParadigmSpeechText, latinRowsToCards, parseCsv } from "../src/data/builtin-decks";
import { jsonToCards, rowsToCards } from "../src/features/decks/import-parser";

type GreekGrammarChart = { id: string; category: string; prompt: string; columns: string[]; rows: Array<{ label: string; cells: string[] }>; source_ref?: string };
type GreekVocabularyCard = { id: string; source_ref?: string };

describe("authoritative source migration", () => {
  it("preserves source counts while expanding Greek through Lesson 4", () => {
    const greek = JSON.parse(fs.readFileSync("public/data/greek-cards.json", "utf8"));
    const greekLesson3Vocabulary = JSON.parse(fs.readFileSync("public/data/greek-lesson3-vocab.json", "utf8"));
    const greekLesson3Grammar = JSON.parse(fs.readFileSync("public/data/greek-lesson3-grammar.json", "utf8")) as GreekGrammarChart[];
    const greekLesson4Vocabulary = JSON.parse(fs.readFileSync("public/data/greek-lesson4-vocab.json", "utf8")) as GreekVocabularyCard[];
    const greekLesson4Grammar = JSON.parse(fs.readFileSync("public/data/greek-lesson4-grammar.json", "utf8")) as GreekGrammarChart[];
    const latin = latinRowsToCards(parseCsv(fs.readFileSync("public/data/dickinson-latin-core.csv", "utf8")));
    expect(greek).toHaveLength(55);
    expect(greekLesson3Vocabulary).toHaveLength(11);
    expect(greekLesson3Grammar).toHaveLength(6);
    expect(greekLesson4Vocabulary).toHaveLength(11);
    expect(greekLesson4Grammar).toHaveLength(8);
    expect(greekLesson4Vocabulary.every((card) => card.source_ref === "Groton 4.32")).toBe(true);
    expect(greekLesson4Grammar.slice(0, 6).every((card) => card.source_ref === "Groton 4.29")).toBe(true);
    expect(greekLesson4Grammar.slice(6).every((card) => card.source_ref === "Groton 4.30")).toBe(true);

    expect(new Set(greekLesson3Grammar.map((card) => card.category))).toEqual(new Set([
      "Present Active Indicative Endings",
      "Present Active Infinitive Endings",
      "Present Active Imperative Endings",
      "Present Active Indicative",
      "Present Active Infinitive",
      "Present Active Imperative",
    ]));
    expect(greekLesson3Grammar.map((card) => card.id).sort()).toEqual([
      "lesson3-chart-present-active-imperative",
      "lesson3-chart-present-active-imperative-endings",
      "lesson3-chart-present-active-indicative",
      "lesson3-chart-present-active-indicative-endings",
      "lesson3-chart-present-active-infinitive",
      "lesson3-chart-present-active-infinitive-endings",
    ]);

    const indicativeEndings = greekLesson3Grammar.find((card) => card.id === "lesson3-chart-present-active-indicative-endings");
    expect(indicativeEndings?.source_ref).toBe("Groton 3.20");
    expect(indicativeEndings?.columns).toEqual(["Singular", "Plural"]);
    expect(indicativeEndings?.rows).toEqual([
      { label: "1st person", cells: ["-ω", "-ομεν"] },
      { label: "2nd person", cells: ["-εις", "-ετε"] },
      { label: "3rd person", cells: ["-ει", "-ουσι(ν)"] },
    ]);

    const infinitiveEndings = greekLesson3Grammar.find((card) => card.id === "lesson3-chart-present-active-infinitive-endings");
    expect(infinitiveEndings?.source_ref).toBe("Groton 3.21");
    expect(infinitiveEndings?.rows).toEqual([{ label: "Present Active Infinitive", cells: ["-ειν"] }]);

    const imperativeEndings = greekLesson3Grammar.find((card) => card.id === "lesson3-chart-present-active-imperative-endings");
    expect(imperativeEndings?.source_ref).toBe("Groton 3.22");
    expect(imperativeEndings?.rows).toEqual([
      { label: "2nd person", cells: ["-ε", "-ετε"] },
      { label: "3rd person", cells: ["-έτω", "-όντων"] },
    ]);

    const indicative = greekLesson3Grammar.find((card) => card.category === "Present Active Indicative");
    expect(indicative?.columns).toEqual(["Singular", "Plural"]);
    expect(indicative?.rows).toEqual([
      { label: "1st person", cells: ["παιδεύω", "παιδεύομεν"] },
      { label: "2nd person", cells: ["παιδεύεις", "παιδεύετε"] },
      { label: "3rd person", cells: ["παιδεύει", "παιδεύουσι(ν)"] },
    ]);

    const infinitive = greekLesson3Grammar.find((card) => card.category === "Present Active Infinitive");
    expect(infinitive?.rows).toEqual([{ label: "Present Active Infinitive", cells: ["παιδεύειν"] }]);

    const imperative = greekLesson3Grammar.find((card) => card.category === "Present Active Imperative");
    expect(imperative?.columns).toEqual(["Singular", "Plural"]);
    expect(imperative?.rows).toEqual([
      { label: "2nd person", cells: ["παίδευε", "παιδεύετε"] },
      { label: "3rd person", cells: ["παιδευέτω", "παιδευόντων"] },
    ]);

    const alphaEndings = greekLesson4Grammar.find((card) => card.id === "lesson4-chart-first-declension-endings-alpha");
    expect(alphaEndings?.columns).toEqual(["Singular", "Plural"]);
    expect(alphaEndings?.rows).toEqual([
      { label: "Nominative", cells: ["-ᾱ", "-αι"] },
      { label: "Genitive", cells: ["-ᾱς", "-ων"] },
      { label: "Dative", cells: ["-ᾳ", "-αις"] },
      { label: "Accusative", cells: ["-ᾱν", "-ᾱς"] },
      { label: "Vocative", cells: ["-ᾱ", "-αι"] },
    ]);

    const etaEndings = greekLesson4Grammar.find((card) => card.id === "lesson4-chart-first-declension-endings-eta");
    expect(etaEndings?.columns).toEqual(["Singular", "Plural"]);
    expect(etaEndings?.rows).toEqual([
      { label: "Nominative", cells: ["-η", "-αι"] },
      { label: "Genitive", cells: ["-ης", "-ων"] },
      { label: "Dative", cells: ["-ῃ", "-αις"] },
      { label: "Accusative", cells: ["-ην", "-ᾱς"] },
      { label: "Vocative", cells: ["-η", "-αι"] },
    ]);

    const goddess = greekLesson4Grammar.find((card) => card.id === "lesson4-chart-first-declension-thea");
    expect(goddess?.columns).toEqual(["Singular", "Plural"]);
    expect(goddess?.rows).toEqual([
      { label: "Nominative", cells: ["θεά", "θεαί"] },
      { label: "Genitive", cells: ["θεᾶς", "θεῶν"] },
      { label: "Dative", cells: ["θεᾷ", "θεαῖς"] },
      { label: "Accusative", cells: ["θεάν", "θεάς"] },
      { label: "Vocative", cells: ["θεά", "θεαί"] },
    ]);
    for (const card of greekLesson4Grammar.slice(2, 6)) {
      expect(card.rows.flatMap((row) => row.cells).every((form) => !form.includes("-")), card.id).toBe(true);
    }

    expect(latin).toHaveLength(997);
  });

  it("preserves Groton's complete Lesson 3 forms without artificial stem-ending dashes", () => {
    const forms = [
      "παιδεύω",
      "παιδεύομεν",
      "παιδεύεις",
      "παιδεύετε",
      "παιδεύει",
      "παιδεύουσι(ν)",
      "παιδεύειν",
      "παίδευε",
      "παιδευέτω",
      "παιδεύετε",
      "παιδευόντων",
    ];
    expect(forms.map(formatGreekLesson3ParadigmCell)).toEqual(forms);
    expect(formatGreekLesson3ParadigmCell("παιδεύ-ετε")).toBe("παιδεύ-ετε");
  });

  it("builds paradigm speech vertically and omits visual dashes and parenthetical letters", () => {
    expect(greekLesson3ParadigmSpeechText([
      { cells: ["παιδεύω", "παιδεύομεν"] },
      { cells: ["παιδεύεις", "παιδεύετε"] },
      { cells: ["παιδεύει", "παιδεύουσι(ν)"] },
    ])).toBe("παιδεύω, παιδεύεις, παιδεύει, παιδεύομεν, παιδεύετε, παιδεύουσι");
    expect(greekLesson3ParadigmSpeechText([{ cells: ["παιδεύειν"] }])).toBe("παιδεύειν");
    expect(greekLesson3ParadigmSpeechText([
      { cells: ["παίδευε", "παιδεύετε"] },
      { cells: ["παιδευέτω", "παιδευόντων"] },
    ])).toBe("παίδευε, παιδευέτω, παιδεύετε, παιδευόντων");
    expect(greekLesson3ParadigmSpeechText([{ cells: ["λύ-ω"] }])).toBe("λύω");
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
