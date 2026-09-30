import { greekToClassicalIpa, greekToElevenLabsIpa } from "./greek-ipa.ts";
import type { Lesson3CourseAudioAsset } from "./lesson3-assets.ts";

function paradigm(id: string, label: string, forms: readonly string[]): Lesson3CourseAudioAsset {
  const text = forms.join(", ");
  return { id, label, canonicalIpa: greekToClassicalIpa(text), ttsText: greekToElevenLabsIpa(text) };
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

export const lesson8VocabularyAudio: Readonly<Record<string, { label: string; greek: string }>> = {
  "lesson8-v1": { label: "εὑρίσκω, εὑρήσω", greek: "εὑρίσκω, εὑρήσω" },
  "lesson8-v2": { label: "λείπω, λείψω", greek: "λείπω, λείψω" },
  "lesson8-v3": { label: "βίος", greek: "βίος, βίου, ὁ" },
  "lesson8-v4": { label: "δῶρον", greek: "δῶρον, δώρου, τό" },
  "lesson8-v5": { label: "ἔργον", greek: "ἔργον, ἔργου, τό" },
  "lesson8-v6": { label: "θησαυρός", greek: "θησαυρός, θησαυροῦ, ὁ" },
  "lesson8-v7": { label: "τέκνον", greek: "τέκνον, τέκνου, τό" },
  "lesson8-v8": { label: "φυτόν", greek: "φυτόν, φυτοῦ, τό" },
  "lesson8-v9": { label: "ἀγαθός", greek: "ἀγαθός, ἀγαθή, ἀγαθόν" },
  "lesson8-v10": { label: "ἄξιος", greek: "ἄξιος, ἀξίᾱ, ἄξιον" },
  "lesson8-v11": { label: "καλός", greek: "καλός, καλή, καλόν" },
};

/** Declension/article/adjective ending charts are spoken by vertical column. */
export const lesson8CourseAudioAssets: readonly Lesson3CourseAudioAsset[] = [
  endingChart("lesson8-chart-second-declension-neuter-endings", "Second Declension Neuter Endings", [
    ["-ον", "-ου", "-ῳ", "-ον", "-ον"],
    ["-α", "-ων", "-οις", "-α", "-α"],
  ]),
  paradigm("lesson8-chart-definite-article-neuter-singular", "Neuter Definite Article — Singular", [
    "τό", "τοῦ", "τῷ", "τό",
  ]),
  paradigm("lesson8-chart-definite-article-neuter-plural", "Neuter Definite Article — Plural", [
    "τά", "τῶν", "τοῖς", "τά",
  ]),
  endingChart("lesson8-chart-adjective-endings-masculine", "First/Second Declension Adjective Endings — Masculine", [
    ["-ος", "-ου", "-ῳ", "-ον", "-ε"],
    ["-οι", "-ων", "-οις", "-ους", "-οι"],
  ]),
  endingChart("lesson8-chart-adjective-endings-feminine", "First/Second Declension Adjective Endings — Feminine", [
    ["-ᾱ", "-ᾱς", "-ᾳ", "-ᾱν", "-ᾱ"],
    ["-η", "-ης", "-ῃ", "-ην", "-η"],
    ["-αι", "-ων", "-αις", "-ᾱς", "-αι"],
  ]),
  endingChart("lesson8-chart-adjective-endings-neuter", "First/Second Declension Adjective Endings — Neuter", [
    ["-ον", "-ου", "-ῳ", "-ον", "-ον"],
    ["-α", "-ων", "-οις", "-α", "-α"],
  ]),
] as const;
