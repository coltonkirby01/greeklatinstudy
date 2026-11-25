import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { BUILTIN_STUDY_DECKS } from "../src/features/study/builtin-study-catalog";
import { resolveBuiltinGreekAsset } from "../supabase/functions/course-audio/builtin-greek-assets";
describe("Groton lessons 21 and 22", () => {
  it("separates interrogative and indefinite singular and plural into four case charts", () => {
    const charts = JSON.parse(fs.readFileSync("public/data/greek-lesson21-grammar.json","utf8")) as {id:string;category:string;columns:string[];rows:{label:string;cells:string[]}[]}[];
    expect(charts.map(c=>c.id)).toEqual([
      "lesson21-chart-interrogative-pronoun",
      "lesson21-chart-interrogative-pronoun-plural",
      "lesson21-chart-indefinite-pronoun",
      "lesson21-chart-indefinite-pronoun-plural",
    ]);
    for (const chart of charts) {
      expect(chart.columns).toEqual(["Masculine/Feminine","Neuter"]);
      expect(chart.rows.map(r=>r.label)).toEqual(["Nominative","Genitive","Dative","Accusative"]);
      expect(chart.rows.every(r=>r.cells.length===2)).toBe(true);
      expect(chart.category.endsWith(chart.id.endsWith("-plural") ? "Plural" : "Singular")).toBe(true);
      expect(resolveBuiltinGreekAsset(chart.id)?.label).toBe(chart.category);
    }
    expect(charts[0].rows[0].cells).toEqual(["τίς","τί"]);
    expect(charts[2].rows[0].cells).toEqual(["τις","τι"]);
  });
  it("registers all four decks and gives each card a stable audio ID", () => {
    for (const n of [21,22]) for (const kind of ["vocab","grammar"]) {
      expect(BUILTIN_STUDY_DECKS.some(d=>d.id===`alpha-omega-lesson${n}-${kind}`)).toBe(true);
      const cards=JSON.parse(fs.readFileSync(`public/data/greek-lesson${n}-${kind}.json`,"utf8")) as {id:string;source_ref:string}[];
      expect(cards.length).toBeGreaterThan(0);
      expect(new Set(cards.map(c=>c.id)).size).toBe(cards.length);
      for (const c of cards) { expect(c.source_ref).toContain(`Lesson ${n}`); expect(resolveBuiltinGreekAsset(c.id)).not.toBeNull(); }
    }
  });
});
