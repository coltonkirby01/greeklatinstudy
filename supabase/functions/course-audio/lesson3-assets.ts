export const LESSON3_PRONUNCIATION_SYSTEM =
  "From Alpha to Omega — Classical Greek (segmental reconstruction; accent approximated)";

export const LESSON3_AUDIO_MODEL = "eleven_v3";
export const DEFAULT_ELEVENLABS_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"; // George, ElevenLabs quickstart voice.

export type Lesson3CourseAudioAsset = {
  id: string;
  label: string;
  ttsText: string;
};

/**
 * Eleven v3 accepts IPA enclosed in forward slashes. The accent marks here use
 * stress as a practical TTS approximation of the textbook's Classical accent;
 * vowel quality, vowel length, diphthongs, and consonants follow the Classical
 * pronunciation profile used for this course.
 *
 * Paradigms are spoken vertically by number: all singular forms first, then
 * all plural forms. This follows the way a learner reads down each chart column.
 */
export const lesson3CourseAudioAssets: readonly Lesson3CourseAudioAsset[] = [
  {
    id: "lesson3-chart-present-active-indicative",
    label: "Present Active Indicative",
    ttsText:
      "/pai̯ˈdeu̯.ɔː/, /pai̯ˈdeu̯.eːs/, /pai̯ˈdeu̯.eː/, /pai̯ˈdeu̯.o.men/, /pai̯ˈdeu̯.e.te/, /pai̯ˈdeu̯.uː.sin/",
  },
  {
    id: "lesson3-chart-present-active-infinitive",
    label: "Present Active Infinitive",
    ttsText: "/pai̯ˈdeu̯.eːn/",
  },
  {
    id: "lesson3-chart-present-active-imperative",
    label: "Present Active Imperative",
    ttsText:
      "/ˈpai̯.deu̯.e/, /pai̯.deu̯ˈe.tɔː/, /pai̯ˈdeu̯.e.te/, /pai̯.deu̯ˈon.tɔːn/",
  },
] as const;
