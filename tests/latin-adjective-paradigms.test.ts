import fs from "node:fs";
import { describe, expect, it } from "vitest";

type AdjectiveCard = {
  id: string;
  category: string;
  prompt: string;
  columns: string[];
  rows: Array<{ label: string; cells: string[] }>;
};

const cards = JSON.parse(fs.readFileSync("public/data/latin-adjective-paradigms.json", "utf8")) as AdjectiveCard[];

describe("Henle adjective paradigms", () => {
  it("keeps first/second-declension magnus as three gender-specific cards", () => {
    expect(cards).toHaveLength(4);
    expect(cards.slice(0, 3).map((card) => card.id)).toEqual([
      "latin-adjective-1st-2nd-masculine",
      "latin-adjective-1st-2nd-feminine",
      "latin-adjective-1st-2nd-neuter",
    ]);

    expect(cards[0].rows).toEqual([
      { label: "Nominative", cells: ["magn-us", "magn-ī"] },
      { label: "Genitive", cells: ["magn-ī", "magn-ōrum"] },
      { label: "Dative", cells: ["magn-ō", "magn-īs"] },
      { label: "Accusative", cells: ["magn-um", "magn-ōs"] },
      { label: "Ablative", cells: ["magn-ō", "magn-īs"] },
    ]);
    expect(cards[1].rows).toEqual([
      { label: "Nominative", cells: ["magn-a", "magn-ae"] },
      { label: "Genitive", cells: ["magn-ae", "magn-ārum"] },
      { label: "Dative", cells: ["magn-ae", "magn-īs"] },
      { label: "Accusative", cells: ["magn-am", "magn-ās"] },
      { label: "Ablative", cells: ["magn-ā", "magn-īs"] },
    ]);
    expect(cards[2].rows).toEqual([
      { label: "Nominative", cells: ["magn-um", "magn-a"] },
      { label: "Genitive", cells: ["magn-ī", "magn-ōrum"] },
      { label: "Dative", cells: ["magn-ō", "magn-īs"] },
      { label: "Accusative", cells: ["magn-um", "magn-a"] },
      { label: "Ablative", cells: ["magn-ō", "magn-īs"] },
    ]);
  });

  it("keeps third-declension gravis on one card with neuter variants in parentheses", () => {
    const gravis = cards.find((card) => card.id === "latin-adjective-3rd-gravis");
    expect(gravis?.columns).toEqual(["Singular", "Plural"]);
    expect(gravis?.rows).toEqual([
      { label: "Nominative", cells: ["grav-is (grav-e)", "grav-ēs (grav-ia)"] },
      { label: "Genitive", cells: ["grav-is", "grav-ium"] },
      { label: "Dative", cells: ["grav-ī", "grav-ibus"] },
      { label: "Accusative", cells: ["grav-em (grav-e)", "grav-ēs (grav-ia)"] },
      { label: "Ablative", cells: ["grav-ī", "grav-ibus"] },
    ]);
  });

  it("wires adjective cards into the shared Henle selector and chart behavior", () => {
    const page = fs.readFileSync("src/pages/latin-page.tsx", "utf8");
    const table = fs.readFileSync("src/features/latin/latin-paradigm-table.tsx", "utf8");
    const catalog = fs.readFileSync("src/features/study/builtin-study-catalog.ts", "utf8");

    expect(page).toContain('title="Adjective Paradigms"');
    expect(page).toContain('"1st & 2nd Declension Adjectives"');
    expect(page).toContain('"3rd Declension Adjectives"');
    expect(page).toContain('materials.has("adjective-paradigms")');
    expect(table).toContain('rowHeaderLabel');
    expect(catalog).toContain('id: "latin-adjective-paradigms"');
  });
});
