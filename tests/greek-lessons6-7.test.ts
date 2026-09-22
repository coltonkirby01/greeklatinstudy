import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { hasAmbiguousGreekTonos } from "../src/features/greek/greek-orthography";

type Vocabulary = {
  id: string;
  greek: string;
  lesson: number;
  source_ref: string;
  part_of_speech: string;
  second_principal_part?: string;
};
type Chart = {
  id: string;
  category: string;
  prompt: string;
  source_ref: string;
  columns: string[];
  row_header_label?: string;
  rows: Array<{ label: string; cells: string[] }>;
};
const readVocab = (lesson: number) => JSON.parse(fs.readFileSync(`public/data/greek-lesson${lesson}-vocab.json`, "utf8")) as Vocabulary[];
const readGrammar = (lesson: number) => JSON.parse(fs.readFileSync(`public/data/greek-lesson${lesson}-grammar.json`, "utf8")) as Chart[];
const byId = <T extends { id: string }>(cards: T[], id: string) => {
  const card = cards.find((entry) => entry.id === id);
  if (!card) throw new Error(`Missing ${id}`);
  return card;
};

describe("Groton Lessons 6–7", () => {
  it("preserves the existing 11 earlier verb cards and supplies their p. 32 second principal parts", () => {
    const expected: Record<string, string> = {
      "lesson3-v1": "γράψω",
      "lesson3-v2": "ἐθελήσω",
      "lesson3-v3": "θῡ́σω",
      "lesson3-v4": "κλέψω",
      "lesson3-v5": "παιδεύσω",
      "lesson3-v6": "σπεύσω",
      "lesson3-v7": "φυλάξω",
      "lesson4-v1": "πέμψω",
      "lesson5-v1": "ἀκούσομαι",
      "lesson5-v2": "βλάψω",
      "lesson5-v3": "κελεύσω",
    };
    const earlier = [3, 4, 5].flatMap(readVocab);
    const augmented = earlier.filter((card) => card.second_principal_part);
    expect(augmented).toHaveLength(11);
    expect(Object.fromEntries(augmented.map((card) => [card.id, card.second_principal_part]))).toEqual(expected);
    expect(augmented.every((card) => card.part_of_speech === "verb")).toBe(true);
    expect(earlier.map((card) => card.id)).toEqual([
      ...Array.from({ length: 11 }, (_, index) => `lesson3-v${index + 1}`),
      ...Array.from({ length: 11 }, (_, index) => `lesson4-v${index + 1}`),
      ...Array.from({ length: 10 }, (_, index) => `lesson5-v${index + 1}`),
    ]);
  });

  it("has eleven Lesson 6 and twelve Lesson 7 vocabulary entries in Groton's order", () => {
    const lesson6 = readVocab(6);
    const lesson7 = readVocab(7);
    expect(lesson6).toHaveLength(11);
    expect(lesson7).toHaveLength(12);
    expect(lesson6.map((card) => card.greek)).toEqual([
      "ἀλλάττω, ἀλλάξω",
      "διώκω, διώξω",
      "ἔχω, ἕξω/σχήσω",
      "μέλλω, μελλήσω",
      "κόρη, -ης, ἡ",
      "οἰκίᾱ, -ᾱς, ἡ",
      "ἔτι",
      "μηκέτι",
      "οὐκέτι",
      "πάλιν",
      "ἀλλά (ἀλλ’)",
    ]);
    expect(lesson7.map((card) => card.greek)).toEqual([
      "χαίρω, χαιρήσω",
      "ἀδελφή, -ῆς, ἡ",
      "ἀδελφός, -οῦ, ὁ",
      "ἄνθρωπος, -ου, ὁ, ἡ",
      "θεός, -οῦ, ὁ, ἡ",
      "ἵππος, -ου, ὁ, ἡ",
      "λίθος, -ου, ὁ",
      "λύπη, -ης, ἡ",
      "ὁδός, -οῦ, ἡ",
      "ποταμός, -οῦ, ὁ",
      "χαρά, -ᾶς, ἡ",
      "ἀπό (ἀπ’, ἀφ’)",
    ]);
    expect(lesson6.every((card) => card.source_ref === "Groton 6.40, pp. 33–34")).toBe(true);
    expect(lesson7.every((card) => card.source_ref === "Groton 7.47, pp. 39–40")).toBe(true);
    expect(new Set([...lesson6, ...lesson7].map((card) => card.id)).size).toBe(23);
  });

  it("contains future active indicative and infinitive ending and παιδεύω paradigm cards", () => {
    const lesson6 = readGrammar(6);
    expect(lesson6).toHaveLength(5);
    expect(lesson6.map((card) => card.category)).toEqual([
      "Future Active Indicative Endings",
      "Future Active Infinitive Endings",
      "Future Active Indicative",
      "Future Active Infinitive",
      "Letter Changes",
    ]);
    expect(byId(lesson6, "lesson6-chart-future-active-indicative-endings").rows).toEqual([
      { label: "1st person", cells: ["-σω", "-σομεν"] },
      { label: "2nd person", cells: ["-σεις", "-σετε"] },
      { label: "3rd person", cells: ["-σει", "-σουσι(ν)"] },
    ]);
    expect(byId(lesson6, "lesson6-chart-future-active-infinitive-endings").rows)
      .toEqual([{ label: "Future Active Infinitive", cells: ["-σειν"] }]);
    expect(byId(lesson6, "lesson6-chart-future-active-indicative").rows).toEqual([
      { label: "1st person", cells: ["παιδεύ - σω", "παιδεύ - σομεν"] },
      { label: "2nd person", cells: ["παιδεύ - σεις", "παιδεύ - σετε"] },
      { label: "3rd person", cells: ["παιδεύ - σει", "παιδεύ - σουσι(ν)"] },
    ]);
    expect(byId(lesson6, "lesson6-chart-future-active-infinitive").rows)
      .toEqual([{ label: "Future Active Infinitive", cells: ["παιδεύ - σειν"] }]);
  });

  it("includes the exact Letter Changes card with the page 32 chart", () => {
    const changes = byId(readGrammar(6), "lesson6-chart-letter-changes");
    expect(changes.prompt).toBe("Letter Changes");
    expect(changes.row_header_label).toBe("Stem type");
    expect(changes.rows).toEqual([
      { label: "Labial", cells: ["π, β, φ + σ", "ψ"] },
      { label: "Palatal", cells: ["κ, γ, χ + σ", "ξ"] },
      { label: "Dental", cells: ["τ, δ, θ + σ", "σ (dental drops)"] },
      { label: "πτ", cells: ["πτ + σ", "ψ (τ drops)"] },
      { label: "ττ", cells: ["ττ + σ", "ξ (underlying palatal)"] },
    ]);
    expect(changes.source_ref).toBe("Groton 6.38, p. 32");
  });

  it("preserves second-declension endings, two model nouns, and both masculine article charts", () => {
    const lesson7 = readGrammar(7);
    expect(lesson7).toHaveLength(5);
    expect(lesson7.map((card) => card.id)).toEqual([
      "lesson7-chart-second-declension-masculine-endings",
      "lesson7-chart-second-declension-anthropos",
      "lesson7-chart-second-declension-potamos",
      "lesson7-chart-definite-article-masculine-singular",
      "lesson7-chart-definite-article-masculine-plural",
    ]);
    expect(lesson7[0].rows.map((row) => row.cells)).toEqual([
      ["-ος", "-οι"], ["-ου", "-ων"], ["-ῳ", "-οις"], ["-ον", "-ους"], ["-ε", "-οι"],
    ]);
    for (const model of lesson7.slice(1, 3)) {
      expect(model.rows).toHaveLength(5);
      expect(model.rows.every((row) => row.cells.length === 2 && row.cells.every((cell) => cell.includes(" - ")))).toBe(true);
    }
    expect(lesson7[3].rows.map((row) => row.cells[0])).toEqual(["ὁ", "τοῦ", "τῷ", "τόν"]);
    expect(lesson7[4].rows.map((row) => row.cells[0])).toEqual(["οἱ", "τῶν", "τοῖς", "τούς"]);
    expect(lesson7[3].rows).toHaveLength(4); // No vocative definite article.
    expect(lesson7[4].rows).toHaveLength(4);
  });

  it("uses polytonic rather than ambiguous modern tonos for new data", () => {
    for (const lesson of [6, 7]) {
      for (const kind of ["vocab", "grammar"]) {
        const path = `public/data/greek-lesson${lesson}-${kind}.json`;
        expect(hasAmbiguousGreekTonos(fs.readFileSync(path, "utf8")), path).toBe(false);
      }
    }
  });

  it("registers both lessons in shared study, exact selection, Stats, and future-agent policy", () => {
    const page = fs.readFileSync("src/pages/greek-page.tsx", "utf8");
    const loader = fs.readFileSync("src/data/builtin-decks.ts", "utf8");
    const registry = fs.readFileSync("src/features/study/builtin-study-catalog.ts", "utf8");
    const agents = fs.readFileSync("AGENTS.md", "utf8");
    for (const lesson of [6, 7]) {
      expect(page).toContain(`title="Lesson ${lesson}"`);
      expect(page).toContain(`lesson${lesson}VocabularyCards`);
      expect(page).toContain(`lesson${lesson}GrammarCards`);
      expect(page).toContain(`decks.lesson${lesson}Vocabulary`);
      expect(page).toContain(`decks.lesson${lesson}Grammar`);
      expect(registry).toContain(`id: "alpha-omega-lesson${lesson}-vocab"`);
      expect(registry).toContain(`id: "alpha-omega-lesson${lesson}-grammar"`);
      expect(loader).toContain(`loadGreekLesson${lesson}VocabularyDeck`);
      expect(loader).toContain(`loadGreekLesson${lesson}GrammarDeck`);
    }
    expect(page).toContain("lesson6EndingsKeys");
    expect(page).toContain("lesson6ParadigmKeys");
    expect(page).toContain("keys.letterChanges");
    expect(page).toContain("lesson7EndingsKeys");
    expect(page).toContain("lesson7ParadigmKeys");
    expect(page).toContain("lesson6-vocabulary");
    expect(page).toContain("lesson7-vocabulary");
    expect(agents).toContain("Lesson 6");
    expect(agents).toContain("Lesson 7");
  });
});
