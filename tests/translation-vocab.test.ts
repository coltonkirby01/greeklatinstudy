import fs from "node:fs";
import { describe, expect, it } from "vitest";
import type { DictionaryMatch } from "../src/features/translation/dictionary-sources";
import { comparisonPreview, definitionPreview, grammaticalPreview } from "../src/features/translation/translation-vocab-saver";
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

  it("limits collapsed English meaning headings to three words", () => {
    expect(definitionPreview("word, speech, story, argument, reasoning")).toBe("word, speech, story…");
    expect(definitionPreview("be in motion")).toBe("be in motion");
    expect(definitionPreview("land, country, countryside, space, position")).toBe("land, country, countryside…");
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
