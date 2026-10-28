import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { buildGreekTranslationIndex, lookupDictionaryWord, normalizeDictionaryKey } from "../src/features/translation/dictionary-sources";
import type { DeckDefinition, StudyCard } from "../src/features/study/types";

type WordSource = { id: string; greek: string; meaning: string; part_of_speech: string; source_ref: string };
type FormSource = { id: string; category: string; prompt: string; source_ref: string; columns: string[]; rows: Array<{ label: string; cells: string[] }> };

function vocabulary(lesson: number): DeckDefinition {
  const id = `alpha-omega-lesson${lesson}-vocab`;
  const data = JSON.parse(fs.readFileSync(`public/data/greek-lesson${lesson}-vocab.json`, "utf8")) as WordSource[];
  return {
    id, slug: "greek", title: `Lesson ${lesson}`, eyebrow: "Vocabulary",
    description: "Test source vocabulary", language: "greek", supportsReverse: true,
    cards: data.map(({ id: cardId, greek, meaning, part_of_speech, source_ref }): StudyCard => ({
      id: cardId, deckId: id, front: greek, back: meaning,
      source: `From Alpha to Omega, Lesson ${lesson}`,
      metadata: { partOfSpeech: part_of_speech, sourceRef: source_ref },
    })),
  };
}

function grammar(lesson: number): DeckDefinition {
  const id = `alpha-omega-lesson${lesson}-grammar`;
  const data = JSON.parse(fs.readFileSync(`public/data/greek-lesson${lesson}-grammar.json`, "utf8")) as FormSource[];
  return {
    id, slug: "greek", title: `Lesson ${lesson}`, eyebrow: "Grammar",
    description: "Test source charts", language: "greek", supportsReverse: false,
    cards: data.map(({ id: cardId, category, prompt, columns, rows, source_ref }): StudyCard => ({
      id: cardId, deckId: id, front: prompt, back: category, category,
      source: `From Alpha to Omega, Lesson ${lesson}`,
      metadata: { grammarGroup: category, chartColumns: columns, chartRows: rows, sourceRef: source_ref },
    })),
  };
}

describe("Greek Translation Helper: Groton Lessons 13–14", () => {
  const words13 = vocabulary(13);
  const words14 = vocabulary(14);
  const forms13 = grammar(13);
  const forms14 = grammar(14);
  const index = buildGreekTranslationIndex([words13, words14], [forms14, forms13, grammar(3), grammar(6), grammar(8), grammar(11)]);

  it("looks up every new vocabulary lemma without losing the Groton source", () => {
    for (const card of [...words13.cards, ...words14.cards]) {
      const lemma = card.front.match(/[\p{Script=Greek}\p{M}]+/u)?.[0];
      expect(lemma, card.id).toBeTruthy();
      const matches = lookupDictionaryWord(index, lemma!);
      expect(matches.some((match) => match.headword === card.front && match.definition === card.back && match.sourceRef === card.metadata?.sourceRef), card.id).toBe(true);
    }
  });

  it("indexes every case, number, gender and variant from all nine Groton pronoun/demonstrative charts", () => {
    expect(forms13.cards).toHaveLength(6);
    expect(forms14.cards).toHaveLength(3);
    let checked = 0;
    for (const chart of [...forms13.cards, ...forms14.cards]) {
      const columns = chart.metadata?.chartColumns as string[];
      const rows = chart.metadata?.chartRows as FormSource["rows"];
      const group = String(chart.metadata?.grammarGroup);
      for (const row of rows) {
        row.cells.forEach((cell, colIndex) => {
          const expectedLemma = group.startsWith("First-Person")
            ? (columns[colIndex] === "Singular" ? "ἐγώ" : "ἡμεῖς")
            : group.startsWith("Second-Person")
              ? (columns[colIndex] === "Singular" ? "σύ" : "ὑμεῖς")
              : group.match(/[\p{Script=Greek}\p{M}]+/u)?.[0];
          expect(expectedLemma, group).toBeTruthy();
          const expectedKey = normalizeDictionaryKey(expectedLemma!);
          for (const form of cell.split("/").map((value) => value.trim())) {
            const matches = lookupDictionaryWord(index, form);
            const matching = matches.find((match) =>
              normalizeDictionaryKey(match.headword.match(/[\p{Script=Greek}\p{M}]+/u)?.[0] ?? "") === expectedKey &&
              match.morphology?.some((description) =>
                description.includes(group) && description.includes(row.label) && description.includes(columns[colIndex])));
            expect(matching, `${chart.id}: ${form} (${row.label}, ${columns[colIndex]})`).toBeDefined();
            expect(matching?.sourceRef).toContain(String(chart.metadata?.sourceRef));
            checked += 1;
          }
        });
      }
    }
    expect(checked).toBeGreaterThan(100);
    const combined = forms14.cards.find(card => card.id === "lesson14-chart-autos-singular-forms");
    expect(combined?.metadata?.chartRows).toHaveLength(8);
    expect(combined?.metadata?.chartColumns).toEqual(["Masculine", "Feminine", "Neuter"]);
    const singular = lookupDictionaryWord(index, "αὐτῷ").find(match => match.morphology?.some(value => value.includes("Singular · Dative")));
    const plural = lookupDictionaryWord(index, "αὐτοῖς").find(match => match.morphology?.some(value => value.includes("Plural · Dative")));
    expect(singular?.headword).toContain("αὐτός");
    expect(plural?.headword).toContain("αὐτός");
  });

  it("recognizes the specific pronominal and demonstrative forms from the exercise page", () => {
    const samples: Array<[string, string, string]> = [
      ["ἡμῖν", "ἡμεῖς", "Dative"],
      ["ὑμᾶς", "ὑμεῖς", "Accusative"],
      ["ὑμῖν", "ὑμεῖς", "Dative"],
      ["ἐμοί", "ἐγώ", "Dative"],
      ["ἔμοιγ᾽", "ἐγώ", "Dative"],
      ["μοι", "ἐγώ", "Dative"],
      ["σοῦ", "σύ", "Genitive"],
      ["σε", "σύ", "Accusative"],
      ["αὐτοῖς", "αὐτός", "Dative"],
      ["αὐτήν", "αὐτός", "Accusative"],
      ["τῇδε", "ὅδε", "Dative"],
      ["ἐκεῖνοι", "ἐκεῖνος", "Nominative"],
      ["ἐκείνῳ", "ἐκεῖνος", "Dative"],
      ["ταῦτα", "οὗτος", "Nominative"],
    ];
    for (const [form, lemma, grammaticalCase] of samples) {
      const expected = normalizeDictionaryKey(lemma);
      expect(lookupDictionaryWord(index, form).some((match) =>
        normalizeDictionaryKey(match.headword.match(/[\p{Script=Greek}\p{M}]+/u)?.[0] ?? "") === expected &&
        match.morphology?.some((value) => value.includes(grammaticalCase))), `${form} → ${lemma}`).toBe(true);
    }
  });

  it("recognizes new verbs, the explicit Groton compound and their regular source-chart forms", () => {
    const examples: Array<[string, string]> = [
      ["πλήττεσθαι", "πλήττω"],
      ["οἴσουσιν", "φέρω"],
      ["ἐπιπλήττω", "ἐπιπλήττω"],
      ["ἐπιπλήττετε", "ἐπιπλήττω"],
      ["βλέψομαι", "βλέπω"],
    ];
    for (const [form, lemma] of examples) {
      expect(lookupDictionaryWord(index, form).some((match) =>
        normalizeDictionaryKey(match.headword.match(/[\p{Script=Greek}\p{M}]+/u)?.[0] ?? "") === normalizeDictionaryKey(lemma)), `${form} → ${lemma}`).toBe(true);
    }
  });

  it("inflects newly entered Groton nouns with existing Groton endings", () => {
    for (const [form, lemma] of [["βιβλία", "βιβλίον"], ["ἱμάτια", "ἱμάτιον"], ["βιβλίου", "βιβλίον"]]) {
      expect(lookupDictionaryWord(index, form).some((match) =>
        normalizeDictionaryKey(match.headword.match(/[\p{Script=Greek}\p{M}]+/u)?.[0] ?? "") === normalizeDictionaryKey(lemma)), form).toBe(true);
    }
  });
});
