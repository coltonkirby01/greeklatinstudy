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

export const lesson10VocabularyAudio: Readonly<Record<string, { label: string; greek: string }>> = {
  "lesson10-v1": { label: "λέγω, ἐρῶ/λέξω", greek: "λέγω, ἐρῶ, λέξω" },
  "lesson10-v2": { label: "πρᾱ́ττω, πρᾱ́ξω", greek: "πρᾱ́ττω, πρᾱ́ξω" },
  "lesson10-v3": { label: "φεύγω, φεύξομαι", greek: "φεύγω, φεύξομαι" },
  "lesson10-v4": { label: "ἀλήθεια", greek: "ἀλήθεια, ἀληθείᾱς, ἡ" },
  "lesson10-v5": { label: "θάνατος", greek: "θάνατος, θανάτου, ὁ" },
  "lesson10-v6": { label: "κίνδῡνος", greek: "κίνδῡνος, κινδῡ́νου, ὁ" },
  "lesson10-v7": { label: "φίλος", greek: "φίλος, φίλη, φίλον" },
  "lesson10-v8": { label: "δέ", greek: "δέ" },
  "lesson10-v9": { label: "μέν", greek: "μέν" },
  "lesson10-v10": { label: "μὲν ... δέ", greek: "μὲν, δέ" },
  "lesson10-v11": { label: "ὁ μὲν ... ὁ δέ", greek: "ὁ μὲν, ὁ δέ, οἱ μὲν, οἱ δέ" },
  "lesson10-v12": { label: "οὖν", greek: "οὖν" },
};

export const lesson10CourseAudioAssets: readonly Lesson3CourseAudioAsset[] = [
  endingChart("lesson10-chart-imperfect-active-indicative-endings", "Imperfect Active Indicative Endings", [
    ["-ον", "-ες", "-ε(ν)"],
    ["-ομεν", "-ετε", "-ον"],
  ]),
  paradigm("lesson10-chart-imperfect-active-indicative", "Imperfect Active Indicative — παιδεύω", [
    "ἐπαίδευον", "ἐπαίδευες", "ἐπαίδευε(ν)",
    "ἐπαιδεύομεν", "ἐπαιδεύετε", "ἐπαίδευον",
  ]),
] as const;
