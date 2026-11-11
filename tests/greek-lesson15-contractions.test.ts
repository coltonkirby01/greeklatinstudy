import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { hasAmbiguousGreekTonos } from "../src/features/greek/greek-orthography";
import { translationGreekRegistrations } from "../src/features/translation/dictionary-sources";
import { resolveBuiltinGreekAsset } from "../supabase/functions/course-audio/builtin-greek-assets";
import { BUILTIN_STUDY_DECKS } from "../src/features/study/builtin-study-catalog";

type Source = { id: string; result: string; combinations: string[]; source_ref: string };
const source = JSON.parse(fs.readFileSync("public/data/greek-lesson15-contractions.json", "utf8")) as Source[];

describe("Groton §92 — contraction results as separate recall cards", () => {
  it("contains exactly ten distinct results and all 30 source pairings", () => {
    expect(source).toHaveLength(10);
    const actual = new Map(source.map(({ result, combinations }) => [result, combinations]));
    expect(actual.size).toBe(10);
    const expected: Record<string, string[]> = {
      "ᾱ": ["α + α", "α + ε", "α + η"],
      "ᾱͅ": ["α + ει", "α + ῃ"],
      "ει": ["ε + ε", "ε + ει", "ε + ι"],
      "η": ["ε + α", "ε + η"],
      "ῃ": ["ε + ῃ"],
      "ω": ["α + ο", "α + ου", "α + ω", "ε + ω", "ο + α", "ο + η", "ο + ω"],
      "ῳ": ["α + οι"],
      "ου": ["ε + ο", "ε + ου", "ο + ε", "ο + ο", "ο + ου"],
      "οι": ["ε + οι", "ο + ει", "ο + ῃ", "ο + ι", "ο + οι"],
      "αι": ["α + ι"],
    };
    expect(Object.fromEntries(actual)).toEqual(expected);
    expect(source.flatMap(item => item.combinations)).toHaveLength(30);
    expect(new Set(source.flatMap(item => item.combinations)).size).toBe(30);
    expect(source.every(item => item.source_ref.includes("Groton §92"))).toBe(true);
    expect(source.filter(item => item.source_ref.includes("p. 101"))).toHaveLength(6);
    expect(hasAmbiguousGreekTonos(JSON.stringify(source))).toBe(false);
  });

  it("uses unique permanent card IDs and displays the RESULT on the front with ALL pairings on the answer", () => {
    expect(new Set(source.map(item => item.id)).size).toBe(10);
    expect(source.every(item => item.id.startsWith("lesson15-contraction-"))).toBe(true);
    const loaders = fs.readFileSync("src/data/greek-lessons-9-10.ts", "utf8");
    expect(loaders).toContain('front: entry.result');
    expect(loaders).toContain('back: entry.combinations.join("\\n")');
    expect(loaders).toContain('sourceRef: entry.source_ref');
    expect(loaders).toContain('audioDisabled: true');
    expect(loaders).toContain('supportsReverse: false');
    expect(loaders).toContain('function loadGreekLesson15ContractionsDeck()');
    for (const item of source) expect(resolveBuiltinGreekAsset(item.id), item.id).toBeNull();
  });

  it("puts contractions under Lesson 15, separate from Endings and from the Greek Translation Helper lexicon", () => {
    const page = fs.readFileSync("src/pages/greek-page-v2.tsx", "utf8");
    const catalog = BUILTIN_STUDY_DECKS.find(item => item.id === "alpha-omega-lesson15-contractions");
    expect(catalog?.language).toBe("Greek");
    expect(catalog?.source).toBe("Lesson 15 Contractions");
    expect(catalog?.modes).toEqual([{ mode: "Forward", direction: "forward", studyKey: "forward" }]);
    expect(page).toContain('contractionDeck: "lesson15Contractions"');
    expect(page).toContain('contractionKey: keys.lesson15Contractions, endingKeys: []');
    expect(page).toContain('<FilterDisclosure title="Contractions"');
    expect(page).toContain('contractionDeck.cards.map((card) => <FilterCheckbox');
    expect(page).toContain('source.deck.id === decks.lesson15Contractions.id');
    expect(page).toContain('style={{ whiteSpace: "pre-line"');
    expect(page).toContain('saved-lesson${config.lesson}-contractions');
    expect(page).toContain('...allEndingKeys, ...allContractionKeys');
    expect(fs.existsSync("public/data/greek-lesson15-grammar.json")).toBe(false);
    const helper = translationGreekRegistrations();
    expect(helper.grotonGrammar.some(item => item.id.includes("lesson15"))).toBe(false);
    expect(helper.grotonVocabulary.some(item => item.id === "alpha-omega-lesson15-contractions")).toBe(false);
  });
});
