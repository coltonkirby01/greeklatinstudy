import fs from "node:fs";
import { describe, expect, it } from "vitest";

type SourceCard = {
  id: string;
  category: string;
  prompt: string;
  columns: string[];
  rows: Array<{ label: string; cells: [string, string] }>;
};

const active = JSON.parse(fs.readFileSync("public/data/latin-active-subjunctive-paradigms.json", "utf8")) as SourceCard[];
const passive = JSON.parse(fs.readFileSync("public/data/latin-passive-subjunctive-paradigms.json", "utf8")) as SourceCard[];

describe("Henle subjunctive paradigms", () => {
  it("adds all four active subjunctive tenses in all four conjugations with stable IDs", () => {
    expect(active).toHaveLength(16);
    expect(new Set(active.map((card) => card.id)).size).toBe(16);
    expect(active[0]).toMatchObject({
      id: "latin-active-subjunctive-present-1st",
      category: "Active Subjunctive — Present Tense",
      rows: [
        { label: "1st person", cells: ["laud-em", "laud-ēmus"] },
        { label: "2nd person", cells: ["laud-ēs", "laud-ētis"] },
        { label: "3rd person", cells: ["laud-et", "laud-ent"] },
      ],
    });
    expect(active.find((card) => card.id === "latin-active-subjunctive-pluperfect-4th")?.rows[1].cells)
      .toEqual(["audīv-issēs", "audīv-issētis"]);
  });

  it("adds present, imperfect, perfect, and pluperfect passive subjunctive paradigms", () => {
    expect(passive).toHaveLength(16);
    expect(new Set(passive.map((card) => card.id)).size).toBe(16);
    expect(passive.find((card) => card.id === "latin-passive-subjunctive-present-2nd")?.rows[1].cells)
      .toEqual(["mon-eāris", "mon-eāminī"]);
    expect(passive.find((card) => card.id === "latin-passive-subjunctive-perfect-1st")?.rows)
      .toEqual([
        { label: "1st person", cells: ["laudātus (a, um) sim", "laudātī (ae, a) sīmus"] },
        { label: "2nd person", cells: ["laudātus (a, um) sīs", "laudātī (ae, a) sītis"] },
        { label: "3rd person", cells: ["laudātus (a, um) sit", "laudātī (ae, a) sint"] },
      ]);
    expect(passive.find((card) => card.id === "latin-passive-subjunctive-pluperfect-4th")?.rows[2].cells)
      .toEqual(["audītus (a, um) esset", "audītī (ae, a) essent"]);
  });

  it("preserves Henle rule references in the deck loaders", () => {
    const activeLoader = fs.readFileSync("src/data/latin-active-subjunctive-paradigms.ts", "utf8");
    const passiveLoader = fs.readFileSync("src/data/latin-passive-subjunctive-paradigms.ts", "utf8");
    for (const rule of ["186, 194-196", "187, 197-199", "200, 202-204", "201, 205-207"]) expect(activeLoader).toContain(rule);
    for (const rule of ["267, 269-271", "268, 272-274", "275, 277-279", "276, 280-282"]) expect(passiveLoader).toContain(rule);
  });

  it("wires both decks into Latin filters, exact selection, Stats/session coverage, and paradigm rendering", () => {
    const page = fs.readFileSync("src/pages/latin-page.tsx", "utf8");
    const catalog = fs.readFileSync("src/features/study/builtin-study-catalog.ts", "utf8");
    const filters = fs.readFileSync("src/features/study/filter-preferences.ts", "utf8");
    for (const key of ["active-subjunctive-paradigms", "passive-subjunctive-paradigms"]) {
      expect(page).toContain(key);
      expect(filters).toContain(key);
    }
    expect(page).toContain('title="Active Subjunctive Paradigms"');
    expect(page).toContain('title="Passive Subjunctive Paradigms"');
    expect(page).toContain("source.deck.id === activeSubjunctiveDeck?.id");
    expect(page).toContain("source.deck.id === passiveSubjunctiveDeck?.id");
    expect(catalog).toContain('id: "latin-active-subjunctive-paradigms"');
    expect(catalog).toContain('id: "latin-passive-subjunctive-paradigms"');
  });
});
