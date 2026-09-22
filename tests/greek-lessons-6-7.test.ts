import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveBuiltinGreekAsset } from "../supabase/functions/course-audio/builtin-greek-assets";

type VocabCard = { id: string; greek: string; meaning: string; part_of_speech: string; lesson: number; source_ref?: string };
type GrammarCard = { id: string; category: string; prompt: string; columns: string[]; rows: Array<{ label: string; cells: string[] }>; source_ref?: string };

const readJson = <T>(path: string) => JSON.parse(fs.readFileSync(path, "utf8")) as T;

describe("Groton Lessons 6 and 7 expansion", () => {
  it("adds second principal parts to the existing Lesson 3–5 verb cards without changing their ids", () => {
    const lesson3 = readJson<VocabCard[]>("public/data/greek-lesson3-vocab.json");
    const lesson4 = readJson<VocabCard[]>("public/data/greek-lesson4-vocab.json");
    const lesson5 = readJson<VocabCard[]>("public/data/greek-lesson5-vocab.json");

    expect(lesson3.slice(0, 7).map(({ id, greek }) => ({ id, greek }))).toEqual([
      { id: "lesson3-v1", greek: "γράφω, γράψω" },
      { id: "lesson3-v2", greek: "ἐθέλω, ἐθελήσω" },
      { id: "lesson3-v3", greek: "θῡ́ω, θῡ́σω" },
      { id: "lesson3-v4", greek: "κλέπτω, κλέψω" },
      { id: "lesson3-v5", greek: "παιδεύω, παιδεύσω" },
      { id: "lesson3-v6", greek: "σπεύδω, σπεύσω" },
      { id: "lesson3-v7", greek: "φυλάττω, φυλάξω" },
    ]);
    expect(lesson4[0]).toMatchObject({ id: "lesson4-v1", greek: "πέμπω, πέμψω" });
    expect(lesson5.slice(0, 3).map(({ id, greek }) => ({ id, greek }))).toEqual([
      { id: "lesson5-v1", greek: "ἀκούω, ἀκούσω" },
      { id: "lesson5-v2", greek: "βλάπτω, βλάψω" },
      { id: "lesson5-v3", greek: "κελεύω, κελεύσω" },
    ]);
  });

  it("adds all Lesson 6 and Lesson 7 vocabulary with Groton source refs", () => {
    const lesson6 = readJson<VocabCard[]>("public/data/greek-lesson6-vocab.json");
    const lesson7 = readJson<VocabCard[]>("public/data/greek-lesson7-vocab.json");

    expect(lesson6).toHaveLength(11);
    expect(lesson6.every((card) => card.lesson === 6 && card.source_ref === "Groton 6.40")).toBe(true);
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

    expect(lesson7).toHaveLength(12);
    expect(lesson7.every((card) => card.lesson === 7 && card.source_ref === "Groton 7.47")).toBe(true);
    expect(lesson7[0]).toMatchObject({ id: "lesson7-v1", greek: "χαίρω, χαιρήσω" });
    expect(lesson7.at(-1)).toMatchObject({ id: "lesson7-v12", greek: "ἀπό (ἀπ’, ἀφ’)" });
  });

  it("preserves the Lesson 6 future active charts and p. 32 Letter Changes chart", () => {
    const cards = readJson<GrammarCard[]>("public/data/greek-lesson6-grammar.json");
    expect(cards).toHaveLength(5);

    const indicativeEndings = cards.find((card) => card.id === "lesson6-chart-future-active-indicative-endings");
    expect(indicativeEndings?.rows).toEqual([
      { label: "1st person", cells: ["-σω", "-σομεν"] },
      { label: "2nd person", cells: ["-σεις", "-σετε"] },
      { label: "3rd person", cells: ["-σει", "-σουσι(ν)"] },
    ]);

    const indicative = cards.find((card) => card.id === "lesson6-chart-future-active-indicative");
    expect(indicative?.rows).toEqual([
      { label: "1st person", cells: ["παιδεύσω", "παιδεύσομεν"] },
      { label: "2nd person", cells: ["παιδεύσεις", "παιδεύσετε"] },
      { label: "3rd person", cells: ["παιδεύσει", "παιδεύσουσι(ν)"] },
    ]);

    expect(cards.find((card) => card.id === "lesson6-chart-future-active-infinitive-endings")?.rows)
      .toEqual([{ label: "Future Active Infinitive", cells: ["-σειν"] }]);
    expect(cards.find((card) => card.id === "lesson6-chart-future-active-infinitive")?.rows)
      .toEqual([{ label: "Future Active Infinitive", cells: ["παιδεύσειν"] }]);

    const changes = cards.find((card) => card.id === "lesson6-chart-letter-changes");
    expect(changes?.prompt).toBe("Letter Changes");
    expect(changes?.source_ref).toBe("Groton 6.38, p. 32");
    expect(changes?.rows).toEqual([
      { label: "Labial", cells: ["π, β, φ", "+ σ", "ψ"] },
      { label: "Palatal", cells: ["κ, γ, χ", "+ σ", "ξ"] },
      { label: "Dental", cells: ["τ, δ, θ", "+ σ", "σ"] },
      { label: "πτ", cells: ["πτ", "+ σ", "ψ"] },
      { label: "ττ", cells: ["ττ", "+ σ", "ξ"] },
    ]);
  });

  it("preserves the Lesson 7 second-declension and masculine article conventions", () => {
    const cards = readJson<GrammarCard[]>("public/data/greek-lesson7-grammar.json");
    expect(cards).toHaveLength(5);

    expect(cards.find((card) => card.id === "lesson7-chart-second-declension-masculine-endings")?.rows).toEqual([
      { label: "Nominative", cells: ["-ος", "-οι"] },
      { label: "Genitive", cells: ["-ου", "-ων"] },
      { label: "Dative", cells: ["-ῳ", "-οις"] },
      { label: "Accusative", cells: ["-ον", "-ους"] },
      { label: "Vocative", cells: ["-ε", "-οι"] },
    ]);

    expect(cards.find((card) => card.id === "lesson7-chart-second-declension-anthropos")?.rows[0])
      .toEqual({ label: "Nominative", cells: ["ἄνθρωπ - ος", "ἄνθρωπ - οι"] });
    expect(cards.find((card) => card.id === "lesson7-chart-second-declension-potamos")?.rows[1])
      .toEqual({ label: "Genitive", cells: ["ποταμ - οῦ", "ποταμ - ῶν"] });

    expect(cards.find((card) => card.id === "lesson7-chart-definite-article-masculine-singular")?.rows)
      .toEqual([
        { label: "Nominative", cells: ["ὁ"] },
        { label: "Genitive", cells: ["τοῦ"] },
        { label: "Dative", cells: ["τῷ"] },
        { label: "Accusative", cells: ["τόν"] },
      ]);
    expect(cards.find((card) => card.id === "lesson7-chart-definite-article-masculine-plural")?.rows)
      .toEqual([
        { label: "Nominative", cells: ["οἱ"] },
        { label: "Genitive", cells: ["τῶν"] },
        { label: "Dative", cells: ["τοῖς"] },
        { label: "Accusative", cells: ["τούς"] },
      ]);
  });

  it("registers future audio definitions without making Letter Changes a phonetic audio card", () => {
    const lesson6Vocab = readJson<VocabCard[]>("public/data/greek-lesson6-vocab.json");
    const lesson7Vocab = readJson<VocabCard[]>("public/data/greek-lesson7-vocab.json");
    const lesson6Grammar = readJson<GrammarCard[]>("public/data/greek-lesson6-grammar.json");
    const lesson7Grammar = readJson<GrammarCard[]>("public/data/greek-lesson7-grammar.json");

    for (const card of [...lesson6Vocab, ...lesson7Vocab, ...lesson6Grammar.filter((card) => card.id !== "lesson6-chart-letter-changes"), ...lesson7Grammar]) {
      expect(resolveBuiltinGreekAsset(card.id), card.id).not.toBeNull();
    }
    expect(resolveBuiltinGreekAsset("lesson6-chart-letter-changes")).toBeNull();

    const prewarm = fs.readFileSync(".github/workflows/prewarm-greek-audio.yml", "utf8");
    expect(prewarm).not.toContain("lesson6-v1");
    expect(prewarm).not.toContain("lesson7-v1");
  });

  it("wires both lessons into the Greek selector and built-in Stats registry", () => {
    const page = fs.readFileSync("src/pages/greek-page.tsx", "utf8");
    const catalog = fs.readFileSync("src/features/study/builtin-study-catalog.ts", "utf8");

    expect(page).toContain('title="Lesson 6"');
    expect(page).toContain('title="Lesson 7"');
    expect(page).toContain('label="Letter Changes"');
    expect(page).toContain("decks.lesson6Grammar");
    expect(page).toContain("decks.lesson7Grammar");
    expect(catalog).toContain('id: "alpha-omega-lesson6-vocab"');
    expect(catalog).toContain('id: "alpha-omega-lesson6-grammar"');
    expect(catalog).toContain('id: "alpha-omega-lesson7-vocab"');
    expect(catalog).toContain('id: "alpha-omega-lesson7-grammar"');
  });
});
