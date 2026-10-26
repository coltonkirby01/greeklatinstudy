import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { groupDickinsonCardsByFrequencyRank, matchesVocabularyCard, vocabularyFamily } from "../src/features/study/latin-study-filters";
import { latinRowsToCards, parseCsv } from "../src/data/builtin-decks";
import type { StudyCard } from "../src/features/study/types";

const card = (overrides: Partial<StudyCard> = {}): StudyCard => ({
  id: "latin",
  deckId: "dickinson-latin-core",
  front: "amō",
  back: "I love",
  category: "Verb: 1st Conjugation",
  metadata: { partOfSpeech: "Verb: 1st Conjugation" },
  ...overrides,
});

describe("Latin vocabulary filters", () => {
  it("groups vocabulary subtypes under their major family", () => {
    expect(vocabularyFamily("Verb: 1st Conjugation")).toBe("Verb");
    expect(vocabularyFamily("Noun: 3rd Declension")).toBe("Noun");
  });

  it("allows multiple vocabulary parts of speech to be selected together", () => {
    const noun = card({ id: "noun", category: "Noun: 1st Declension", metadata: { partOfSpeech: "Noun: 1st Declension" } });
    const verb = card();
    const selected = new Set(["Noun: 1st Declension", "Verb: 1st Conjugation"]);
    expect(matchesVocabularyCard(noun, selected)).toBe(true);
    expect(matchesVocabularyCard(verb, selected)).toBe(true);
  });

  it("treats a null selection as all vocabulary categories", () => {
    expect(matchesVocabularyCard(card(), null)).toBe(true);
  });
});

describe("Dickinson frequency-rank selections", () => {
  it("creates true 50-rank and 10-rank bands, respecting rank ties and gaps", () => {
    const cards = [1, 11, 50, 51, 251, 251, 300, 301, 997].map((rank, index) =>
      card({ id: `card-${index}`, rank })
    );
    const groups = groupDickinsonCardsByFrequencyRank(cards);
    expect(groups.map(({ start, end, cards }) => [start, end, cards.length])).toEqual([
      [1, 50, 3], [51, 100, 1], [251, 300, 3], [301, 350, 1], [951, 1000, 1],
    ]);
    expect(groupDickinsonCardsByFrequencyRank(groups[0].cards, 10).map(({ start, end }) => [start, end])).toEqual([
      [1, 10], [11, 20], [41, 50],
    ]);
  });

  it("puts all 997 authoritative Dickinson cards in exactly one frequency band", () => {
    const source = latinRowsToCards(parseCsv(fs.readFileSync("public/data/dickinson-latin-core.csv", "utf8")));
    const cards = source.map((item) => card({ id: item.id, rank: item.frequencyRank }));
    const groups = groupDickinsonCardsByFrequencyRank(cards);
    expect(groups).toHaveLength(20);
    expect(groups[0].cards).toHaveLength(49);
    expect(groups[5].cards).toHaveLength(51);
    expect(groups[19].cards).toHaveLength(47);
    expect(groups.flatMap((group) => group.cards).map((item) => item.id).sort()).toEqual(cards.map((item) => item.id).sort());
    expect(groups.every((group) => group.cards.every((item) => item.rank! >= group.start && item.rank! <= group.end))).toBe(true);
  });
});
