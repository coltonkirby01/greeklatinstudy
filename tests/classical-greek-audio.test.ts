import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveBuiltinGreekAsset } from "../supabase/functions/course-audio/builtin-greek-assets";
import {
  greekToClassicalIpa,
  greekToElevenLabsIpa,
  stripUnpronouncedGreekNotation,
} from "../supabase/functions/course-audio/greek-ipa";
import {
  DEFAULT_ELEVENLABS_VOICE_ID,
  LESSON3_AUDIO_MODEL,
  LESSON3_PRONUNCIATION_SYSTEM,
  lesson3CourseAudioAssets,
} from "../supabase/functions/course-audio/lesson3-assets";

type IdCard = { id: string };

function withoutPitchMarks(ipa: string) {
  return ipa.normalize("NFD").replace(/[\u0300\u0301]/gu, "");
}

function lessonCards(lesson: number, kind: "vocab" | "grammar") {
  return JSON.parse(fs.readFileSync(`public/data/greek-lesson${lesson}-${kind}.json`, "utf8")) as IdCard[];
}

const intentionallyNonPhoneticGrammarCards = new Set([
  "lesson6-chart-letter-changes",
]);

describe("Classical Greek course audio", () => {
  it("defines one permanent audio asset for every pronounceable active Groton vocabulary and grammar card", () => {
    for (let lesson = 3; lesson <= 12; lesson += 1) {
      for (const kind of ["vocab", "grammar"] as const) {
        for (const card of lessonCards(lesson, kind)) {
          if (intentionallyNonPhoneticGrammarCards.has(card.id)) {
            expect(resolveBuiltinGreekAsset(card.id), `${lesson} ${kind} ${card.id}`).toBeNull();
            continue;
          }
          expect(resolveBuiltinGreekAsset(card.id), `${lesson} ${kind} ${card.id}`).not.toBeNull();
        }
      }
    }
  });

  it("covers the foundation Greek cards, including non-phonetic symbol cards", () => {
    const foundation = JSON.parse(fs.readFileSync("public/data/greek-cards.json", "utf8")) as IdCard[];
    for (const card of foundation) expect(resolveBuiltinGreekAsset(card.id), card.id).not.toBeNull();
    expect(resolveBuiltinGreekAsset("punct-4")?.pronunciationSystem).toContain("non-phonetic");
  });

  it("documents the Groton-first source hierarchy and uses Eleven v4 IPA", () => {
    expect(LESSON3_AUDIO_MODEL).toBe("eleven_v4");
    expect(DEFAULT_ELEVENLABS_VOICE_ID).toBe("JBFqnCBsd6RMkjVDRZzb");
    expect(LESSON3_PRONUNCIATION_SYSTEM).toContain("Groton");
    expect(LESSON3_PRONUNCIATION_SYSTEM).toContain("Allen");
    expect(LESSON3_PRONUNCIATION_SYSTEM).toContain("Smyth");
    expect(LESSON3_PRONUNCIATION_SYSTEM).toContain("Open University");
    for (const asset of lesson3CourseAudioAssets) {
      expect(asset.canonicalIpa).toMatch(/^\/.*\/$/u);
      expect(asset.ttsText).toMatch(/^\/.*\/$/u);
      expect(asset.canonicalIpa).not.toContain("ˈ");
      expect(asset.ttsText).not.toContain("-");
    }
  });

  it("reads Lesson 3 paradigms vertically with Groton's vowel and diphthong values", () => {
    expect(lesson3CourseAudioAssets[0].ttsText.split(", ")).toEqual([
      "/pai̯ˈdey̯ɔː/",
      "/pai̯ˈdey̯ei̯s/",
      "/pai̯ˈdey̯ei̯/",
      "/pai̯ˈdey̯omen/",
      "/pai̯ˈdey̯ete/",
      "/pai̯ˈdey̯uːsi/",
    ]);
    expect(lesson3CourseAudioAssets[1].ttsText).toBe("/pai̯ˈdey̯ei̯n/");
    expect(lesson3CourseAudioAssets[2].ttsText.split(", ")).toEqual([
      "/ˈpai̯dey̯e/",
      "/pai̯dey̯ˈetɔː/",
      "/pai̯ˈdey̯ete/",
      "/pai̯dey̯ˈontɔːn/",
    ]);
  });

  it("uses Groton's explicit course-level segmental rules", () => {
    expect(resolveBuiltinGreekAsset("cap-zeta")?.canonicalIpa).toBe("/zd/");
    expect(withoutPitchMarks(greekToClassicalIpa("εἰμί"))).toContain("ei̯");
    expect(withoutPitchMarks(greekToClassicalIpa("οἶκος"))).toContain("oi̯");
    expect(withoutPitchMarks(greekToClassicalIpa("εὖ"))).toContain("ey̯");
    expect(withoutPitchMarks(greekToClassicalIpa("ηὖ"))).toContain("ɛːy̯");
    expect(withoutPitchMarks(greekToClassicalIpa("φυλάττω"))).toContain("tt");
    expect(withoutPitchMarks(greekToClassicalIpa("ἄγγελος"))).toContain("ŋɡ");
    expect(withoutPitchMarks(greekToClassicalIpa("βασιλεία"))).toContain("ei̯");
    expect(withoutPitchMarks(greekToClassicalIpa("χάρις"))).toContain("kʰ");
  });

  it("limits gamma nasalization to Smyth's gamma/kappa/chi/xi environment", () => {
    expect(withoutPitchMarks(greekToClassicalIpa("ἄγγελος"))).toContain("ŋɡ");
    expect(withoutPitchMarks(greekToClassicalIpa("ἄγκυρα"))).toContain("ŋk");
    expect(withoutPitchMarks(greekToClassicalIpa("πρᾶγμα"))).toContain("ɡm");
    expect(withoutPitchMarks(greekToClassicalIpa("πρᾶγμα"))).not.toContain("ŋm");
  });

  it("tracks core reconstructed Classical contrasts used by the course", () => {
    const references: Array<[string, string[]]> = [
      ["Ζεύς", ["zd", "ey̯"]],
      ["οἶκος", ["oi̯"]],
      ["εἰμί", ["ei̯"]],
      ["ἄγγελος", ["ŋɡ"]],
      ["πρᾶγμα", ["ɡm"]],
      ["βασιλεία", ["ei̯"]],
      ["αὐτός", ["au̯"]],
      ["τῇ", ["ɛːi̯"]],
      ["ᾠδή", ["ɔːi̯"]],
      ["ῥήτωρ", ["r̥"]],
      ["Πυρρός", ["rr̥"]],
      ["φιλοσοφία", ["pʰ"]],
      ["θεός", ["tʰ"]],
      ["χείρ", ["kʰ"]],
      ["ψυχή", ["ps"]],
      ["ξένος", ["ks"]],
    ];

    for (const [greek, fragments] of references) {
      const ipa = withoutPitchMarks(greekToClassicalIpa(greek));
      for (const fragment of fragments) expect(ipa, greek).toContain(fragment);
    }
  });

  it("preserves canonical pitch information but gives ElevenLabs Groton-style syllable stress", () => {
    expect(greekToClassicalIpa("μή")).not.toContain("ˈ");
    expect(greekToClassicalIpa("μή")).toContain("́");
    expect(greekToElevenLabsIpa("μή")).toBe("/mɛː/");
    expect(greekToElevenLabsIpa("παιδεύω")).toBe("/pai̯ˈdey̯ɔː/");
    expect(greekToElevenLabsIpa("θεοὶ")).toBe("/tʰeˈoi̯/");
    expect(greekToElevenLabsIpa("ὑπό")).toBe("/hyˈpo/");
  });

  it("puts ending-chart pauses only between vertical columns", () => {
    const ids = [
      "lesson3-chart-present-active-indicative-endings",
      "lesson3-chart-present-active-imperative-endings",
      "lesson4-chart-first-declension-endings-alpha",
      "lesson4-chart-first-declension-endings-eta",
    ];
    for (const id of ids) {
      const asset = resolveBuiltinGreekAsset(id);
      expect(asset?.ttsText.match(/\[pause\]/gu)).toHaveLength(1);
      const columns = asset?.ttsText.split(" [pause] ") ?? [];
      expect(columns).toHaveLength(2);
      expect(columns.every((column) => !column.includes(","))).toBe(true);
    }
    expect(resolveBuiltinGreekAsset("lesson3-chart-present-active-infinitive-endings")?.ttsText).not.toContain("[pause]");
  });

  it("never pronounces parenthetical material or morphology dashes", () => {
    expect(stripUnpronouncedGreekNotation("παιδεύ-ουσι(ν)")).toBe("παιδεύουσι");
    expect(greekToElevenLabsIpa("παιδεύ-ουσι(ν)")).not.toContain("n/");
  });
});
