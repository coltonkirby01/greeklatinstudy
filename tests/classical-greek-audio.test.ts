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

describe("Classical Greek course audio", () => {
  it("defines one permanent audio asset for every active Lesson 3 grammar chart", () => {
    const grammar = JSON.parse(fs.readFileSync("public/data/greek-lesson3-grammar.json", "utf8")) as IdCard[];
    expect(lesson3CourseAudioAssets.map((asset) => asset.id).sort()).toEqual(grammar.map((card) => card.id).sort());
  });

  it("covers every current built-in Greek card, including non-phonetic symbol cards", () => {
    const foundation = JSON.parse(fs.readFileSync("public/data/greek-cards.json", "utf8")) as IdCard[];
    const vocabulary = JSON.parse(fs.readFileSync("public/data/greek-lesson3-vocab.json", "utf8")) as IdCard[];
    const grammar = JSON.parse(fs.readFileSync("public/data/greek-lesson3-grammar.json", "utf8")) as IdCard[];
    for (const card of [...foundation, ...vocabulary, ...grammar]) {
      expect(resolveBuiltinGreekAsset(card.id), card.id).not.toBeNull();
    }
    expect(resolveBuiltinGreekAsset("punct-4")?.pronunciationSystem).toContain("non-phonetic");
  });

  it("documents the source hierarchy and keeps canonical IPA separate from ElevenLabs", () => {
    expect(LESSON3_AUDIO_MODEL).toBe("eleven_v3");
    expect(DEFAULT_ELEVENLABS_VOICE_ID).toBe("JBFqnCBsd6RMkjVDRZzb");
    expect(LESSON3_PRONUNCIATION_SYSTEM).toContain("Josolon");
    expect(LESSON3_PRONUNCIATION_SYSTEM).toContain("Smyth");
    expect(LESSON3_PRONUNCIATION_SYSTEM).toContain("Open University");
    expect(LESSON3_PRONUNCIATION_SYSTEM).toContain("University of Victoria");
    for (const asset of lesson3CourseAudioAssets) {
      expect(asset.canonicalIpa).toMatch(/^\/.*\/$/u);
      expect(asset.ttsText).toMatch(/^\/.*\/$/u);
      expect(asset.canonicalIpa).not.toContain("ˈ");
      expect(asset.ttsText).not.toContain("παιδεύ-");
    }
  });

  it("reads paradigms vertically: singulars first, then plurals, omitting parenthetical nu", () => {
    expect(lesson3CourseAudioAssets[0].ttsText.split(", ")).toEqual([
      "/pai̯dˈeu̯ɔː/",
      "/pai̯dˈeu̯eːs/",
      "/pai̯dˈeu̯eː/",
      "/pai̯dˈeu̯omen/",
      "/pai̯dˈeu̯ete/",
      "/pai̯dˈeu̯uːsi/",
    ]);
    expect(lesson3CourseAudioAssets[1].ttsText).toBe("/pai̯dˈeu̯eːn/");
    expect(lesson3CourseAudioAssets[2].ttsText.split(", ")).toEqual([
      "/pˈai̯deu̯e/",
      "/pai̯deu̯ˈetɔː/",
      "/pai̯dˈeu̯ete/",
      "/pai̯deu̯ˈontɔːn/",
    ]);
  });

  it("uses Josolon/Vox Graeca-led Attic segmental rules", () => {
    expect(resolveBuiltinGreekAsset("cap-zeta")?.canonicalIpa).toBe("/zd/");
    expect(greekToClassicalIpa("οἶκος")).toContain("œ");
    expect(greekToClassicalIpa("φυλάττω")).toContain("tt");
    expect(greekToClassicalIpa("ἄγγελος")).toContain("ŋɡ");
    expect(greekToClassicalIpa("βασιλεία")).toContain("ei");
    expect(greekToClassicalIpa("χάρις")).toContain("kʰ");
  });

  it("preserves canonical pitch information but gives ElevenLabs stable stress approximation", () => {
    expect(greekToClassicalIpa("μή")).not.toContain("ˈ");
    expect(greekToClassicalIpa("μή")).toContain("́");
    expect(greekToElevenLabsIpa("μή")).toBe("/mɛː/");
    expect(greekToElevenLabsIpa("παιδεύω")).toContain("ˈ");
  });

  it("never pronounces parenthetical material or morphology dashes", () => {
    expect(stripUnpronouncedGreekNotation("παιδεύ-ουσι(ν)")).toBe("παιδεύουσι");
    expect(greekToElevenLabsIpa("παιδεύ-ουσι(ν)")).not.toContain("n/");
  });
});
