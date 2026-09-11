import { greekToClassicalIpa, greekToElevenLabsIpa } from "./greek-ipa.ts";
import type { Lesson3CourseAudioAsset } from "./lesson3-assets.ts";

function greekAsset(id: string, label: string, text: string): Lesson3CourseAudioAsset {
  return {
    id,
    label,
    canonicalIpa: greekToClassicalIpa(text),
    ttsText: greekToElevenLabsIpa(text),
  };
}

function paradigm(id: string, label: string, forms: readonly string[]): Lesson3CourseAudioAsset {
  return greekAsset(id, label, forms.join(", "));
}

export const lesson4CourseAudioAssets: readonly Lesson3CourseAudioAsset[] = [
  greekAsset("lesson4-v1", "πέμπω", "πέμπω"),
  greekAsset("lesson4-v2", "ἀγορά, -ᾶς, ἡ", "ἀγορά, ᾶς, ἡ"),
  greekAsset("lesson4-v3", "ἐπιστολή, -ῆς, ἡ", "ἐπιστολή, ῆς, ἡ"),
  greekAsset("lesson4-v4", "ἡσυχίᾱ, -ᾱς, ἡ", "ἡσυχίᾱ, ᾱς, ἡ"),
  greekAsset("lesson4-v5", "θεά, -ᾶς, ἡ", "θεά, ᾶς, ἡ"),
  greekAsset("lesson4-v6", "σκηνή, -ῆς, ἡ", "σκηνή, ῆς, ἡ"),
  greekAsset("lesson4-v7", "χώρᾱ, -ᾱς, ἡ", "χώρᾱ, ᾱς, ἡ"),
  greekAsset("lesson4-v8", "εἰς", "εἰς"),
  greekAsset("lesson4-v9", "ἐκ (ἐξ)", "ἐκ, ἐξ"),
  greekAsset("lesson4-v10", "ἐν", "ἐν"),
  greekAsset("lesson4-v11", "ὦ", "ὦ"),
  paradigm("lesson4-chart-first-declension-feminine-thea", "First Declension Feminine Nouns — θεά", [
    "θε-ά", "θε-ᾶς", "θε-ᾷ", "θε-άν", "θε-ά",
    "θε-αί", "θε-ῶν", "θε-αῖς", "θε-άς", "θε-αί",
  ]),
  paradigm("lesson4-chart-first-declension-feminine-hesychia", "First Declension Feminine Nouns — ἡσυχίᾱ", [
    "ἡσυχί-ᾱ", "ἡσυχί-ᾱς", "ἡσυχί-ᾱͅ", "ἡσυχί-ᾱν", "ἡσυχί-ᾱ",
    "ἡσυχί-αι", "ἡσυχι-ῶν", "ἡσυχί-αις", "ἡσυχί-ᾱς", "ἡσυχί-αι",
  ]),
  paradigm("lesson4-chart-first-declension-feminine-chora", "First Declension Feminine Nouns — χώρᾱ", [
    "χώρ-ᾱ", "χώρ-ᾱς", "χώρ-ᾱͅ", "χώρ-ᾱν", "χώρ-ᾱ",
    "χῶρ-αι", "χωρ-ῶν", "χώρ-αις", "χώρ-ᾱς", "χῶρ-αι",
  ]),
  paradigm("lesson4-chart-first-declension-feminine-skene", "First Declension Feminine Nouns — σκηνή", [
    "σκην-ή", "σκην-ῆς", "σκην-ῇ", "σκην-ήν", "σκην-ή",
    "σκην-αί", "σκην-ῶν", "σκην-αῖς", "σκην-άς", "σκην-αί",
  ]),
  paradigm("lesson4-chart-feminine-definite-article-singular", "Feminine Definite Article — Singular", ["ἡ", "τῆς", "τῇ", "τήν"]),
  paradigm("lesson4-chart-feminine-definite-article-plural", "Feminine Definite Article — Plural", ["αἱ", "τῶν", "ταῖς", "τάς"]),
] as const;
