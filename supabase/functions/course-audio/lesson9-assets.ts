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

export const lesson9VocabularyAudio: Readonly<Record<string, { label: string; greek: string }>> = {
  "lesson9-v1": { label: "δουλεύω, δουλεύσω", greek: "δουλεύω, δουλεύσω" },
  "lesson9-v2": { label: "δεσπότης", greek: "δεσπότης, δεσπότου, ὁ" },
  "lesson9-v3": { label: "μαθητής", greek: "μαθητής, μαθητοῦ, ὁ" },
  "lesson9-v4": { label: "νεᾱνίᾱς", greek: "νεᾱνίᾱς, νεᾱνίου, ὁ" },
  "lesson9-v5": { label: "οἰκέτης", greek: "οἰκέτης, οἰκέτου, ὁ" },
  "lesson9-v6": { label: "ἀθάνατος", greek: "ἀθάνατος, ἀθάνατον" },
  "lesson9-v7": { label: "ἀνάξιος", greek: "ἀνάξιος, ἀνάξιον" },
  "lesson9-v8": { label: "δοῦλος", greek: "δοῦλος, δούλη, δοῦλον" },
  "lesson9-v9": { label: "ἐλεύθερος", greek: "ἐλεύθερος, ἐλευθέρᾱ, ἐλεύθερον" },
  "lesson9-v10": { label: "κακός", greek: "κακός, κακή, κακόν" },
  "lesson9-v11": { label: "πρότερος", greek: "πρότερος, προτέρᾱ, πρότερον" },
};

export const lesson9CourseAudioAssets: readonly Lesson3CourseAudioAsset[] = [
  endingChart("lesson9-chart-first-declension-masculine-endings", "First Declension Masculine Endings", [
    ["-ης", "-ου", "-ῃ", "-ην", "-α/-η"],
    ["-ᾱς", "-ου", "-ᾳ", "-ᾱν", "-ᾱ"],
    ["-αι", "-ων", "-αις", "-ᾱς", "-αι"],
  ]),
  paradigm("lesson9-chart-first-declension-mathetes", "First Declension Masculine — μαθητής", [
    "μαθητής", "μαθητοῦ", "μαθητῇ", "μαθητήν", "μαθητά",
    "μαθηταί", "μαθητῶν", "μαθηταῖς", "μαθητᾱ́ς", "μαθηταί",
  ]),
  paradigm("lesson9-chart-first-declension-neanias", "First Declension Masculine — νεᾱνίᾱς", [
    "νεᾱνίᾱς", "νεᾱνίου", "νεᾱνίᾳ", "νεᾱνίᾱν", "νεᾱνίᾱ",
    "νεᾱνίαι", "νεᾱνιῶν", "νεᾱνίαις", "νεᾱνίᾱς", "νεᾱνίαι",
  ]),
] as const;
