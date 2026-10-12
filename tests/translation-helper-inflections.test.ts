import { describe, expect, it } from "vitest";
import { buildGreekTranslationIndex, lookupDictionaryWord } from "../src/features/translation/dictionary-sources";
import type { DeckDefinition, StudyCard } from "../src/features/study/types";

function vocabularyCard(id: string, front: string, back: string, partOfSpeech: string): StudyCard {
  return {
    id,
    deckId: "alpha-omega-lesson12-vocab",
    front,
    back,
    source: "From Alpha to Omega, Lesson 12",
    metadata: { partOfSpeech, sourceRef: "Groton vocabulary" },
  };
}

function grammarCard(id: string, category: string, columns: string[], rows: Array<{ label: string; cells: string[] }>): StudyCard {
  return {
    id,
    deckId: "alpha-omega-test-grammar",
    front: category,
    back: category,
    category,
    source: "From Alpha to Omega",
    metadata: { grammarGroup: category, chartColumns: columns, chartRows: rows, sourceRef: "Groton grammar" },
  };
}

const vocabularyDeck: DeckDefinition = {
  id: "alpha-omega-lesson12-vocab",
  slug: "greek",
  title: "Groton vocabulary",
  eyebrow: "Vocabulary",
  description: "Synthetic Groton vocabulary for translation-helper morphology tests.",
  language: "greek",
  supportsReverse: true,
  cards: [
    vocabularyCard("logos", "λόγος, -ου, ὁ", "word, speech, story, argument, reasoning", "noun"),
    vocabularyCard("neanias", "νεᾱνίᾱς, -ου, ὁ", "young man", "noun"),
    vocabularyCard("makros", "μακρός, -ᾱ́, -όν", "long, long-lasting", "adjective"),
    vocabularyCard("trepo", "τρέπω, τρέψω", "turn", "verb"),
    vocabularyCard("pheugo", "φεύγω, φεύξω", "flee", "verb"),
    vocabularyCard("speudo", "σπεύδω, σπεύσω", "hasten", "verb"),
    vocabularyCard("alla", "ἀλλά", "but", "conjunction"),
  ],
};

const grammarDeck: DeckDefinition = {
  id: "alpha-omega-test-grammar",
  slug: "greek",
  title: "Groton grammar",
  eyebrow: "Grammar",
  description: "Synthetic Groton ending charts for translation-helper morphology tests.",
  language: "greek",
  supportsReverse: false,
  cards: [
    grammarCard("second-declension-masc", "Second Declension Masculine Endings", ["Singular", "Plural"], [
      { label: "Nominative", cells: ["-ος", "-οι"] },
      { label: "Genitive", cells: ["-ου", "-ων"] },
      { label: "Dative", cells: ["-ῳ", "-οις"] },
      { label: "Accusative", cells: ["-ον", "-ους"] },
      { label: "Vocative", cells: ["-ε", "-οι"] },
    ]),
    grammarCard("first-declension-masc", "First Declension Masculine Endings — η/ᾱ-stems", ["η-stem Singular", "ᾱ-stem Singular", "Plural"], [
      { label: "Nominative", cells: ["-ης", "-ᾱς", "-αι"] },
      { label: "Genitive", cells: ["-ου", "-ου", "-ων"] },
      { label: "Dative", cells: ["-ῃ", "-ᾳ", "-αις"] },
      { label: "Accusative", cells: ["-ην", "-ᾱν", "-ᾱς"] },
      { label: "Vocative", cells: ["-α/-η", "-ᾱ", "-αι"] },
    ]),
    grammarCard("adjective-masc", "First/Second Declension Adjective Endings — Masculine", ["Singular", "Plural"], [
      { label: "Nominative", cells: ["-ος", "-οι"] },
      { label: "Genitive", cells: ["-ου", "-ων"] },
      { label: "Dative", cells: ["-ῳ", "-οις"] },
      { label: "Accusative", cells: ["-ον", "-ους"] },
      { label: "Vocative", cells: ["-ε", "-οι"] },
    ]),
    grammarCard("adjective-fem", "First/Second Declension Adjective Endings — Feminine", ["Singular after ε, ι, ρ", "Singular otherwise", "Plural"], [
      { label: "Nominative", cells: ["-ᾱ", "-η", "-αι"] },
      { label: "Genitive", cells: ["-ᾱς", "-ης", "-ων"] },
      { label: "Dative", cells: ["-ᾳ", "-ῃ", "-αις"] },
      { label: "Accusative", cells: ["-ᾱν", "-ην", "-ᾱς"] },
      { label: "Vocative", cells: ["-ᾱ", "-η", "-αι"] },
    ]),
    grammarCard("adjective-neut", "First/Second Declension Adjective Endings — Neuter", ["Singular", "Plural"], [
      { label: "Nominative", cells: ["-ον", "-α"] },
      { label: "Genitive", cells: ["-ου", "-ων"] },
      { label: "Dative", cells: ["-ῳ", "-οις"] },
      { label: "Accusative", cells: ["-ον", "-α"] },
      { label: "Vocative", cells: ["-ον", "-α"] },
    ]),
    grammarCard("present-active", "Present Active Indicative Endings", ["Singular", "Plural"], [
      { label: "1st person", cells: ["-ω", "-ομεν"] },
      { label: "2nd person", cells: ["-εις", "-ετε"] },
      { label: "3rd person", cells: ["-ει", "-ουσι(ν)"] },
    ]),
    grammarCard("future-middle-inf", "Future Middle Infinitive Endings", ["Ending"], [
      { label: "Future Middle Infinitive", cells: ["-σεσθαι"] },
    ]),
    grammarCard("imperfect-middle", "Imperfect Middle/Passive Indicative Endings", ["Singular", "Plural"], [
      { label: "1st person", cells: ["-όμην", "-όμεθα"] },
      { label: "2nd person", cells: ["-ου", "-εσθε"] },
      { label: "3rd person", cells: ["-ετο", "-οντο"] },
    ]),
    grammarCard("article-masc-pl", "Masculine Definite Article — Plural", ["Greek"], [
      { label: "Nominative", cells: ["οἱ"] },
      { label: "Genitive", cells: ["τῶν"] },
      { label: "Dative", cells: ["τοῖς"] },
      { label: "Accusative", cells: ["τούς"] },
    ]),
  ],
};

describe("Greek Translation Helper inflection coverage", () => {
  const index = buildGreekTranslationIndex([vocabularyDeck], [grammarDeck]);

  it("resolves declined nouns and adjectives from Groton ending charts", () => {
    expect(lookupDictionaryWord(index, "λόγοι")[0]?.headword).toContain("λόγος");
    expect(lookupDictionaryWord(index, "λόγους")[0]?.headword).toContain("λόγος");
    expect(lookupDictionaryWord(index, "νεανίου")[0]?.headword).toContain("νεᾱνίᾱς");
    expect(lookupDictionaryWord(index, "μακρὰ")[0]?.headword).toContain("μακρός");
  });

  it("resolves regular verb forms using the currently registered Groton charts", () => {
    expect(lookupDictionaryWord(index, "ἐτρέπετο")[0]?.headword).toContain("τρέπω");
    expect(lookupDictionaryWord(index, "φεύξεσθαι")[0]?.headword).toContain("φεύγω");
    expect(lookupDictionaryWord(index, "σπεύδετε")[0]?.headword).toContain("σπεύδω");
  });

  it("indexes definite-article forms and common elisions used in connected text", () => {
    expect(lookupDictionaryWord(index, "τοὺς")[0]?.definition).toContain("definite article");
    expect(lookupDictionaryWord(index, "ἀλλ")[0]?.headword).toBe("ἀλλά");
  });
});
