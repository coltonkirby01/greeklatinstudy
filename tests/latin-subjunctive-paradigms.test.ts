import fs from "node:fs";
import { describe, expect, it } from "vitest";

type SourceCard = {
  id: string;
  category: string;
  prompt: string;
  columns: string[];
  rows: Array<{ label: string; cells: string[] }>;
};

const active = JSON.parse(fs.readFileSync("public/data/latin-active-subjunctive-paradigms.json", "utf8")) as SourceCard[];
const passive = JSON.parse(fs.readFileSync("public/data/latin-passive-subjunctive-paradigms.json", "utf8")) as SourceCard[];

const retiredPerfectSystemIds = [
  "latin-active-subjunctive-perfect-2nd", "latin-active-subjunctive-perfect-3rd", "latin-active-subjunctive-perfect-4th",
  "latin-active-subjunctive-pluperfect-2nd", "latin-active-subjunctive-pluperfect-3rd", "latin-active-subjunctive-pluperfect-4th",
  "latin-passive-subjunctive-perfect-2nd", "latin-passive-subjunctive-perfect-3rd", "latin-passive-subjunctive-perfect-4th",
  "latin-passive-subjunctive-pluperfect-2nd", "latin-passive-subjunctive-pluperfect-3rd", "latin-passive-subjunctive-pluperfect-4th",
];

describe("Henle subjunctive paradigms", () => {
  it("reduces the subjunctive pool to exactly 20 cards", () => {
    expect(active).toHaveLength(10);
    expect(passive).toHaveLength(10);
    expect([...active, ...passive]).toHaveLength(20);
    expect(new Set([...active, ...passive].map((card) => card.id)).size).toBe(20);
    const activeTenseCounts = Object.fromEntries(["Present Tense", "Imperfect Tense", "Perfect Tense", "Pluperfect Tense"].map((tense) => [tense, active.filter((card) => card.category.endsWith(tense)).length]));
    const passiveTenseCounts = Object.fromEntries(["Present Tense", "Imperfect Tense", "Perfect Tense", "Pluperfect Tense"].map((tense) => [tense, passive.filter((card) => card.category.endsWith(tense)).length]));
    expect(activeTenseCounts).toEqual({ "Present Tense": 4, "Imperfect Tense": 4, "Perfect Tense": 1, "Pluperfect Tense": 1 });
    expect(passiveTenseCounts).toEqual({ "Present Tense": 4, "Imperfect Tense": 4, "Perfect Tense": 1, "Pluperfect Tense": 1 });
    for (const retiredId of retiredPerfectSystemIds) expect([...active, ...passive].some((card) => card.id === retiredId)).toBe(false);
  });

  it("keeps present and imperfect separated by conjugation", () => {
    expect(active[0]).toMatchObject({
      id: "latin-active-subjunctive-present-1st",
      category: "Active Subjunctive — Present Tense",
      rows: [
        { label: "1st person", cells: ["laud-em", "laud-ēmus"] },
        { label: "2nd person", cells: ["laud-ēs", "laud-ētis"] },
        { label: "3rd person", cells: ["laud-et", "laud-ent"] },
      ],
    });
    expect(passive.find((card) => card.id === "latin-passive-subjunctive-imperfect-4th")?.rows[2].cells)
      .toEqual(["aud-īrētur", "aud-īrentur"]);
  });

  it("groups all four active conjugations onto one perfect card and one pluperfect card", () => {
    const perfect = active.find((card) => card.id === "latin-active-subjunctive-perfect-1st");
    const pluperfect = active.find((card) => card.id === "latin-active-subjunctive-pluperfect-1st");
    expect(perfect?.prompt).toContain("Conjugations 1–4");
    expect(perfect?.columns).toEqual(["1st Conjugation", "2nd Conjugation", "3rd Conjugation", "4th Conjugation"]);
    expect(perfect?.rows[0]).toEqual({ label: "1st person singular", cells: ["laudāv-erim", "monu-erim", "mīs-erim", "audīv-erim"] });
    expect(perfect?.rows[5]).toEqual({ label: "3rd person plural", cells: ["laudāv-erint", "monu-erint", "mīs-erint", "audīv-erint"] });
    expect(pluperfect?.rows[1]).toEqual({ label: "2nd person singular", cells: ["laudāv-issēs", "monu-issēs", "mīs-issēs", "audīv-issēs"] });
  });

  it("groups all four passive conjugations onto one perfect card and one pluperfect card", () => {
    const perfect = passive.find((card) => card.id === "latin-passive-subjunctive-perfect-1st");
    const pluperfect = passive.find((card) => card.id === "latin-passive-subjunctive-pluperfect-1st");
    expect(perfect?.prompt).toContain("Conjugations 1–4");
    expect(perfect?.rows[0]).toEqual({ label: "1st person singular", cells: ["laudātus (a, um) sim", "monitus (a, um) sim", "missus (a, um) sim", "audītus (a, um) sim"] });
    expect(perfect?.rows[4]).toEqual({ label: "2nd person plural", cells: ["laudātī (ae, a) sītis", "monitī (ae, a) sītis", "missī (ae, a) sītis", "audītī (ae, a) sītis"] });
    expect(pluperfect?.rows[5]).toEqual({ label: "3rd person plural", cells: ["laudātī (ae, a) essent", "monitī (ae, a) essent", "missī (ae, a) essent", "audītī (ae, a) essent"] });
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
