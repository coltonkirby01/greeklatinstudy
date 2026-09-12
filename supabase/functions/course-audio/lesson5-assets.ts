import { greekToClassicalIpa, greekToElevenLabsIpa } from "./greek-ipa.ts";
import type { Lesson3CourseAudioAsset } from "./lesson3-assets.ts";

function paradigm(id: string, label: string, forms: readonly string[]): Lesson3CourseAudioAsset {
  const text = forms.join(", ");
  return {
    id,
    label,
    canonicalIpa: greekToClassicalIpa(text),
    ttsText: greekToElevenLabsIpa(text),
  };
}

function endingChart(id: string, label: string, columns: readonly (readonly string[])[]): Lesson3CourseAudioAsset {
  const forms = columns.flat();
  const spokenColumns = columns.map((column) => column.map((form) => greekToElevenLabsIpa(form)).filter(Boolean).join(" "));
  return {
    id,
    label,
    canonicalIpa: greekToClassicalIpa(forms.join(", ")),
    ttsText: spokenColumns.filter(Boolean).join(" [pause] "),
  };
}

export const lesson5VocabularyAudio: Readonly<Record<string, { label: string; greek: string }>> = {
  "lesson5-v1": { label: "ἀκούω", greek: "ἀκούω" },
  "lesson5-v2": { label: "βλάπτω", greek: "βλάπτω" },
  "lesson5-v3": { label: "κελεύω", greek: "κελεύω" },
  "lesson5-v4": { label: "δέσποινα", greek: "δέσποινα, δεσποίνης, ἡ" },
  "lesson5-v5": { label: "θάλαττα", greek: "θάλαττα, θαλάττης, ἡ" },
  "lesson5-v6": { label: "θεράπαινα", greek: "θεράπαινα, θεραπαίνης, ἡ" },
  "lesson5-v7": { label: "κλίνη", greek: "κλίνη, κλίνης, ἡ" },
  "lesson5-v8": { label: "μοῖρα", greek: "μοῖρα, μοίρᾱς, ἡ" },
  "lesson5-v9": { label: "ὥρᾱ", greek: "ὥρᾱ, ὥρᾱς, ἡ" },
  "lesson5-v10": { label: "ἐπεί, ἐπειδή", greek: "ἐπεί, ἐπειδή" },
};

/** Endings and paradigms are spoken vertically: singular first, then plural. */
export const lesson5CourseAudioAssets: readonly Lesson3CourseAudioAsset[] = [
  endingChart("lesson5-chart-first-declension-endings-short-alpha-as", "First Declension Feminine Endings — short α, genitive -ᾱς", [
    ["-α", "-ᾱς", "-ᾳ", "-αν", "-α"],
    ["-αι", "-ων", "-αις", "-ᾱς", "-αι"],
  ]),
  endingChart("lesson5-chart-first-declension-endings-short-alpha-eta", "First Declension Feminine Endings — short α, genitive -ης", [
    ["-α", "-ης", "-ῃ", "-αν", "-α"],
    ["-αι", "-ων", "-αις", "-ᾱς", "-αι"],
  ]),
  paradigm("lesson5-chart-first-declension-moira", "First Declension Feminine Nouns — μοῖρα", [
    "μοῖρα", "μοίρᾱς", "μοίρᾳ", "μοῖραν", "μοῖρα",
    "μοῖραι", "μοιρῶν", "μοίραις", "μοίρᾱς", "μοῖραι",
  ]),
  paradigm("lesson5-chart-first-declension-thalatta", "First Declension Feminine Nouns — θάλαττα", [
    "θάλαττα", "θαλάττης", "θαλάττῃ", "θάλατταν", "θάλαττα",
    "θάλατται", "θαλαττῶν", "θαλάτταις", "θαλάττᾱς", "θάλατται",
  ]),
] as const;
