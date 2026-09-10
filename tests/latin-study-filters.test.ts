import { describe, expect, it } from "vitest";
import { matchesVocabularyCard, vocabularyFamily } from "../src/features/study/latin-study-filters";
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
