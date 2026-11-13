import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildGreekTranslationIndex, lookupDictionaryWord, normalizeDictionaryKey,
} from "../src/features/translation/dictionary-sources";
import type { DeckDefinition, StudyCard } from "../src/features/study/types";

type Vocab = {
  id: string; greek: string; meaning: string; part_of_speech: string;
  source_ref?: string; third_principal_part?: string;
};
type Grammar = {
  id: string; prompt: string; category: string; rows: { label: string; cells: string[] }[];
  columns: string[]; source_ref?: string;
};
const lessons = Array.from({ length: 17 }, (_, i) => i + 3);
const read = <T>(p: string): T => JSON.parse(fs.readFileSync(p, "utf8")) as T;
const vocabulary = lessons.map((n) => ({
  n, cards: read<Vocab[]>("public/data/greek-lesson" + n + "-vocab.json"),
}));
const grammar = lessons.filter((n) => fs.existsSync("public/data/greek-lesson" + n + "-grammar.json"))
  .map((n) => ({ n, cards: read<Grammar[]>("public/data/greek-lesson" + n + "-grammar.json") }));

function asVocabDeck(n: number, entries: Vocab[]): DeckDefinition {
  const id = "alpha-omega-lesson" + n + "-vocab";
  return {
    id, title: "Groton " + n, eyebrow: "Vocabulary", description: "Source-backed index verification",
    language: "greek", slug: "greek", supportsReverse: true,
    cards: entries.map((entry): StudyCard => ({
      id: entry.id, deckId: id, front: entry.greek, back: entry.meaning,
      source: "From Alpha to Omega, Lesson " + n,
      metadata: {
        partOfSpeech: entry.part_of_speech, sourceRef: entry.source_ref,
        thirdPrincipalPart: entry.third_principal_part,
      },
    })),
  };
}
function asGrammarDeck(n: number, entries: Grammar[]): DeckDefinition {
  const id = "alpha-omega-lesson" + n + "-grammar";
  return {
    id, title: "Groton " + n, eyebrow: "Grammar", description: "Source-backed index verification",
    language: "greek", slug: "greek", supportsReverse: false,
    cards: entries.map((entry): StudyCard => ({
      id: entry.id, deckId: id, front: entry.prompt, back: entry.category,
      source: "From Alpha to Omega, Lesson " + n, category: entry.category,
      metadata: {
        grammarGroup: entry.category, chartColumns: entry.columns,
        chartRows: entry.rows, sourceRef: entry.source_ref,
      },
    })),
  };
}
const index = buildGreekTranslationIndex(
  vocabulary.map(({ n, cards }) => asVocabDeck(n, cards)),
  grammar.map(({ n, cards }) => asGrammarDeck(n, cards)),
);
const byId = new Map(vocabulary.flatMap(({ n, cards }) => cards.map((x) => [x.id, { ...x, n }] as const)));

function matchesVocabulary(word: string, id: string, fragment?: string) {
  const target = byId.get(id);
  expect(target, "missing vocab " + id).toBeDefined();
  return lookupDictionaryWord(index, word).some((candidate) =>
    candidate.headword === target?.greek &&
    candidate.definition === target?.meaning &&
    (!fragment || candidate.morphology?.some((m) => m.includes(fragment))));
}

describe("Groton Translation Helper coverage through Lesson 19", () => {
  it("loads the entire 17-lesson vocabulary inventory (3–19) without dropping any lemma", () => {
    expect(vocabulary.map((x) => x.n)).toEqual(lessons);
    let words = 0;
    for (const { cards } of vocabulary) for (const card of cards) {
      const lemma = card.greek.match(/[\p{Script=Greek}\p{M}]+/u)?.[0];
      expect(lemma, card.id).toBeTruthy();
      expect(matchesVocabulary(lemma!, card.id), card.id + ": " + lemma).toBe(true);
      words++;
    }
    expect(words).toBeGreaterThan(120);
  });

  it("recognizes every new Lesson 19 word and all explicitly listed principal parts", () => {
    const lesson19 = vocabulary.find((x) => x.n === 19)?.cards ?? [];
    expect(lesson19).toHaveLength(11);
    for (const entry of lesson19) {
      const tokens = entry.greek.split(",").slice(0, entry.part_of_speech === "verb" ? 3 : 1);
      for (const segment of tokens) {
        const word = segment.match(/[\p{Script=Greek}\p{M}]+/u)?.[0];
        if (word) expect(matchesVocabulary(word, entry.id), entry.id + " " + word).toBe(true);
      }
    }
    expect(matchesVocabulary("ἔλαβον", "lesson19-v1")).toBe(true);
    expect(matchesVocabulary("ἔμεινα", "lesson19-v2")).toBe(true);
  });

  it("uses strong aorist stems to index indicative, infinitive, imperative, and middle forms", () => {
    const sample = [
      ["ἔλαβες", "lesson19-v1", "Second Aorist Active Indicative"],
      ["ἔλαβον", "lesson19-v1", "Second Aorist Active Indicative"],
      ["ἔλαβεν", "lesson19-v1", "Second Aorist Active Indicative"],
      ["λαβεῖν", "lesson19-v1", "Second Aorist Active Infinitive"],
      ["λαβέ", "lesson19-v1", "Second Aorist Active Imperative"],
      ["λαβόντων", "lesson19-v1", "Second Aorist Active Imperative"],
      ["λαβέσθαι", "lesson19-v1", "Second Aorist Middle Infinitive"],
      ["ἐλαβόμην", "lesson19-v1", "Second Aorist Middle Indicative"],
      ["ἔφυγε", "lesson10-v3", "Second Aorist Active Indicative"],
      ["φυγεῖν", "lesson10-v3", "Second Aorist Active Infinitive"],
      ["ἔβαλεν", "lesson15-v2", "Second Aorist Active Indicative"],
      ["βαλεῖν", "lesson15-v2", "Second Aorist Active Infinitive"],
      ["ἔλιπες", "lesson8-v2", "Second Aorist Active Indicative"],
      ["λιπεῖν", "lesson8-v2", "Second Aorist Active Infinitive"],
      ["εἰπεῖν", "lesson10-v1", "Second Aorist Active Infinitive"],
      ["εὑρεῖν", "lesson8-v1", "Second Aorist Active Infinitive"],
      ["ἐνεγκεῖν", "lesson14-v2", "Second Aorist Active Infinitive"],
      ["σχεῖν", "lesson6-v3", "Second Aorist Active Infinitive"],
    ] as const;
    for (const [form, id, mood] of sample) expect(matchesVocabulary(form, id, mood), form + " → " + id).toBe(true);
  });

  it("uses Lesson 18 first-aorist charts for earlier taught verbs", () => {
    const sample = [
      ["ἐπαίδευσας", "lesson3-v5", "First Aorist Active Indicative"],
      ["παιδεῦσαι", "lesson3-v5", "First Aorist Active Infinitive"],
      ["ἐπαίδευσε", "lesson3-v5", "First Aorist Active Indicative"],
      ["ἔγραψαν", "lesson3-v1", "First Aorist Active Indicative"],
      ["γράψαι", "lesson3-v1", "First Aorist Active Infinitive"],
      ["μεῖναι", "lesson19-v2", "First Aorist Active Infinitive"],
      ["μείνατε", "lesson19-v2", "First Aorist Active Imperative"],
    ] as const;
    for (const [form, id, mood] of sample) expect(matchesVocabulary(form, id, mood), form + " → " + id).toBe(true);
  });

  it("indexes source-chart sigma-stem and third-declension adjective cases, plus Lesson 19 nouns", () => {
    const examples = [
      ["τείχους", "lesson17-v5"], ["τείχη", "lesson17-v5"],
      ["τριήρεις", "lesson17-v6"], ["Σωκράτους", "lesson17-v4"],
      ["γέρω", "lesson17-v2"], ["αἰδοῖ", "lesson17-v1"],
      ["δαιμόνων", "lesson17-v3"], ["ἀληθεῖς", "lesson17-v7"],
      ["εὐδαίμονας", "lesson17-v8"], ["αἰτίαις", "lesson19-v3"],
      ["αἰτίᾳ", "lesson19-v3"], ["αἰτίων", "lesson19-v9"],
    ] as const;
    for (const [form, id] of examples)
      expect(matchesVocabulary(form, id), "missing declined form " + form + " → " + id).toBe(true);
  });

  it("indexes every singular/plural gender/case reflexive form and multiword components", () => {
    const pronouns = grammar.find((x) => x.n === 19)?.cards.filter((x) => x.category.includes("Reflexive Pronoun")) ?? [];
    expect(pronouns).toHaveLength(3);
    for (const chart of pronouns) {
      for (const row of chart.rows) row.cells.forEach((cell, column) => {
        const forms = cell.split(/\s*\/\s*/u).map((x) => x.trim());
        for (const form of forms) {
          const matches = lookupDictionaryWord(index, form);
          const morphology = [chart.category, row.label, chart.columns[column]];
          expect(matches.some((m) =>
            morphology.every((fragment) => m.morphology?.[0]?.includes(fragment))),
            "missing source form " + form + " in " + chart.id).toBe(true);
          const components = form.match(/[\p{Script=Greek}\p{M}]+/gu) ?? [];
          if (components.length > 1) for (const component of components) {
            expect(lookupDictionaryWord(index, component).some((m) =>
              morphology.every((fragment) => m.morphology?.[0]?.includes(fragment))),
              "missing clickable part " + component + " of " + form).toBe(true);
          }
        }
      });
    }
    expect(matchesVocabulary("σαυτῷ", "lesson19-v7", "Singular · Dative")).toBe(true);
    expect(matchesVocabulary("ἑαυταῖς", "lesson19-v4", "Plural · Dative")).toBe(true);
    expect(matchesVocabulary("ἡμᾶς", "lesson19-v6", "Plural · Accusative")).toBe(true);
  });

  it("uses source-backed morphology and does not invent a second aorist for verbs without a listed principal part", () => {
    expect(lookupDictionaryWord(index, "λαβεῖν").some((x) => x.sourceRef?.includes("Groton 19.115"))).toBe(true);
    expect(lookupDictionaryWord(index, "τείχους").some((x) => x.sourceRef?.includes("Groton 17.103"))).toBe(true);
    expect(matchesVocabulary("εἰπεῖν", "lesson10-v1")).toBe(true);
    // ἔσομαι is a future of εἰμί, not a second-aorist principal part.
    expect(lookupDictionaryWord(index, "εσομεν").some((x) => x.morphology?.some((m) => m.includes("Second Aorist")))).toBe(false);
    expect(index.size).toBeGreaterThan(500);
    expect(normalizeDictionaryKey("μείνατε")).toBe(normalizeDictionaryKey("μείνατε"));
  });
});
