function originalGreek(card: { greek: string; third_principal_part?: string }) {
  return card.third_principal_part ? card.greek.slice(0, -(`, ${card.third_principal_part}`).length) : card.greek;
}

import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { hasAmbiguousGreekTonos } from "../src/features/greek/greek-orthography";
import { resolveBuiltinGreekAsset } from "../supabase/functions/course-audio/builtin-greek-assets";
import { buildGreekTranslationIndex, lookupDictionaryWord, translationGreekRegistrations } from "../src/features/translation/dictionary-sources";
import type { DeckDefinition, StudyCard } from "../src/features/study/types";

type Vocab = { id: string; greek: string; meaning: string; part_of_speech: string; lesson: number; source_ref: string };
type Chart = { id: string; category: string; columns: string[]; rows: { label: string; cells: string[] }[]; source_ref: string };
const read = <T>(path: string): T => JSON.parse(fs.readFileSync(path, "utf8")) as T;
const vocab15 = read<Vocab[]>("public/data/greek-lesson15-vocab.json");
const vocab16 = read<Vocab[]>("public/data/greek-lesson16-vocab.json");
const endings16 = read<Chart[]>("public/data/greek-lesson16-grammar.json");

function vocabDeck(lesson: number, items: Vocab[]): DeckDefinition {
  const id = `alpha-omega-lesson${lesson}-vocab`;
  return {
    id, slug: "greek", language: "greek", title: `Groton ${lesson}`, eyebrow: "", description: "",
    supportsReverse: true, cards: items.map((c): StudyCard => ({
      id: c.id, deckId: id, front: c.greek, back: c.meaning,
      metadata: { studySource: "vocabulary", partOfSpeech: c.part_of_speech, sourceRef: c.source_ref },
    })),
  };
}
function grammarDeck(): DeckDefinition {
  const id = "alpha-omega-lesson16-grammar";
  return {
    id, slug: "greek", language: "greek", title: "Groton 16 Grammar", eyebrow: "", description: "",
    supportsReverse: false, cards: endings16.map((c): StudyCard => ({
      id: c.id, deckId: id, front: c.category, back: c.category, category: c.category,
      metadata: { studySource: "grammar-chart", grammarGroup: c.category, chartColumns: c.columns, chartRows: c.rows, sourceRef: c.source_ref },
    })),
  };
}

describe("Groton Lessons 15 and 16", () => {
  it("preserves the fourth-edition vocabulary and exact sequential IDs", () => {
    expect(vocab15).toHaveLength(10);
    expect(vocab16).toHaveLength(12);
    expect(vocab15.map(item => item.id)).toEqual(Array.from({length: 10}, (_, i) => `lesson15-v${i + 1}`));
    expect(vocab16.map(item => item.id)).toEqual(Array.from({length: 12}, (_, i) => `lesson16-v${i + 1}`));
    expect(vocab15.map(item => originalGreek(item))).toContain("βάλλω, βαλῶ");
    expect(vocab15.map(item => originalGreek(item))).toContain("γελάω, γελάσομαι");
    expect(vocab16.map(item => item.greek)).toContain("ἀσπίς, -ίδος, ἡ");
    expect(vocab16.map(item => item.greek)).toContain("χάρις, -ιτος, ἡ");
    for (const [lesson, items] of [[15,vocab15],[16,vocab16]] as const) {
      expect(items.every(item => item.lesson===lesson && item.source_ref===`Groton ${lesson}.${lesson===15?95:100}`)).toBe(true);
      expect(items.every(item => item.greek && item.meaning && item.part_of_speech)).toBe(true);
    }
  });

  it("adds no Lesson 15 endings and keeps all Lesson 16 case/number endings together", () => {
    expect(fs.existsSync("public/data/greek-lesson15-grammar.json")).toBe(false);
    expect(endings16).toHaveLength(2);
    expect(endings16.map(item => item.id)).toEqual([
      "lesson16-chart-third-declension-masculine-feminine-endings",
      "lesson16-chart-third-declension-neuter-endings",
    ]);
    for (const chart of endings16) {
      expect(chart.columns).toEqual(["Singular","Plural"]);
      expect(chart.rows.map(row => row.label)).toEqual(["Nominative","Genitive","Dative","Accusative","Vocative"]);
      expect(chart.rows.every(row=>row.cells.length===2 && row.cells.every(Boolean))).toBe(true);
    }
    expect(endings16[0].rows[3].cells).toEqual(["-α / -ν","-ας"]);
    expect(endings16[0].rows[0].cells).toEqual(["-ς / --", "-ες"]);
    expect(endings16[0].rows[4].cells).toEqual(["-- / nominative", "-ες"]);
    for (const rowIndex of [0, 3, 4]) {
      expect(endings16[1].rows[rowIndex].cells).toEqual(["--", "-α"]);
    }
    expect(endings16.flatMap(chart => chart.rows.flatMap(row => row.cells)).every(cell => !cell.includes("stem"))).toBe(true);
  });

  it("wires both lessons into the existing Greek selector, Stats, and source loaders", () => {
    const page=fs.readFileSync("src/pages/greek-page-v2.tsx","utf8");
    const catalog=fs.readFileSync("src/features/study/builtin-study-catalog.ts","utf8");
    const loaders=fs.readFileSync("src/data/greek-lessons-9-10.ts","utf8");
    for (const lesson of [15,16]) {
      expect(page).toContain(`loadGreekLesson${lesson}VocabularyDeck`);
      expect(catalog).toContain(`id: "alpha-omega-lesson${lesson}-vocab"`);
      expect(loaders).toContain(`function loadGreekLesson${lesson}VocabularyDeck`);
    }
    expect(page).toContain('endingKeys: [], categoryByKey: new Map()');
    expect(page).toContain('config.endingKeys.length > 0 && grammarDeck');
    expect(catalog).not.toContain('alpha-omega-lesson15-grammar');
    expect(catalog).toContain('alpha-omega-lesson16-grammar');
    expect(page).toContain('thirdDeclensionMasculineFeminineEndings');
    const registrations=translationGreekRegistrations();
    expect(registrations.grotonVocabulary.map(x=>x.id)).toEqual(expect.arrayContaining(["alpha-omega-lesson15-vocab","alpha-omega-lesson16-vocab"]));
    expect(registrations.grotonGrammar.some(x=>x.id==="alpha-omega-lesson16-grammar")).toBe(true);
    expect(registrations.grotonGrammar.some(x=>x.id==="alpha-omega-lesson15-grammar")).toBe(false);
  });

  it("preserves polytonic Greek and registers audio for every new card without prewarming it", () => {
    for (const path of ["public/data/greek-lesson15-vocab.json","public/data/greek-lesson16-vocab.json","public/data/greek-lesson16-grammar.json"])
      expect(hasAmbiguousGreekTonos(fs.readFileSync(path,"utf8")),path).toBe(false);
    for (const item of [...vocab15,...vocab16,...endings16]) {
      const asset=resolveBuiltinGreekAsset(item.id);
      expect(asset,item.id).not.toBeNull();
      expect(asset?.canonicalIpa,item.id).toBeTruthy();
      expect(asset?.ttsText,item.id).toBeTruthy();
    }
    const prewarm=fs.readFileSync(".github/workflows/prewarm-greek-audio.yml","utf8");
    expect(prewarm).not.toContain("lesson15-v1");
    expect(prewarm).not.toContain("lesson16-v1");
  });

  it("indexes Lesson 16 consonant-stem inflections rather than making false stem-plus-ending forms", () => {
    const index=buildGreekTranslationIndex([vocabDeck(15,vocab15),vocabDeck(16,vocab16)], [grammarDeck()]);
    const matches=[
      ["ἀσπίδος","ἀσπίς"],
      ["ἀσπίσιν","ἀσπίς"],
      ["λεόντων","λέων"],
      ["ὀνόμασιν","ὄνομα"],
      ["φυλάκων","φύλαξ"],
      ["χάριτι","χάρις"],
      ["ἀγῶσι","ἀγών"],
    ];
    for (const [form,headword] of matches)
      expect(lookupDictionaryWord(index,form).some(match=>match.headword.includes(headword)),form).toBe(true);
    expect(lookupDictionaryWord(index,"ἀσπίος").some(match=>match.headword.includes("ἀσπίς"))).toBe(false);
    expect(lookupDictionaryWord(index,"ὀνομαος").some(match=>match.headword.includes("ὄνομα"))).toBe(false);
  });
});
