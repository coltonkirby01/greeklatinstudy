import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { classicalGreekPronunciation } from "../src/features/greek/greek-pronunciation";
import {
  greekToClassicalIpa,
  greekToElevenLabsIpa,
} from "../supabase/functions/course-audio/greek-ipa";

type VocabularyCard = { id: string; greek: string; source_ref?: string };

function vocabulary(path: string) {
  return JSON.parse(fs.readFileSync(path, "utf8")) as VocabularyCard[];
}

function card(cards: VocabularyCard[], id: string) {
  const found = cards.find((entry) => entry.id === id);
  if (!found) throw new Error(`Missing Greek source card ${id}.`);
  return found;
}

describe("Groton acute/grave source fidelity", () => {
  const lesson3 = vocabulary("public/data/greek-lesson3-vocab.json");
  const lesson4 = vocabulary("public/data/greek-lesson4-vocab.json");

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
