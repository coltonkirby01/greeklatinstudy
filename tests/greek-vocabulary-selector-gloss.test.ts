import { describe, expect, it } from "vitest";
import { oneWordVocabularyGloss } from "../src/features/greek/vocabulary-selector-gloss";

describe("Greek vocabulary selector one-word glosses", () => {
  it("derives a compact source-based gloss from Groton meanings", () => {
    expect(oneWordVocabularyGloss("write, draw")).toBe("write");
    expect(oneWordVocabularyGloss("(+ infinitive) be willing (to), wish (to)")).toBe("willing");
    expect(oneWordVocabularyGloss("offer sacrifice, sacrifice, slay")).toBe("offer");
    expect(oneWordVocabularyGloss("not — used with imperative commands")).toBe("not");
  });

  it("derives a compact source-based gloss from Kubo meanings", () => {
    expect(oneWordVocabularyGloss("the")).toBe("the");
    expect(oneWordVocabularyGloss("and, also, even")).toBe("and");
    expect(oneWordVocabularyGloss("to be")).toBe("be");
    expect(oneWordVocabularyGloss("rel. who, which, what, that")).toBe("who");
    expect(oneWordVocabularyGloss("a man")).toBe("man");
  });

  it("always returns one lexical token for the tested source patterns", () => {
    for (const meaning of ["stand guard, guard, protect, preserve", "you (pl.)", "because, that", "both … and"]) {
      expect(oneWordVocabularyGloss(meaning)).not.toMatch(/\s/u);
    }
  });
});
