import { describe, expect, it } from "vitest";
import { classicalGreekPronunciation } from "../src/features/greek/greek-pronunciation";

describe("Classical Greek pronunciation guide", () => {
  it("romanizes accented vocabulary while preserving vowel length", () => {
    expect(classicalGreekPronunciation("γράφω")).toBe("gráphō");
    expect(classicalGreekPronunciation("ἐθέλω")).toBe("ethélō");
    expect(classicalGreekPronunciation("μή")).toBe("mḗ");
    expect(classicalGreekPronunciation("μῑκρός")).toBe("mīkrós");
    expect(classicalGreekPronunciation("λῡ́ω")).toBe("lȳ́ō");
  });

  it("uses Groton's proper-diphthong values in the answer-side guide", () => {
    expect(classicalGreekPronunciation("εἰμί")).toBe("eimí");
    expect(classicalGreekPronunciation("οἶκος")).toBe("oîkos");
    expect(classicalGreekPronunciation("παιδεύω")).toBe("paideýō");
    expect(classicalGreekPronunciation("εὖ")).toBe("eŷ");
    expect(classicalGreekPronunciation("ηὖ")).toBe("ēŷ");
    expect(classicalGreekPronunciation("οὐ")).toBe("ou");
  });

  it("shows the contextual consonant rules used by the course audio", () => {
    expect(classicalGreekPronunciation("Ζεύς")).toBe("Zdeýs");
    expect(classicalGreekPronunciation("ἄγγελος")).toBe("ángelos");
    expect(classicalGreekPronunciation("ἄγκυρα")).toBe("ánkyra");
    expect(classicalGreekPronunciation("κόσμος")).toBe("kózmos");
  });

  it("handles vocabulary variants and punctuation without hand-written entries", () => {
    expect(classicalGreekPronunciation("οὐ, οὐκ, οὐχ")).toBe("ou, ouk, oukh");
    expect(classicalGreekPronunciation("καὶ … καί")).toBe("kaì … kaí");
  });
});
