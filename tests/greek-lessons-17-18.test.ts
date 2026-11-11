import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { hasAmbiguousGreekTonos } from "../src/features/greek/greek-orthography";
import { BUILTIN_STUDY_DECKS } from "../src/features/study/builtin-study-catalog";
import { resolveBuiltinGreekAsset } from "../supabase/functions/course-audio/builtin-greek-assets";
import { translationGreekRegistrations } from "../src/features/translation/dictionary-sources";

type Vocab = { id: string; greek: string; meaning: string; part_of_speech: string; lesson: number; source_ref: string; third_principal_part?: string };
type Chart = { id: string; prompt: string; category: string; columns: string[]; rows: { label: string; cells: string[] }[] };
const read = <T>(p: string): T => JSON.parse(fs.readFileSync(p, "utf8")) as T;
const vocab17 = read<Vocab[]>("public/data/greek-lesson17-vocab.json");
const vocab18 = read<Vocab[]>("public/data/greek-lesson18-vocab.json");
const grammar17 = read<Chart[]>("public/data/greek-lesson17-grammar.json");
const grammar18 = read<Chart[]>("public/data/greek-lesson18-grammar.json");
const updatedParts: Record<string, string> = {
  "lesson3-v1": "ἔγραψα",
  "lesson3-v2": "ἠθέλησα",
  "lesson3-v3": "ἔθῡσα",
  "lesson3-v4": "ἔκλεψα",
  "lesson3-v5": "ἐπαίδευσα",
  "lesson3-v6": "ἔσπευσα",
  "lesson3-v7": "ἐφύλαξα",
  "lesson4-v1": "ἔπεμψα",
  "lesson5-v1": "ἤκουσα",
  "lesson5-v2": "ἔβλαψα",
  "lesson5-v3": "ἐκέλευσα",
  "lesson6-v1": "ἤλλαξα",
  "lesson6-v2": "ἐδίωξα",
  "lesson6-v4": "ἐμέλλησα",
  "lesson9-v1": "ἐδούλευσα",
  "lesson10-v2": "ἔπρᾱξα",
  "lesson11-v1": "ἔπεισα",
  "lesson11-v2": "ἔτρεψα",
  "lesson12-v2": "ἔλῡσα",
  "lesson13-v1": "ἔβλεψα",
  "lesson14-v1": "ἔπληξα",
  "lesson14-v2": "ἤνεγκα",
  "lesson15-v1": "ἥρπασα",
  "lesson15-v3": "ἐγέλασα",
  "lesson15-v4": "ἐδήλωσα",
  "lesson15-v5": "ἐκόμισα",
  "lesson15-v6": "ἐτίμησα",
  "lesson15-v7": "ἐφίλησα",
  "lesson15-v8": "ὠφέλησα",
  "lesson16-v1": "ἐποίησα"
};

describe("Groton Lessons 17 and 18", () => {
  it("preserves the 4 noun + 4 adjective Lesson 17 ending charts and original prompts", () => {
    expect(grammar17).toHaveLength(8);
    expect(grammar17.slice(0, 4).map(card => card.prompt)).toEqual([
      "3rd Declension εσ-stem (m./f.)",
      "3rd Declension εσ-stem (n.)",
      "3rd Declension ασ-stem (n.)",
      "3rd Declension οσ-stem (f.)",
    ]);
    expect(grammar17.slice(4).map(card => card.category)).toEqual([
      "3rd Declension Adjective — nasal stem (m./f.)",
      "3rd Declension Adjective — nasal stem (n.)",
      "3rd Declension Adjective — εσ-stem (m./f.)",
      "3rd Declension Adjective — εσ-stem (n.)",
    ]);
    for (const chart of grammar17) {
      expect(chart.columns).toEqual(["Singular", "Plural"]);
      expect(chart.rows.map(row => row.label)).toEqual(["Nominative", "Genitive", "Dative", "Accusative", "Vocative"]);
      expect(chart.rows.every(row => row.cells.length === 2 && row.cells.every(Boolean))).toBe(true);
    }
  });
  it("preserves all six first-aorist active/middle ending charts", () => {
    expect(grammar18.map(card => card.id)).toEqual([
      "lesson18-chart-first-aorist-active-indicative",
      "lesson18-chart-first-aorist-middle-indicative",
      "lesson18-chart-first-aorist-active-infinitive",
      "lesson18-chart-first-aorist-middle-infinitive",
      "lesson18-chart-first-aorist-active-imperative",
      "lesson18-chart-first-aorist-middle-imperative",
    ]);
    expect(grammar18[0].rows.map(row => row.cells)).toEqual([["-σα","-σαμεν"],["-σας","-σατε"],["-σε(ν)","-σαν"]]);
    expect(grammar18[1].rows.map(row => row.cells)).toEqual([["-σαμην","-σαμεθα"],["-σω","-σασθε"],["-σατο","-σαντο"]]);
    expect(grammar18[2].rows[0].cells).toEqual(["-σαι"]);
    expect(grammar18[3].rows[0].cells).toEqual(["-σασθαι"]);
    expect(grammar18[4].rows).toHaveLength(2);
    expect(grammar18[5].rows).toHaveLength(2);
  });
  it("uses stable sequential vocabulary IDs and polytonic spelling in both lessons", () => {
    expect(vocab17).toHaveLength(11);
    expect(vocab18).toHaveLength(13);
    for (const [lesson,cards] of [[17,vocab17],[18,vocab18]] as const) {
      expect(cards.map(item=>item.id)).toEqual(cards.map((_,i)=>`lesson${lesson}-v${i+1}`));
      expect(cards.every(item=>item.greek && item.meaning && item.source_ref && item.lesson===lesson)).toBe(true);
    }
    for (const path of ["public/data/greek-lesson17-vocab.json","public/data/greek-lesson17-grammar.json","public/data/greek-lesson18-vocab.json","public/data/greek-lesson18-grammar.json"])
      expect(hasAmbiguousGreekTonos(fs.readFileSync(path,"utf8")),path).toBe(false);
  });
  it("adds the aorist as third principal part to exactly 30 prior cards, without changing any card ID", () => {
    const originalCards=Array.from({length:14},(_,i)=>i+3).flatMap(lesson=>read<Vocab[]>(`public/data/greek-lesson${lesson}-vocab.json`));
    const updated=originalCards.filter(card=>Boolean(card.third_principal_part));
    expect(Object.keys(updatedParts)).toHaveLength(30);
    expect(updated).toHaveLength(30);
    for (const card of updated){
      expect(card.third_principal_part,card.id).toBe(updatedParts[card.id]);
      expect(card.greek.endsWith(`, ${updatedParts[card.id]}`),card.id).toBe(true);
    }
    for(const id of ["lesson6-v3","lesson8-v1","lesson8-v2","lesson10-v1","lesson10-v3","lesson12-v1","lesson15-v2"]) {
      expect(originalCards.find(card=>card.id===id)?.third_principal_part).toBeUndefined();
    }
  });
  it("registers both lessons for filters, study stats, Translation Helper and Greek audio", () => {
    const page=fs.readFileSync("src/pages/greek-page-v2.tsx","utf8");
    const loader=fs.readFileSync("src/data/greek-lessons-9-10.ts","utf8");
    for (const n of [17,18]){
      expect(page).toContain(`lesson: ${n}, vocabularyKey: keys.lesson${n}Vocabulary`);
      expect(loader).toContain(`function loadGreekLesson${n}VocabularyDeck`);
      expect(loader).toContain(`function loadGreekLesson${n}GrammarDeck`);
      expect(BUILTIN_STUDY_DECKS.some(deck=>deck.id===`alpha-omega-lesson${n}-vocab`)).toBe(true);
      expect(BUILTIN_STUDY_DECKS.some(deck=>deck.id===`alpha-omega-lesson${n}-grammar`)).toBe(true);
    }
    expect(page).toContain("lesson17EpsilonSigmaMF");
    expect(page).toContain("lesson18AoristMiddleImperative");
    expect(loader).toContain("lesson === 18 ? (card.columns.length === 1 ?");
    const r=translationGreekRegistrations();
    expect(r.grotonGrammar.map(x=>x.id)).toEqual(expect.arrayContaining(["alpha-omega-lesson17-grammar","alpha-omega-lesson18-grammar"]));
    expect(r.grotonVocabulary.map(x=>x.id)).toEqual(expect.arrayContaining(["alpha-omega-lesson17-vocab","alpha-omega-lesson18-vocab"]));
    for (const item of [...vocab17,...vocab18,...grammar17,...grammar18]) {
      const asset=resolveBuiltinGreekAsset(item.id);
      expect(asset,item.id).not.toBeNull();
      expect(asset?.canonicalIpa,item.id).toBeTruthy();
      expect(asset?.ttsText,item.id).toBeTruthy();
    }
  });
});
