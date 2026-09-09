import { describe, expect, it } from "vitest";
import { pronunciationOverridesFromMetadata } from "../supabase/functions/course-audio/pronunciation-overrides";

describe("Greek pronunciation metadata overrides", () => {
  it("keeps canonical scholarly IPA separate from ElevenLabs IPA", () => {
    expect(pronunciationOverridesFromMetadata({
      canonicalIpa: "pai̯.děu̯.ɔː",
      elevenLabsIpa: "/pai̯ˈdeu̯ɔː/",
      pronunciationSystem: "Reviewed Classical Attic",
    })).toEqual({
      canonicalIpa: "/pai̯.děu̯.ɔː/",
      ttsIpa: "/pai̯ˈdeu̯ɔː/",
      pronunciationSystem: "Reviewed Classical Attic",
      pronunciationText: undefined,
    });
  });

  it("accepts course text with macrons for automatic pronunciation", () => {
    expect(pronunciationOverridesFromMetadata({ pronunciationText: "θῡ́ω" }).pronunciationText).toBe("θῡ́ω");
  });

  it("supports legacy metadata aliases without changing visible card text", () => {
    const overrides = pronunciationOverridesFromMetadata({
      pronunciationIpa: "/aː/",
      ttsIpa: "aː",
      audioText: "ᾱ",
    });
    expect(overrides.canonicalIpa).toBe("/aː/");
    expect(overrides.ttsIpa).toBe("/aː/");
    expect(overrides.pronunciationText).toBe("ᾱ");
  });
});
