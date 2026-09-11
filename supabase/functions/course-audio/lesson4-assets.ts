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

/** Paradigms are spoken vertically: one column at a time. */
export const lesson4CourseAudioAssets: readonly Lesson3CourseAudioAsset[] = [
  paradigm("lesson4-chart-first-declension-endings-singular", "First Declension Feminine Endings — Singular", [
    "-ᾱ", "-ᾱς", "-ᾳ", "-ᾱν", "-ᾱ",
    "-η", "-ης", "-ῃ", "-ην", "-η",
  ]),
  paradigm("lesson4-chart-first-declension-endings-plural", "First Declension Feminine Endings — Plural", [
    "-αι", "-ων", "-αις", "-ᾱς", "-αι",
  ]),
  paradigm("lesson4-chart-first-declension-thea", "First Declension Feminine Nouns — θεά", [
    "θε-ά", "θε-ᾶς", "θε-ᾷ", "θε-άν", "θε-ά",
    "θε-αί", "θε-ῶν", "θε-αῖς", "θε-άς", "θε-αί",
  ]),
  paradigm("lesson4-chart-first-declension-hesychia", "First Declension Feminine Nouns — ἡσυχίᾱ", [
    "ἡσυχί-ᾱ", "ἡσυχί-ᾱς", "ἡσυχί-ᾳ", "ἡσυχί-ᾱν", "ἡσυχί-ᾱ",
    "ἡσυχί-αι", "ἡσυχι-ῶν", "ἡσυχί-αις", "ἡσυχί-ᾱς", "ἡσυχί-αι",
  ]),
  paradigm("lesson4-chart-first-declension-chora", "First Declension Feminine Nouns — χώρᾱ", [
    "χώρ-ᾱ", "χώρ-ᾱς", "χώρ-ᾳ", "χώρ-ᾱν", "χώρ-ᾱ",
    "χῶρ-αι", "χωρ-ῶν", "χώρ-αις", "χώρ-ᾱς", "χῶρ-αι",
  ]),
  paradigm("lesson4-chart-first-declension-skene", "First Declension Feminine Nouns — σκηνή", [
    "σκην-ή", "σκην-ῆς", "σκην-ῇ", "σκην-ήν", "σκην-ή",
    "σκην-αί", "σκην-ῶν", "σκην-αῖς", "σκην-άς", "σκην-αί",
  ]),
  paradigm("lesson4-chart-definite-article-feminine-singular", "Feminine Definite Article — Singular", [
    "ἡ", "τῆς", "τῇ", "τήν",
  ]),
  paradigm("lesson4-chart-definite-article-feminine-plural", "Feminine Definite Article — Plural", [
    "αἱ", "τῶν", "ταῖς", "τάς",
  ]),
] as const;
