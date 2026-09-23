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

export const lesson7VocabularyAudio: Readonly<Record<string, { label: string; greek: string }>> = {
  "lesson7-v1": { label: "χαίρω, χαιρήσω", greek: "χαίρω, χαιρήσω" },
  "lesson7-v2": { label: "ἀδελφή", greek: "ἀδελφή, ἀδελφῆς, ἡ" },
  "lesson7-v3": { label: "ἀδελφός", greek: "ἀδελφός, ἀδελφοῦ, ὁ" },
  "lesson7-v4": { label: "ἄνθρωπος", greek: "ἄνθρωπος, ἀνθρώπου, ὁ, ἡ" },
  "lesson7-v5": { label: "θεός", greek: "θεός, θεοῦ, ὁ, ἡ" },
  "lesson7-v6": { label: "ἵππος", greek: "ἵππος, ἵππου, ὁ, ἡ" },
  "lesson7-v7": { label: "λίθος", greek: "λίθος, λίθου, ὁ" },
  "lesson7-v8": { label: "λῡ́πη", greek: "λῡ́πη, λῡ́πης, ἡ" },
  "lesson7-v9": { label: "ὁδός", greek: "ὁδός, ὁδοῦ, ἡ" },
  "lesson7-v10": { label: "ποταμός", greek: "ποταμός, ποταμοῦ, ὁ" },
  "lesson7-v11": { label: "χαρά", greek: "χαρά, χαρᾶς, ἡ" },
  "lesson7-v12": { label: "ἀπό", greek: "ἀπό, ἀπ’, ἀφ’" },
};

/** Declension paradigms and endings are spoken vertically: singular first, then plural. */
export const lesson7CourseAudioAssets: readonly Lesson3CourseAudioAsset[] = [
  endingChart("lesson7-chart-second-declension-masculine-endings", "Second Declension Masculine Endings", [
    ["-ος", "-ου", "-ῳ", "-ον", "-ε"],
    ["-οι", "-ων", "-οις", "-ους", "-οι"],
  ]),
  paradigm("lesson7-chart-second-declension-anthropos", "Second Declension Masculine Nouns — ἄνθρωπος", [
    "ἄνθρωπος", "ἀνθρώπου", "ἀνθρώπῳ", "ἄνθρωπον", "ἄνθρωπε",
    "ἄνθρωποι", "ἀνθρώπων", "ἀνθρώποις", "ἀνθρώπους", "ἄνθρωποι",
  ]),
  paradigm("lesson7-chart-second-declension-potamos", "Second Declension Masculine Nouns — ποταμός", [
    "ποταμός", "ποταμοῦ", "ποταμῷ", "ποταμόν", "ποταμέ",
    "ποταμοί", "ποταμῶν", "ποταμοῖς", "ποταμούς", "ποταμοί",
  ]),
  paradigm("lesson7-chart-definite-article-masculine-singular", "Masculine Definite Article — Singular", [
    "ὁ", "τοῦ", "τῷ", "τόν",
  ]),
  paradigm("lesson7-chart-definite-article-masculine-plural", "Masculine Definite Article — Plural", [
    "οἱ", "τῶν", "τοῖς", "τούς",
  ]),
] as const;
