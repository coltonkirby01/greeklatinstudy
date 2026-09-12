import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { classicalGreekPronunciation } from "../src/features/greek/greek-pronunciation";
import {
  greekToClassicalIpa,
  greekToElevenLabsIpa,
} from "../supabase/functions/course-audio/greek-ipa";

type VocabularyCard = { id: string; greek: string; source_ref?: string };
type GrammarCard = {
  id: string;
  rows: Array<{ label: string; cells: string[] }>;
  source_ref?: string;
  accent_note?: string;
};

function vocabulary(path: string) {
  return JSON.parse(fs.readFileSync(path, "utf8")) as VocabularyCard[];
}

function grammar(path: string) {
  return JSON.parse(fs.readFileSync(path, "utf8")) as GrammarCard[];
}

function card<T extends { id: string }>(cards: T[], id: string) {
  const found = cards.find((entry) => entry.id === id);
  if (!found) throw new Error(`Missing Greek source card ${id}.`);
  return found;
}

function rowCells(cards: GrammarCard[], id: string) {
  return card(cards, id).rows.map((row) => row.cells);
}

describe("Groton acute/grave source fidelity", () => {
  const lesson3 = vocabulary("public/data/greek-lesson3-vocab.json");
  const lesson4 = vocabulary("public/data/greek-lesson4-vocab.json");
  const lesson3Grammar = grammar("public/data/greek-lesson3-grammar.json");
  const lesson4Grammar = grammar("public/data/greek-lesson4-grammar.json");

  it("keeps isolated ultima accents acute but the first correlative καί grave", () => {
    // Groton §3.24: vocabulary quoted out of context keeps an acute on the ultima.
    expect(card(lesson3, "lesson3-v10").greek).toBe("καί");
    // Groton explicitly prints the first correlative with grave because another word follows.
    expect(card(lesson3, "lesson3-v11").greek).toBe("καὶ … καί");

    expect(card(lesson4, "lesson4-v2").greek).toBe("ἀγορά, -ᾶς, ἡ");
    expect(card(lesson4, "lesson4-v3").greek).toBe("ἐπιστολή, -ῆς, ἡ");
    expect(card(lesson4, "lesson4-v5").greek).toBe("θεά, -ᾶς, ἡ");
    expect(card(lesson4, "lesson4-v6").greek).toBe("σκηνή, -ῆς, ἡ");
  });

  it("matches Groton's complete Lesson 3 παιδεύω paradigms and accents", () => {
    expect(rowCells(lesson3Grammar, "lesson3-chart-present-active-indicative")).toEqual([
      ["παιδεύω", "παιδεύομεν"],
      ["παιδεύεις", "παιδεύετε"],
      ["παιδεύει", "παιδεύουσι(ν)"],
    ]);
    expect(rowCells(lesson3Grammar, "lesson3-chart-present-active-infinitive")).toEqual([
      ["παιδεύειν"],
    ]);
    expect(rowCells(lesson3Grammar, "lesson3-chart-present-active-imperative")).toEqual([
      ["παίδευε", "παιδεύετε"],
      ["παιδευέτω", "παιδευόντων"],
    ]);
    expect(card(lesson3Grammar, "lesson3-chart-present-active-imperative").accent_note).toContain("παίδευε, παιδευέτω, παιδεύετε, παιδευόντων");
  });

  it("matches Groton's complete Lesson 4 paradigms and accents", () => {
    expect(rowCells(lesson4Grammar, "lesson4-chart-first-declension-thea")).toEqual([
      ["θεά", "θεαί"],
      ["θεᾶς", "θεῶν"],
      ["θεᾷ", "θεαῖς"],
      ["θεάν", "θεάς"],
      ["θεά", "θεαί"],
    ]);
    expect(rowCells(lesson4Grammar, "lesson4-chart-first-declension-hesychia")).toEqual([
      ["ἡσυχίᾱ", "ἡσυχίαι"],
      ["ἡσυχίᾱς", "ἡσυχιῶν"],
      ["ἡσυχίᾳ", "ἡσυχίαις"],
      ["ἡσυχίᾱν", "ἡσυχίᾱς"],
      ["ἡσυχίᾱ", "ἡσυχίαι"],
    ]);
    expect(rowCells(lesson4Grammar, "lesson4-chart-first-declension-chora")).toEqual([
      ["χώρᾱ", "χῶραι"],
      ["χώρᾱς", "χωρῶν"],
      ["χώρᾳ", "χώραις"],
      ["χώρᾱν", "χώρᾱς"],
      ["χώρᾱ", "χῶραι"],
    ]);
    expect(rowCells(lesson4Grammar, "lesson4-chart-first-declension-skene")).toEqual([
      ["σκηνή", "σκηναί"],
      ["σκηνῆς", "σκηνῶν"],
      ["σκηνῇ", "σκηναῖς"],
      ["σκηνήν", "σκηνάς"],
      ["σκηνή", "σκηναί"],
    ]);
    expect(rowCells(lesson4Grammar, "lesson4-chart-definite-article-feminine-singular")).toEqual([
      ["ἡ"], ["τῆς"], ["τῇ"], ["τήν"],
    ]);
    expect(rowCells(lesson4Grammar, "lesson4-chart-definite-article-feminine-plural")).toEqual([
      ["αἱ"], ["τῶν"], ["ταῖς"], ["τάς"],
    ]);
  });

  it("does not reintroduce artificial stem-ending hyphens into whole paradigms or audio sources", () => {
    for (const grammarCard of [...lesson3Grammar, ...lesson4Grammar].filter((entry) => !entry.id.endsWith("-endings"))) {
      for (const row of grammarCard.rows) {
        for (const form of row.cells) expect(form, `${grammarCard.id}: ${form}`).not.toContain("-");
      }
    }
    const lesson3Audio = fs.readFileSync("supabase/functions/course-audio/lesson3-assets.ts", "utf8");
    const lesson4Audio = fs.readFileSync("supabase/functions/course-audio/lesson4-assets.ts", "utf8");
    expect(lesson3Audio).toContain('"παίδευε"');
    expect(lesson3Audio).not.toContain('"παίδευ-ε"');
    expect(lesson4Audio).toContain('"θεά", "θεᾶς", "θεᾷ"');
    expect(lesson4Audio).not.toContain('"θε-ά"');
  });

  it("keeps the visible pronunciation guide distinct for acute and grave", () => {
    expect(classicalGreekPronunciation("καί")).toBe("kaí");
    expect(classicalGreekPronunciation("καὶ")).toBe("kaì");
    expect(classicalGreekPronunciation("καὶ … καί")).toBe("kaì … kaí");
  });

  it("preserves grave in canonical pitch IPA and leaves grave unstressed for TTS", () => {
    const acuteCanonical = greekToClassicalIpa("ἀγαθά").normalize("NFD");
    const graveCanonical = greekToClassicalIpa("ἀγαθὰ").normalize("NFD");
    expect(acuteCanonical).toContain("\u0301");
    expect(graveCanonical).toContain("\u0300");
    expect(acuteCanonical).not.toBe(graveCanonical);

    expect(greekToElevenLabsIpa("ἀγαθά")).toContain("ˈ");
    expect(greekToElevenLabsIpa("ἀγαθὰ")).not.toContain("ˈ");
  });
});
