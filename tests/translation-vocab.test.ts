import fs from "node:fs";
import { describe, expect, it } from "vitest";
import type { DictionaryMatch } from "../src/features/translation/dictionary-sources";
import { comparisonPreview, definitionPreview, grammaticalPreview } from "../src/features/translation/translation-vocab-saver";
import { latinInflectionClass } from "../src/features/translation/latin-grammar-display";
import { latinGrammaticalPreview } from "../src/features/translation/latin-morphology-preview";
import { distinctDictionaryChoices, translationVocabDeck, type TranslationVocabEntry } from "../src/features/translation/translation-vocab-model";

describe("Translation Helper vocabulary", () => {
  it("collapses morphology-only analyses into one lexical choice", () => {
    const matches: DictionaryMatch[] = [
      {
        headword: "amo, amare, amavi, amatus",
        definition: "love; like",
        source: "Whitaker's Words Online",
        morphology: ["present · active · indicative · first person · singular"],
      },
      {
        headword: "amo, amare, amavi, amatus",
        definition: "love; like",
        source: "Whitaker's Words Online",
        morphology: ["future · active · indicative · third person · plural"],
      },
    ];

    const choices = distinctDictionaryChoices(matches);
    expect(choices).toHaveLength(1);
    expect(choices[0].morphology).toEqual([
      "present · active · indicative · first person · singular",
      "future · active · indicative · third person · plural",
    ]);
  });

  it("shows case and number for noun previews without gender", () => {
    expect(grammaticalPreview([
      "noun · nominative · singular · neuter",
      "noun · accusative · singular · neuter",
    ], "noun")).toBe("Nominative / Accusative · Singular");
    expect(grammaticalPreview(["Second Declension Masculine · Genitive · Singular"]))
      .toBe("Genitive · Singular");
    expect(grammaticalPreview(["adjective · genitive · singular · masculine"], "adjective"))
      .toBe("Genitive · Masculine");
    expect(grammaticalPreview(["verb · present · active · indicative · third person · singular"], "verb"))
      .toBeNull();
  });

  it("labels infirmior as a comparative in the Latin summary and full details", () => {
    expect(comparisonPreview([
      "adjective · nominative · singular · common gender · comparative",
      "adjective · vocative · singular · common gender · comparative",
    ])).toBe("Comparative");
    expect(comparisonPreview(
      undefined,
      ["infirmi.or             ADJ    1 1 NOM S C COMP", "infirmi.or             ADJ    1 1 VOC S C COMP"],
    )).toBe("Comparative");
    expect(comparisonPreview(undefined, ["melius               ADV    COMP"])).toBe("Comparative");
    const saver = fs.readFileSync("src/features/translation/translation-vocab-saver.tsx", "utf8");
    expect(saver).toContain('className="translation-vocab-summary-degree"');
    expect(saver).toContain('<InfoSection label="Degree of comparison">{degreePreview}</InfoSection>');
    const parser = fs.readFileSync("supabase/functions/latin-lookup/index.ts", "utf8");
    expect(parser).toContain('COMP: "comparative"');
    expect(parser).toContain('SUPER: "superlative"');
    expect(parser).toContain('POS: "positive"');
  });

  it("shows positive and superlative degree without inferring it from spelling", () => {
    expect(comparisonPreview(["adjective · nominative · singular · masculine · positive"])).toBe("Positive");
    expect(comparisonPreview(["adjective · nominative · singular · masculine · superlative"])).toBe("Superlative");
    expect(comparisonPreview([
      "adjective · nominative · singular · masculine · comparative",
      "adjective · genitive · singular · masculine · positive",
    ])).toBe("Positive / Comparative");
    expect(comparisonPreview(["adjective · nominative · singular · masculine"])).toBeNull();
    expect(comparisonPreview(undefined, ["infirmior, -ius ADJ [XXXAO]"])).toBeNull();
    expect(comparisonPreview(undefined, ["unrelated noun N 3 1 NOM S C"])).toBeNull();
  });

  it("shows source-backed noun declensions and verb conjugations, without mixing analyses", () => {
    const noun: DictionaryMatch = {
      headword: "gustatus, gustatus",
      definition: "taste, tasting",
      source: "Whitaker's Words Online",
      morphology: ["noun · accusative · singular · masculine", "supine · accusative · singular · neuter"],
      whitaker: {
        partOfSpeech: "noun",
        dictionaryDetails: "(4th) M",
        rawAnalyses: [
          "gustat.um            SUPINE 1 1 ACC S N",
          "gustat.um            N      4 1 ACC S M",
        ],
      },
    };
    expect(latinInflectionClass(noun)).toEqual({ label: "Declension", value: "4th declension" });
    expect(latinInflectionClass({ whitaker: { partOfSpeech: "verb", dictionaryDetails: "(1st) TRANS" } }))
      .toEqual({ label: "Conjugation", value: "1st conjugation" });
    expect(latinInflectionClass({ whitaker: { partOfSpeech: "adjective", dictionaryDetails: "(1st/2nd)" } }))
      .toEqual({ label: "Declension", value: "1st/2nd declension" });
    expect(latinInflectionClass({ whitaker: { partOfSpeech: "noun", dictionaryDetails: "(3rd)" } }))
      .toEqual({ label: "Declension", value: "3rd declension" });
  });

  it("uses matching Whitaker source analyses only when lexical metadata omits a class", () => {
    expect(latinInflectionClass({ whitaker: {
      partOfSpeech: "noun",
      rawAnalyses: ["gustat.um            SUPINE 1 1 ACC S N", "gustat.um            N      4 1 ACC S M"],
    } })).toEqual({ label: "Declension", value: "4th declension" });
    expect(latinInflectionClass({ whitaker: {
      partOfSpeech: "supine",
      rawAnalyses: ["gustat.um            N 4 1 ACC S M", "gustat.um            SUPINE 1 1 ACC S N"],
    } })).toEqual({ label: "Conjugation", value: "1st conjugation" });
    expect(latinInflectionClass({ whitaker: { partOfSpeech: "verb", rawAnalyses: ["amav.it            V 1 1 PERF ACTIVE IND 3 S"] } }))
      .toEqual({ label: "Conjugation", value: "1st conjugation" });
    expect(latinInflectionClass({ whitaker: { partOfSpeech: "noun", rawAnalyses: ["gustat.um SUPINE 1 1 ACC S N"] } })).toBeNull();
    expect(latinInflectionClass({ whitaker: { partOfSpeech: "adjective", rawAnalyses: ["infirmi.or       ADJ 1 1 NOM S C COMP"] } })).toBeNull();
    expect(latinInflectionClass({ whitaker: { partOfSpeech: "pronoun", dictionaryDetails: "(1st)" } })).toBeNull();
    expect(latinInflectionClass({ whitaker: {} })).toBeNull();
  });

  it("keeps only learner-relevant details inside each Latin dictionary choice", () => {
    const saver = fs.readFileSync("src/features/translation/translation-vocab-saver.tsx", "utf8");
    expect(saver).not.toContain('className="translation-vocab-summary-class"');
    expect(saver).toContain('latinGrammaticalPreview(choice.morphology, whitaker?.partOfSpeech)');
    expect(saver).toContain('<InfoSection label={inflectionClass.label}>{inflectionClass.value}</InfoSection>');
    expect(saver).toContain('label={(choice.morphology?.length ?? 0) > 1 ? "Possible forms" : "Form"}');
    for (const obsoleteLabel of [
      'label="Age"', 'label="Subject area"', 'label="Geography"', 'label="Frequency"',
      'label="Dictionary source"', 'label="Whitaker code"', 'label="Raw dictionary entry"',
      'label="Raw Whitaker analysis"', 'label="Dictionary details"', 'label="Lookup source"',
    ]) expect(saver).not.toContain(obsoleteLabel);
    expect(saver).toContain('language === "greek" && <InfoSection label="Source">');
  });

  it("shows up to five English definition words in the collapsed entry", () => {
    expect(definitionPreview("word, speech, story, argument, reasoning, discussion")).toBe("word, speech, story, argument, reasoning…");
    expect(definitionPreview("be in motion")).toBe("be in motion");
    expect(definitionPreview("land, country, countryside, space, position")).toBe("land, country, countryside, space, position");
    expect(definitionPreview("to know or understand or comprehend fully", 3)).toBe("to know or…");
  });

  it("renders Latin noun case, number, and gender in that order as short codes", () => {
    expect(latinGrammaticalPreview(["noun · nominative · singular · masculine"], "noun")).toBe("Nom S M");
    expect(latinGrammaticalPreview(["noun · genitive · plural · feminine"], "noun")).toBe("Gen P F");
    expect(latinGrammaticalPreview(["noun · dative · singular · neuter"], "noun")).toBe("Dat S N");
    expect(latinGrammaticalPreview(["noun · accusative · plural · neuter"], "noun")).toBe("Acc P N");
    expect(latinGrammaticalPreview(["noun · ablative · singular · masculine"], "noun")).toBe("Abl S M");
    expect(latinGrammaticalPreview(["noun · vocative · plural · feminine"], "noun")).toBe("Voc P F");
    expect(latinGrammaticalPreview(["adjective · nominative · singular · common gender · comparative"], "adjective")).toBe("Nom S M/F");
  });

  it("renders Latin verb tense, person-number, voice, and mood in that order", () => {
    expect(latinGrammaticalPreview(["verb · present · active · indicative · third person · plural"], "verb")).toBe("Pres 3P Act Ind");
    expect(latinGrammaticalPreview(["verb · imperfect · passive · subjunctive · first person · singular"], "verb")).toBe("Impf 1S Pass Sub");
    expect(latinGrammaticalPreview(["verb · perfect · active · indicative · second person · singular"], "verb")).toBe("Perf 2S Act Ind");
    expect(latinGrammaticalPreview(["verb · future perfect · passive · indicative · third person · singular"], "verb")).toBe("Fut Perf 3S Pass Ind");
    expect(latinGrammaticalPreview(["verb · pluperfect · active · subjunctive · first person · plural"], "verb")).toBe("Plup 1P Act Sub");
    expect(latinGrammaticalPreview(["verb · future · active · indicative · second person · plural"], "verb")).toBe("Fut 2P Act Ind");
  });

  it("keeps ambiguous Latin forms separate and never mixes noun/supine interpretations", () => {
    expect(latinGrammaticalPreview([
      "noun · accusative · singular · masculine",
      "supine · accusative · singular · neuter",
      "noun · nominative · singular · masculine",
    ], "noun")).toBe("Acc S M / Nom S M");
    expect(latinGrammaticalPreview([
      "verb · present · active · indicative · third person · plural",
      "verb · future · passive · subjunctive · first person · singular",
    ], "verb")).toBe("Pres 3P Act Ind / Fut 1S Pass Sub");
    expect(latinGrammaticalPreview([
      "noun · nominative · singular · feminine",
      "noun · genitive · singular · feminine",
      "noun · dative · singular · feminine",
      "noun · accusative · singular · feminine",
      "noun · vocative · singular · feminine",
    ], "noun")).toBe("Nom S F / Gen S F / Dat S F / +2 more");
    expect(latinGrammaticalPreview(["supine · accusative · singular · neuter"], "noun")).toBeNull();
    expect(latinGrammaticalPreview(["noun · nominative · singular · masculine"], "verb")).toBeNull();
    expect(latinGrammaticalPreview([])).toBeNull();
  });

  it("keeps genuine lexical alternatives as separate choices", () => {
    const choices = distinctDictionaryChoices([
      { headword: "malum, -i n.", definition: "evil; misfortune", source: "Whitaker's Words Online" },
      { headword: "malum, -i n.", definition: "apple", source: "Whitaker's Words Online" },
      { headword: "mălum", definition: "apple", source: "Another source entry" },
    ]);

    expect(choices).toHaveLength(3);
    expect(choices.map((choice) => choice.definition)).toContain("evil; misfortune");
    expect(choices.map((choice) => choice.definition)).toContain("apple");
  });

  it("builds stable language-specific flashcards from saved lexical entries", () => {
    const entries: TranslationVocabEntry[] = [{
      id: "entry-123",
      language: "latin",
      surfaceForm: "amavit",
      headword: "amo, amare, amavi, amatus",
      definition: "love; like",
      source: "Whitaker's Words Online",
      sourceRef: "latin-words.com",
      createdAt: "2026-10-08T18:00:00Z",
      updatedAt: "2026-10-08T18:00:00Z",
    }];

    const deck = translationVocabDeck(entries, "latin");
    expect(deck.id).toBe("translation-helper-vocab-latin");
    expect(deck.title).toBe("Translation Helper Vocab");
    expect(deck.supportsReverse).toBe(true);
    expect(deck.cards[0]).toMatchObject({
      id: "entry-123",
      deckId: "translation-helper-vocab-latin",
      front: "amo, amare, amavi, amatus",
      back: "love; like",
      source: "Whitaker's Words Online",
      metadata: {
        translationVocab: true,
        surfaceForm: "amavit",
        audioDisabled: true,
      },
    });
  });

  it("wires the saved-vocabulary chooser and separate decks into both study apps", () => {
    const helper = fs.readFileSync("src/pages/translation-helper-page.tsx", "utf8");
    const greek = fs.readFileSync("src/pages/greek-page-v2.tsx", "utf8");
    const latin = fs.readFileSync("src/pages/latin-page.tsx", "utf8");
    const repository = fs.readFileSync("src/features/translation/translation-vocab-repository.ts", "utf8");
    const migration = fs.readFileSync("supabase/migrations/0009_translation_vocab_cards.sql", "utf8");
    const privacy = fs.readFileSync("public/privacy/index.html", "utf8");

    expect(helper).toContain("TranslationVocabSaver");
    expect(greek).toContain('useTranslationVocabStudy("greek"');
    expect(greek).toContain("<TranslationVocabDeckFilter study={translationVocab} />");
    expect(latin).toContain('useTranslationVocabStudy("latin"');
    expect(latin).toContain("<TranslationVocabDeckFilter study={translationVocab} />");
    expect(repository).toContain('.from("translation_vocab_cards")');
    expect(repository).toContain('onConflict: "user_id,language,headword,definition,source"');
    expect(migration).toContain("create table public.translation_vocab_cards");
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("users read their own translation vocab");
    expect(migration).toContain("users create their own translation vocab");
    expect(migration).toContain("users update their own translation vocab");
    expect(migration).toContain("users delete their own translation vocab");
    expect(privacy).toContain("Translation Helper vocabulary");
  });
});
