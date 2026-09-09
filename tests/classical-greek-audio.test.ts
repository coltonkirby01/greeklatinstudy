import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_ELEVENLABS_VOICE_ID,
  LESSON3_AUDIO_MODEL,
  LESSON3_PRONUNCIATION_SYSTEM,
  lesson3CourseAudioAssets,
} from "../supabase/functions/course-audio/lesson3-assets";

type GrammarCard = { id: string };

describe("Lesson 3 Classical Greek course audio", () => {
  it("defines one permanent audio asset for every active Lesson 3 grammar chart", () => {
    const grammar = JSON.parse(fs.readFileSync("public/data/greek-lesson3-grammar.json", "utf8")) as GrammarCard[];
    expect(lesson3CourseAudioAssets.map((asset) => asset.id).sort()).toEqual(grammar.map((card) => card.id).sort());
  });

  it("uses Eleven v3 IPA input and a documented default voice", () => {
    expect(LESSON3_AUDIO_MODEL).toBe("eleven_v3");
    expect(DEFAULT_ELEVENLABS_VOICE_ID).toBe("JBFqnCBsd6RMkjVDRZzb");
    expect(LESSON3_PRONUNCIATION_SYSTEM).toContain("Classical Greek");
    expect(LESSON3_PRONUNCIATION_SYSTEM).toContain("accent approximated");
    for (const asset of lesson3CourseAudioAssets) {
      expect(asset.ttsText).toMatch(/^\/.*\/$/u);
      expect(asset.ttsText).not.toContain("παιδεύ-");
    }
  });

  it("reads paradigms vertically: singulars first, then plurals, omitting parenthetical nu", () => {
    expect(lesson3CourseAudioAssets[0].ttsText.split(", ")).toEqual([
      "/pai̯ˈdeu̯.ɔː/",
      "/pai̯ˈdeu̯.eːs/",
      "/pai̯ˈdeu̯.eː/",
      "/pai̯ˈdeu̯.o.men/",
      "/pai̯ˈdeu̯.e.te/",
      "/pai̯ˈdeu̯.uː.si/",
    ]);
    expect(lesson3CourseAudioAssets[1].ttsText.split(", ")).toEqual(["/pai̯ˈdeu̯.eːn/"]);
    expect(lesson3CourseAudioAssets[2].ttsText.split(", ")).toEqual([
      "/ˈpai̯.deu̯.e/",
      "/pai̯.deu̯ˈe.tɔː/",
      "/pai̯ˈdeu̯.e.te/",
      "/pai̯.deu̯ˈon.tɔːn/",
    ]);
  });
});
