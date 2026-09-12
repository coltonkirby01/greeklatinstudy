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

export const lesson4VocabularyAudio: Readonly<Record<string, { label: string; greek: string }>> = {
  "lesson4-v1": { label: "πέμπω", greek: "πέμπω" },
  "lesson4-v2": { label: "ἀγορά", greek: "ἀγορά, ἀγορᾶς, ἡ" },
  "lesson4-v3": { label: "ἐπιστολή", greek: "ἐπιστολή, ἐπιστολῆς, ἡ" },
  "lesson4-v4": { label: "ἡσυχίᾱ", greek: "ἡσυχίᾱ, ἡσυχίᾱς, ἡ" },
  "lesson4-v5": { label: "θεά", greek: "θεά, θεᾶς, ἡ" },
  "lesson4-v6": { label: "σκηνή", greek: "σκηνή, σκηνῆς, ἡ" },
  "lesson4-v7": { label: "χώρᾱ", greek: "χώρᾱ, χώρᾱς, ἡ" },
  "lesson4-v8": { label: "εἰς", greek: "εἰς" },
  "lesson4-v9": { label: "ἐκ, ἐξ", greek: "ἐκ, ἐξ" },
  "lesson4-v10": { label: "ἐν", greek: "ἐν" },
  "lesson4-v11": { label: "ὦ", greek: "ὦ" },
};

/** Endings and paradigms are spoken vertically: singular first, then plural. */
export const lesson4CourseAudioAssets: readonly Lesson3CourseAudioAsset[] = [
  endingChart("lesson4-chart-first-declension-endings-alpha", "First Declension Feminine Endings — α-type", [
    ["-ᾱ", "-ᾱς", "-ᾳ", "-ᾱν", "-ᾱ"],
    ["-αι", "-ων", "-αις", "-ᾱς", "-αι"],
  ]),
  endingChart("lesson4-chart-first-declension-endings-eta", "First Declension Feminine Endings — η-type", [
    ["-η", "-ης", "-ῃ", "-ην", "-η"],
    ["-αι", "-ων", "-αις", "-ᾱς", "-αι"],
  ]),
  paradigm("lesson4-chart-first-declension-thea", "First Declension Feminine Nouns — θεά", [
    "θεά", "θεᾶς", "θεᾷ", "θεάν", "θεά",
    "θεαί", "θεῶν", "θεαῖς", "θεάς", "θεαί",
  ]),
  paradigm("lesson4-chart-first-declension-hesychia", "First Declension Feminine Nouns — ἡσυχίᾱ", [
    "ἡσυχίᾱ", "ἡσυχίᾱς", "ἡσυχίᾳ", "ἡσυχίᾱν", "ἡσυχίᾱ",
    "ἡσυχίαι", "ἡσυχιῶν", "ἡσυχίαις", "ἡσυχίᾱς", "ἡσυχίαι",
  ]),
  paradigm("lesson4-chart-first-declension-chora", "First Declension Feminine Nouns — χώρᾱ", [
    "χώρᾱ", "χώρᾱς", "χώρᾳ", "χώρᾱν", "χώρᾱ",
    "χῶραι", "χωρῶν", "χώραις", "χώρᾱς", "χῶραι",
  ]),
  paradigm("lesson4-chart-first-declension-skene", "First Declension Feminine Nouns — σκηνή", [
    "σκηνή", "σκηνῆς", "σκηνῇ", "σκηνήν", "σκηνή",
    "σκηναί", "σκηνῶν", "σκηναῖς", "σκηνάς", "σκηναί",
  ]),
  paradigm("lesson4-chart-definite-article-feminine-singular", "Feminine Definite Article — Singular", [
    "ἡ", "τῆς", "τῇ", "τήν",
  ]),
  paradigm("lesson4-chart-definite-article-feminine-plural", "Feminine Definite Article — Plural", [
    "αἱ", "τῶν", "ταῖς", "τάς",
  ]),
] as const;
