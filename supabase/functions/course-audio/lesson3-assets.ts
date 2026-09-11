import {
  CLASSICAL_GREEK_PRONUNCIATION_SYSTEM,
  greekToClassicalIpa,
  greekToElevenLabsIpa,
} from "./greek-ipa.ts";

export const LESSON3_PRONUNCIATION_SYSTEM = CLASSICAL_GREEK_PRONUNCIATION_SYSTEM;
export const LESSON3_AUDIO_MODEL = "eleven_v3";
export const DEFAULT_ELEVENLABS_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";

export type Lesson3CourseAudioAsset = {
  id: string;
  label: string;
  canonicalIpa?: string;
  ttsText: string;
};

function paradigm(id: string, label: string, forms: readonly string[]): Lesson3CourseAudioAsset {
  const text = forms.join(", ");
  return {
    id,
    label,
    canonicalIpa: greekToClassicalIpa(text),
    ttsText: greekToElevenLabsIpa(text),
  };
}

/** Paradigms and endings are spoken vertically: singular first, then plural. */
export const lesson3CourseAudioAssets: readonly Lesson3CourseAudioAsset[] = [
  paradigm("lesson3-chart-present-active-indicative-endings", "Present Active Indicative Endings", [
    "-ω",
    "-εις",
    "-ει",
    "-ομεν",
    "-ετε",
    "-ουσι(ν)",
  ]),
  paradigm("lesson3-chart-present-active-infinitive-endings", "Present Active Infinitive Ending", ["-ειν"]),
  paradigm("lesson3-chart-present-active-imperative-endings", "Present Active Imperative Endings", [
    "-ε",
    "-έτω",
    "-ετε",
    "-όντων",
  ]),
  paradigm("lesson3-chart-present-active-indicative", "Present Active Indicative", [
    "παιδεύ-ω",
    "παιδεύ-εις",
    "παιδεύ-ει",
    "παιδεύ-ομεν",
    "παιδεύ-ετε",
    "παιδεύ-ουσι(ν)",
  ]),
  paradigm("lesson3-chart-present-active-infinitive", "Present Active Infinitive", ["παιδεύ-ειν"]),
  paradigm("lesson3-chart-present-active-imperative", "Present Active Imperative", [
    "παίδευ-ε",
    "παιδευ-έτω",
    "παιδεύ-ετε",
    "παιδευ-όντων",
  ]),
] as const;
