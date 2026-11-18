import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { hasAmbiguousGreekTonos, normalizeGreekDisplayAccents } from "../src/features/greek/greek-orthography";
import { BUILTIN_STUDY_DECKS } from "../src/features/study/builtin-study-catalog";
import { translationGreekRegistrations } from "../src/features/translation/dictionary-sources";
import { lesson20Vocabulary as helperVocabulary } from "../src/features/translation/groton-lesson20";
import { resolveBuiltinGreekAsset } from "../supabase/functions/course-audio/builtin-greek-assets";

type Vocab = { id:string; greek:string; meaning:string; part_of_speech:string; lesson:number; source_ref:string; third_principal_part?:string; fourth_principal_part?:string };
type Chart = { id:string; category:string; prompt:string; source_ref:string; columns:string[]; rows:{label:string; cells:string[]}[] };
const read=<T>(p:string)=>JSON.parse(fs.readFileSync(p,"utf8")) as T;
const vocab=read<Vocab[]>("public/data/greek-lesson20-vocab.json");
const charts=read<Chart[]>("public/data/greek-lesson20-grammar.json");

describe("Groton Lesson 20 flashcards",()=>{
  it("has ten uniquely numbered source-backed vocabulary entries, matching the Translation Helper",()=>{
    expect(vocab).toHaveLength(10);
    expect(vocab.map(x=>x.id)).toEqual(Array.from({length:10},(_,i)=>"lesson20-v"+(i+1)));
    expect(vocab.map(x=>x.part_of_speech)).toEqual([
      "verb","verb","noun","noun","noun","noun","noun","adjective","preposition","preposition"
    ]);
    for(const v of vocab){
      const other=helperVocabulary.find(x=>x.id===v.id);
      expect(other,v.id).toBeDefined();
      expect(v.greek,v.id).toBe(other?.greek);
      expect(v.meaning,v.id).toBe(other?.meaning);
      expect(v.lesson).toBe(20);
      expect(v.source_ref).toContain("Lesson 20");
    }
    expect(vocab[0].fourth_principal_part).toBe(normalizeGreekDisplayAccents("ἐζήτηκα"));
    expect(vocab[1].fourth_principal_part).toBe("ἔρριφα");
  });

  it("has three perfect/pluperfect active charts with correct singular/plural paradigms",()=>{
    expect(charts).toHaveLength(3);
    expect(charts.map(x=>x.id)).toEqual([
      "lesson20-chart-perfect-active-indicative",
      "lesson20-chart-perfect-active-infinitive",
      "lesson20-chart-pluperfect-active-indicative",
    ]);
    expect(charts.map(x=>x.category)).toEqual([
      "Perfect Active Indicative Endings",
      "Perfect Active Infinitive Endings",
      "Pluperfect Active Indicative Endings",
    ]);
    expect(charts[0].rows.map(x=>x.cells)).toEqual([
      ["-[κ]α","-[κ]αμεν"],["-[κ]ας","-[κ]ατε"],
      ["-[κ]ε(ν)","-[κ]ᾱσι(ν) (-[κ]αν)"]
    ]);
    expect(charts[1].rows.map(x=>x.cells)).toEqual([["-[κ]έναι"]]);
    expect(charts[2].rows.map(x=>x.cells)).toEqual([
      ["-[κ]η (-[κ]ειν)","-[κ]εμεν"],
      ["-[κ]ης (-[κ]εις)","-[κ]ετε"],
      ["-[κ]ει(ν)","-[κ]εσαν"]
    ]);
    for(const chart of charts){
      expect(chart.source_ref).toContain("§122, p. 125");
      expect(chart.rows.every(row=>row.cells.length===chart.columns.length)).toBe(true);
      expect(chart.rows.flatMap(row=>row.cells).every(cell=>cell.includes("[κ]"))).toBe(true);
    }
  });

  it("registers every card in Greek study filters, account progress, Translation Helper, and audio",()=>{
    const page=fs.readFileSync("src/pages/greek-page-v2.tsx","utf8");
    expect(page).toContain("lesson: 20, vocabularyKey: keys.lesson20Vocabulary");
    expect(page).toContain("lesson20PluperfectActiveIndicative");
    expect(page).toContain("loadGreekLesson20VocabularyDeck()");
    expect(page).toContain("loadGreekLesson20GrammarDeck()");
    const source=fs.readFileSync("src/data/greek-lessons-9-10.ts","utf8");
    expect(source).toContain("fourthPrincipalPart: card.fourth_principal_part");
    for(const kind of ["vocab","grammar"]){
      const id="alpha-omega-lesson20-"+kind;
      expect(BUILTIN_STUDY_DECKS.some(x=>x.id===id)).toBe(true);
      const translations=translationGreekRegistrations();
      expect([...translations.grotonVocabulary,...translations.grotonGrammar].some(x=>x.id===id)).toBe(true);
    }
    for(const item of [...vocab,...charts]){
      const audio=resolveBuiltinGreekAsset(item.id);
      expect(audio,item.id).not.toBeNull();
      expect(audio?.canonicalIpa,item.id).toBeTruthy();
      expect(audio?.ttsText,item.id).toBeTruthy();
    }
  });

  it("adds eleven source-attested fourth principal parts to earlier verbs without changing card IDs",()=>{
    const targets = [
      [3,"lesson3-v1","γέγραφα"],[3,"lesson3-v2","ἠθέληκα"],[3,"lesson3-v5","πεπαίδευκα"],
      [4,"lesson4-v1","πέπομφα"],[5,"lesson5-v1","ἀκήκοα"],[5,"lesson5-v2","βέβλαφα"],
      [8,"lesson8-v1","εὕρηκα"],[10,"lesson10-v1","εἴρηκα"],[10,"lesson10-v2","πέπρᾱχα"],
      [11,"lesson11-v1","πέποιθα"],[13,"lesson13-v1","βέβλεφα"],
    ] as const;
    for(const [n,id,part] of targets){
      const cards=read<Vocab[]>("public/data/greek-lesson"+n+"-vocab.json");
      const target=cards.find(x=>x.id===id);
      expect(target?.greek.endsWith(", "+part),id).toBe(true);
      expect(target?.fourth_principal_part,id).toBe(part);
      expect(new Set(cards.map(x=>x.id)).size).toBe(cards.length);
      expect(resolveBuiltinGreekAsset(id)?.ttsText,id).toBeTruthy();
    }
    expect(fs.readFileSync("src/data/builtin-decks.ts","utf8")).toContain("fourthPrincipalPart: card.fourth_principal_part");
  });

  it("preserves polytonic accents and avoids duplicate IDs across all new cards",()=>{
    for(const file of ["public/data/greek-lesson20-vocab.json","public/data/greek-lesson20-grammar.json"]){
      expect(hasAmbiguousGreekTonos(fs.readFileSync(file,"utf8")),file).toBe(false);
    }
    const ids=[...vocab,...charts].map(x=>x.id);
    expect(new Set(ids).size).toBe(13);
  });
});
