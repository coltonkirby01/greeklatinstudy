import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { BUILTIN_STUDY_DECKS } from "../src/features/study/builtin-study-catalog";

type RelativeChart = {
  id: string;
  gender: string;
  columns: string[];
  rows: Array<{ label: string; cells: string[] }>;
};
const cards = JSON.parse(fs.readFileSync("public/data/latin-relative-pronouns.json", "utf8")) as RelativeChart[];
const labels = ["Nominative", "Genitive", "Dative", "Accusative", "Ablative"];

describe("Latin relative pronouns from photographed textbook chart", () => {
  it("has three distinct gender cards, each with five singular and five plural forms", () => {
    expect(cards.map(card => card.id)).toEqual([
      "latin-relative-pronoun-masculine",
      "latin-relative-pronoun-feminine",
      "latin-relative-pronoun-neuter",
    ]);
    expect(cards.map(card => card.gender)).toEqual(["Masculine", "Feminine", "Neuter"]);
    for (const card of cards) {
      expect(card.columns).toEqual(["Singular", "Plural"]);
      expect(card.rows.map(row => row.label)).toEqual(labels);
      expect(card.rows.every(row => row.cells.length === 2 && row.cells.every(Boolean))).toBe(true);
    }
  });

  it("reproduces the photographed Latin forms in singular and plural, without glosses", () => {
    expect(cards[0].rows.map(row => row.cells)).toEqual([
      ["quī", "quī"], ["cuius", "quōrum"], ["cui", "quibus"], ["quem", "quōs"], ["quō", "quibus"],
    ]);
    expect(cards[1].rows.map(row => row.cells)).toEqual([
      ["quae", "quae"], ["cuius", "quārum"], ["cui", "quibus"], ["quam", "quās"], ["quā", "quibus"],
    ]);
    expect(cards[2].rows.map(row => row.cells)).toEqual([
      ["quod", "quae"], ["cuius", "quōrum"], ["cui", "quibus"], ["quod", "quae"], ["quō", "quibus"],
    ]);
    expect(JSON.stringify(cards)).not.toMatch(/"who"|"which"|"whom"|"whose"|english/i);
  });

  it("registers a separate forward-only grammar source, exact selectors, saved cards and Stats", () => {
    const registration = BUILTIN_STUDY_DECKS.find(deck => deck.id === "latin-relative-pronouns");
    expect(registration?.language).toBe("Latin");
    expect(registration?.source).toBe("Relative Pronouns");
    expect(registration?.modes).toEqual([{ mode: "Charts", direction: "forward", studyKey: "chart" }]);
    const page = fs.readFileSync("src/pages/latin-page.tsx", "utf8");
    const filters = fs.readFileSync("src/features/study/filter-preferences.ts", "utf8");
    const loader = fs.readFileSync("src/data/latin-relative-pronouns.ts", "utf8");
    expect(page).toContain('title="Relative Pronouns"');
    expect(page).toContain('label={card.front.replace("Relative Pronoun — ", "")}');
    expect(page).toContain('relativePronounsDeck.cards.filter');
    expect(page).toContain('saved-relative-pronouns');
    expect(page).toContain('"relative-pronouns"');
    expect(page).toContain('source.deck.id === relativePronounsDeck?.id');
    expect(page).toContain('relativePronounsState.checked');
    expect(filters).toContain('"relative-pronouns"');
    expect(loader).toContain('audioDisabled: true');
    expect(loader).toContain('rowHeaderLabel: "Case"');
    expect(loader).toContain('supportsReverse: false');
    expect(loader).toContain('cache: "no-store"');
    const table = fs.readFileSync("src/features/latin/latin-paradigm-table.tsx", "utf8");
    expect(table).toContain('card.metadata?.audioDisabled !== true');
  });
});
