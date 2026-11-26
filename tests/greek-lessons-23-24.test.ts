import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { BUILTIN_STUDY_DECKS } from "../src/features/study/builtin-study-catalog";
import { resolveBuiltinGreekAsset } from "../supabase/functions/course-audio/builtin-greek-assets";
import { greekToElevenLabsIpa } from "../supabase/functions/course-audio/greek-ipa";
describe("Groton lessons 23–24",()=>{
  it("registers all decks, stable cards and vertical audio",()=>{
    for(const n of [23,24]) for(const kind of ["vocab","grammar"]){
      expect(BUILTIN_STUDY_DECKS.some(d=>d.id===`alpha-omega-lesson${n}-${kind}`)).toBe(true);
      const cards=JSON.parse(fs.readFileSync(`public/data/greek-lesson${n}-${kind}.json`,"utf8")) as {id:string;columns?:string[];rows?:{cells:string[]}[]}[];
      expect(cards.length).toBe(kind==="vocab"?(n===23?11:10):(n===23?4:10));
      expect(new Set(cards.map(c=>c.id)).size).toBe(cards.length);
      for(const c of cards){const asset=resolveBuiltinGreekAsset(c.id);expect(asset).not.toBeNull();if(c.columns&&c.rows){const rows=c.rows;expect(c.columns).toEqual(["Masculine","Feminine","Neuter"]);expect(rows.length).toBe(4);expect(asset?.ttsText).toBe(c.columns.map((_,i)=>rows.map(r=>greekToElevenLabsIpa(r.cells[i].replace(/\(ν\)/g,"ν").replaceAll(" / ",", ").replaceAll("-","").replace(/[\[\]]/g,""))).filter(Boolean).join(", ")).filter(Boolean).join(" [pause] "));}}
    }
  });
});
