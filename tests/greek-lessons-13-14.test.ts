import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { hasAmbiguousGreekTonos } from "../src/features/greek/greek-orthography";
import { resolveBuiltinGreekAsset } from "../supabase/functions/course-audio/builtin-greek-assets";

type Vocab = { id: string; greek: string; meaning: string; lesson: number; source_ref: string };
type Chart = { id: string; category: string; source_ref: string; columns: string[]; rows: Array<{label: string; cells: string[]}> };
const load = <T>(file: string): T => JSON.parse(fs.readFileSync(file,"utf8")) as T;

describe("Groton Lessons 13–14", () => {
  const vocabulary13 = load<Vocab[]>("public/data/greek-lesson13-vocab.json");
  const vocabulary14 = load<Vocab[]>("public/data/greek-lesson14-vocab.json");
  const grammar13 = load<Chart[]>("public/data/greek-lesson13-grammar.json");
  const grammar14 = load<Chart[]>("public/data/greek-lesson14-grammar.json");

  it("preserves 11 and 10 source entries, the lesson references, and stable IDs", () => {
    expect(vocabulary13).toHaveLength(11);
    expect(vocabulary14).toHaveLength(10);
    for (const [lesson, cards] of [[13, vocabulary13], [14, vocabulary14]] as const) {
      expect(cards.map(card => card.id)).toEqual(Array.from({length: cards.length}, (_, i) => `lesson${lesson}-v${i+1}`));
      expect(cards.every(card => card.lesson===lesson && card.source_ref===`Groton ${lesson}.${lesson===13?85:89}`)).toBe(true);
      expect(cards.every(card => Boolean(card.greek && card.meaning))).toBe(true);
    }
    expect(vocabulary13[0].greek).toBe("βλέπω, βλέψομαι");
    expect(vocabulary13[4].greek).toBe("ὅδε, ἥδε, τόδε");
    expect(vocabulary14[0].greek).toBe("πλήττω, πλήξω");
    expect(vocabulary14[8].greek).toBe("αὐτός, αὐτή, αὐτό");
  });

  it("includes all singular/plural cases of three demonstratives", () => {
    expect(grammar13).toHaveLength(6);
    expect(grammar13.every(card => card.columns.length===3 && card.rows.length===4 && card.rows.every(row => row.cells.length===3))).toBe(true);
    expect(grammar13.find(card => card.id==="lesson13-chart-hode-singular-forms")?.rows[0].cells).toEqual(["ὅδε","ἥδε","τόδε"]);
    expect(grammar13.find(card => card.id==="lesson13-chart-houtos-plural-forms")?.rows[0].cells).toEqual(["οὗτοι","αὗται","ταῦτα"]);
    expect(grammar13.find(card => card.id==="lesson13-chart-ekeinos-singular-forms")?.rows[1].cells).toEqual(["ἐκείνου","ἐκείνης","ἐκείνου"]);
  });

  it("includes first, second, and third-person case forms and enclitic alternates", () => {
    expect(grammar14).toHaveLength(4);
    expect(grammar14.find(card => card.id==="lesson14-chart-first-person-forms")?.rows[1].cells).toEqual(["ἐμοῦ / μου","ἡμῶν"]);
    expect(grammar14.find(card => card.id==="lesson14-chart-second-person-forms")?.rows[2].cells).toEqual(["σοί / σοι","ὑμῖν"]);
    expect(grammar14.find(card => card.id==="lesson14-chart-autos-singular-forms")?.rows[0].cells).toEqual(["αὐτός","αὐτή","αὐτό"]);
  });

  it("uses polytonic accents and registers cacheable Classical Greek audio", () => {
    for (const path of ["public/data/greek-lesson13-vocab.json","public/data/greek-lesson13-grammar.json","public/data/greek-lesson14-vocab.json","public/data/greek-lesson14-grammar.json"]) {
      expect(hasAmbiguousGreekTonos(fs.readFileSync(path,"utf8")),path).toBe(false);
    }
    for (const item of [...vocabulary13,...vocabulary14,...grammar13,...grammar14]) {
      const asset = resolveBuiltinGreekAsset(item.id);
      expect(asset,item.id).not.toBeNull();
      expect(asset?.canonicalIpa,item.id).toBeTruthy();
      expect(asset?.ttsText,item.id).toBeTruthy();
    }
    const prewarm=fs.readFileSync(".github/workflows/prewarm-greek-audio.yml","utf8");
    expect(prewarm).not.toContain("lesson13-v1");
    expect(prewarm).not.toContain("lesson14-v1");
  });

  it("registers both decks in Greek Choose cards, saved selections, and Stats", () => {
    const page=fs.readFileSync("src/pages/greek-page-v2.tsx","utf8");
    const catalog=fs.readFileSync("src/features/study/builtin-study-catalog.ts","utf8");
    for (const lesson of [13,14]) {
      expect(page).toContain(`loadGreekLesson${lesson}VocabularyDeck`);
      expect(page).toContain(`loadGreekLesson${lesson}GrammarDeck`);
      expect(page).toContain(`vocabularyDeck: "lesson${lesson}Vocabulary"`);
      expect(page).toContain(`grammarDeck: "lesson${lesson}Grammar"`);
      expect(catalog).toContain(`id: "alpha-omega-lesson${lesson}-vocab"`);
      expect(catalog).toContain(`id: "alpha-omega-lesson${lesson}-grammar"`);
    }
  });
});
