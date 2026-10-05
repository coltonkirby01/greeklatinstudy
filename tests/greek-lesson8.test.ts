import fs from "node:fs";
import { describe, expect, it } from "vitest";
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

describe("Groton Lesson 8 expansion", () => {
  it("adds the eleven Lesson 8 vocabulary entries from Groton 8.56", () => {
    const cards = readJson<VocabCard[]>("public/data/greek-lesson8-vocab.json");

    expect(cards).toHaveLength(11);
    expect(cards.every((card) => card.lesson === 8 && card.source_ref === "Groton 8.56")).toBe(true);
    expect(cards.map(({ id, greek, meaning, part_of_speech }) => ({ id, greek, meaning, part_of_speech }))).toEqual([
      { id: "lesson8-v1", greek: "εὑρίσκω, εὑρήσω", meaning: "find, find out, discover", part_of_speech: "verb" },
      { id: "lesson8-v2", greek: "λείπω, λείψω", meaning: "leave, leave behind", part_of_speech: "verb" },
      { id: "lesson8-v3", greek: "βίος, -ου, ὁ", meaning: "life, lifetime, livelihood", part_of_speech: "noun" },
      { id: "lesson8-v4", greek: "δῶρον, -ου, τό", meaning: "gift", part_of_speech: "noun" },
      { id: "lesson8-v5", greek: "ἔργον, -ου, τό", meaning: "work, task, occupation, deed", part_of_speech: "noun" },
      { id: "lesson8-v6", greek: "θησαυρός, -οῦ, ὁ", meaning: "treasure, treasury, storehouse", part_of_speech: "noun" },
      { id: "lesson8-v7", greek: "τέκνον, -ου, τό", meaning: "child, offspring", part_of_speech: "noun" },
      { id: "lesson8-v8", greek: "φυτόν, -οῦ, τό", meaning: "plant, tree (something that is grown in a garden or an orchard)", part_of_speech: "noun" },
      { id: "lesson8-v9", greek: "ἀγαθός, -ή, -όν", meaning: "good (at doing something), brave, (morally) good, virtuous", part_of_speech: "adjective" },
      { id: "lesson8-v10", greek: "ἄξιος, -ᾱ, -ον", meaning: "(+ genitive or infinitive) worthy (of, to), deserving (of, to)", part_of_speech: "adjective" },
      { id: "lesson8-v11", greek: "καλός, -ή, -όν", meaning: "beautiful, handsome, fair (of appearance), (morally) good, fine, noble", part_of_speech: "adjective" },
    ]);
    expect(cards.some((card) => card.greek.startsWith("ἀπολείπω"))).toBe(false);
  });

  it("adds second-declension neuter endings and separate neuter article cards", () => {
    const cards = readJson<GrammarCard[]>("public/data/greek-lesson8-grammar.json");
    expect(cards).toHaveLength(6);

    expect(cards.find((card) => card.id === "lesson8-chart-second-declension-neuter-endings")?.rows).toEqual([
      { label: "Nominative", cells: ["-ον", "-α"] },
      { label: "Genitive", cells: ["-ου", "-ων"] },
      { label: "Dative", cells: ["-ῳ", "-οις"] },
      { label: "Accusative", cells: ["-ον", "-α"] },
      { label: "Vocative", cells: ["-ον", "-α"] },
    ]);

    expect(cards.find((card) => card.id === "lesson8-chart-definite-article-neuter-singular")?.rows).toEqual([
      { label: "Nominative", cells: ["τό"] },
      { label: "Genitive", cells: ["τοῦ"] },
      { label: "Dative", cells: ["τῷ"] },
      { label: "Accusative", cells: ["τό"] },
    ]);
    expect(cards.find((card) => card.id === "lesson8-chart-definite-article-neuter-plural")?.rows).toEqual([
      { label: "Nominative", cells: ["τά"] },
      { label: "Genitive", cells: ["τῶν"] },
      { label: "Dative", cells: ["τοῖς"] },
      { label: "Accusative", cells: ["τά"] },
    ]);
  });

  it("keeps first/second-declension adjective endings on one card per gender", () => {
    const cards = readJson<GrammarCard[]>("public/data/greek-lesson8-grammar.json");

    expect(cards.find((card) => card.id === "lesson8-chart-adjective-endings-masculine")?.rows).toEqual([
      { label: "Nominative", cells: ["-ος", "-οι"] },
      { label: "Genitive", cells: ["-ου", "-ων"] },
      { label: "Dative", cells: ["-ῳ", "-οις"] },
      { label: "Accusative", cells: ["-ον", "-ους"] },
      { label: "Vocative", cells: ["-ε", "-οι"] },
    ]);

    const feminine = cards.find((card) => card.id === "lesson8-chart-adjective-endings-feminine");
    expect(feminine?.columns).toEqual(["Singular after ε, ι, ρ", "Singular otherwise", "Plural"]);
    expect(feminine?.rows).toEqual([
      { label: "Nominative", cells: ["-ᾱ", "-η", "-αι"] },
      { label: "Genitive", cells: ["-ᾱς", "-ης", "-ων"] },
      { label: "Dative", cells: ["-ᾳ", "-ῃ", "-αις"] },
      { label: "Accusative", cells: ["-ᾱν", "-ην", "-ᾱς"] },
      { label: "Vocative", cells: ["-ᾱ", "-η", "-αι"] },
    ]);

    expect(cards.find((card) => card.id === "lesson8-chart-adjective-endings-neuter")?.rows).toEqual([
      { label: "Nominative", cells: ["-ον", "-α"] },
      { label: "Genitive", cells: ["-ου", "-ων"] },
      { label: "Dative", cells: ["-ῳ", "-οις"] },
      { label: "Accusative", cells: ["-ον", "-α"] },
      { label: "Vocative", cells: ["-ον", "-α"] },
    ]);
  });

  it("registers pronunciation/audio definitions for every Lesson 8 card", () => {
    const vocabulary = readJson<VocabCard[]>("public/data/greek-lesson8-vocab.json");
    const grammar = readJson<GrammarCard[]>("public/data/greek-lesson8-grammar.json");

    for (const card of [...vocabulary, ...grammar]) {
      const asset = resolveBuiltinGreekAsset(card.id);
      expect(asset, card.id).not.toBeNull();
      expect(asset?.canonicalIpa, card.id).toBeTruthy();
      expect(asset?.ttsText, card.id).toBeTruthy();
    }

    const prewarm = fs.readFileSync(".github/workflows/prewarm-greek-audio.yml", "utf8");
    expect(prewarm).not.toContain("lesson8-v1");
  });

  it("wires Lesson 8 into the Greek selector and built-in Stats registry", () => {
    const page = fs.readFileSync("src/pages/greek-page.tsx", "utf8");
    const catalog = fs.readFileSync("src/features/study/builtin-study-catalog.ts", "utf8");

    expect(page).toContain('title="Lesson 8"');
    expect(page).toContain('title="Adjective endings"');
    expect(page).toContain("decks.lesson8Vocabulary");
    expect(page).toContain("decks.lesson8Grammar");
    expect(page).toContain("source.deck.id === decks.lesson8Grammar.id");
    expect(page).toContain('<span className="study-prompt reverse-text-prompt">{card.front}</span>');
    expect(page).toContain('<GreekParadigm card={card} />');
    expect(page).toContain('source.deck.id === decks.lesson8Vocabulary.id ? `Lesson 8 vocabulary · ${card.notes ?? ""}`');
    expect(catalog).toContain('id: "alpha-omega-lesson8-vocab"');
    expect(catalog).toContain('id: "alpha-omega-lesson8-grammar"');
  });
});
