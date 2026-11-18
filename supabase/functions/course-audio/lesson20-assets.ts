import { greekToClassicalIpa, greekToElevenLabsIpa } from "./greek-ipa.ts";
import type { Lesson3CourseAudioAsset } from "./lesson3-assets.ts";

// Playback labels and chart pronunciations use the same IDs as Lesson 20 study cards.
// These declarations do not request or generate paid audio.
export const lesson20VocabularyAudio: Readonly<Record<string, { label: string; greek: string }>> = {
  "lesson20-v1": { label: "ζητέω, ζητήσω, ἐζήτησα, ἐζήτηκα", greek: "ζητέω, ζητήσω, ἐζήτησα, ἐζήτηκα" },
  "lesson20-v2": { label: "ῥίπτω, ῥίψω, ἔρριψα, ἔρριφα", greek: "ῥίπτω, ῥίψω, ἔρριψα, ἔρριφα" },
  "lesson20-v3": { label: "γῆ, γῆς, γῇ, γῆν, ἡ", greek: "γῆ" },
  "lesson20-v4": { label: "δένδρον, -ου, τό", greek: "δένδρον" },
  "lesson20-v5": { label: "Ἑλλάς, -άδος, ἡ", greek: "Ἑλλάς" },
  "lesson20-v6": { label: "Ἕλλην, -ηνος, ὁ, ἡ", greek: "Ἕλλην" },
  "lesson20-v7": { label: "οὐρανός, -οῦ, ὁ", greek: "οὐρανός" },
  "lesson20-v8": { label: "Ἑλληνικός, -ή, -όν", greek: "Ἑλληνικός" },
  "lesson20-v9": { label: "κατά (κατ’, καθ’) (+ gen., acc.)", greek: "κατά" },
  "lesson20-v10": { label: "ὑπέρ (+ gen., acc.)", greek: "ὑπέρ" },
};

function chartAudio(id: string, label: string, columns: readonly (readonly string[])[]): Lesson3CourseAudioAsset {
  // Pronounce the κ-present (first-perfect) representative while preserving
  // bracketed optional κ in the visible flashcard data; comma separates alternates.
  const normalizeCell = (value: string) => value
    .replace(/\s*\/\s*/gu, ", ")
    .replace(/\s+\(-/gu, ", -")
    .replace(/\[κ\]/gu, "κ")
    .replace(/[()\-]/gu, "")
    .trim();
  const spokenColumns = columns.map((column) => column.map(normalizeCell).filter(Boolean));
  return {
    id,
    label,
    canonicalIpa: greekToClassicalIpa(spokenColumns.flat().join(", ")),
    ttsText: spokenColumns.map((column) => column.map(greekToElevenLabsIpa).filter(Boolean).join(" ")).filter(Boolean).join(" [pause] "),
  };
}

export const lesson20CourseAudioAssets: readonly Lesson3CourseAudioAsset[] = [
  chartAudio("lesson20-chart-perfect-active-indicative", "Perfect Active Indicative Endings", [["-[κ]α","-[κ]ας","-[κ]ε(ν)"],["-[κ]αμεν","-[κ]ατε","-[κ]ᾱσι(ν) (-[κ]αν)"]]),
  chartAudio("lesson20-chart-perfect-active-infinitive", "Perfect Active Infinitive Endings", [["-[κ]έναι"]]),
  chartAudio("lesson20-chart-pluperfect-active-indicative", "Pluperfect Active Indicative Endings", [["-[κ]η (-[κ]ειν)","-[κ]ης (-[κ]εις)","-[κ]ει(ν)"],["-[κ]εμεν","-[κ]ετε","-[κ]εσαν"]]),
] as const;
