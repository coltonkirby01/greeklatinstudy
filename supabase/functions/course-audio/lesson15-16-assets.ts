import { greekToClassicalIpa, greekToElevenLabsIpa } from "./greek-ipa.ts";
import type { Lesson3CourseAudioAsset } from "./lesson3-assets.ts";

export const lesson15VocabularyAudio: Readonly<Record<string, {label: string; greek: string}>> = {
  "lesson15-v1": { label: "ἁρπάζω, ἁρπάσω", greek: "ἁρπάζω, ἁρπάσω" },
  "lesson15-v2": { label: "βάλλω, βαλῶ", greek: "βάλλω, βαλῶ" },
  "lesson15-v3": { label: "γελάω, γελάσομαι", greek: "γελάω, γελάσομαι" },
  "lesson15-v4": { label: "δηλόω, δηλώσω", greek: "δηλόω, δηλώσω" },
  "lesson15-v5": { label: "κομίζω, κομιῶ", greek: "κομίζω, κομιῶ" },
  "lesson15-v6": { label: "τῑμάω, τῑμήσω", greek: "τῑμάω, τῑμήσω" },
  "lesson15-v7": { label: "φιλέω, φιλήσω", greek: "φιλέω, φιλήσω" },
  "lesson15-v8": { label: "ὠφελέω, ὠφελήσω", greek: "ὠφελέω, ὠφελήσω" },
  "lesson15-v9": { label: "τῑμή, -ῆς, ἡ", greek: "τῑμή" },
  "lesson15-v10": { label: "δῆλος, -η, -ον", greek: "δῆλος, δήλη, δῆλον" },
};

export const lesson16VocabularyAudio: Readonly<Record<string, {label: string; greek: string}>> = {
  "lesson16-v1": { label: "ποιέω, ποιήσω", greek: "ποιέω, ποιήσω" },
  "lesson16-v2": { label: "ἀγών, -ῶνος, ὁ", greek: "ἀγών" },
  "lesson16-v3": { label: "ἀσπίς, -ίδος, ἡ", greek: "ἀσπίς" },
  "lesson16-v4": { label: "κλώψ, κλωπός, ὁ", greek: "κλώψ" },
  "lesson16-v5": { label: "λέων, -οντος, ὁ", greek: "λέων" },
  "lesson16-v6": { label: "ὄνομα, -ατος, τό", greek: "ὄνομα" },
  "lesson16-v7": { label: "ῥήτωρ, -ορος, ὁ", greek: "ῥήτωρ" },
  "lesson16-v8": { label: "φύλαξ, -ακος, ὁ", greek: "φύλαξ" },
  "lesson16-v9": { label: "χάρις, -ιτος, ἡ", greek: "χάρις" },
  "lesson16-v10": { label: "ἕνεκα (+ genitive)", greek: "ἕνεκα" },
  "lesson16-v11": { label: "ἤ", greek: "ἤ" },
  "lesson16-v12": { label: "ἤ ... ἤ", greek: "ἤ, ἤ" },
};

function modelForms(id: string, label: string, singular: readonly string[], plural: readonly string[]): Lesson3CourseAudioAsset {
  const columns = [singular, plural];
  const forms = columns.flat();
  return {
    id, label,
    canonicalIpa: greekToClassicalIpa(forms.join(", ")),
    ttsText: columns.map(column => column.map(greekToElevenLabsIpa).filter(Boolean).join(" ")).filter(Boolean).join(" [pause] "),
  };
}

export const lesson16CourseAudioAssets: readonly Lesson3CourseAudioAsset[] = [
  modelForms("lesson16-chart-third-declension-masculine-feminine-endings", "Third-declension masculine/feminine endings — ἀσπίς sample", [
    "ἀσπίς", "ἀσπίδος", "ἀσπίδι", "ἀσπίδα", "ἀσπί",
  ], ["ἀσπίδες", "ἀσπίδων", "ἀσπίσιν", "ἀσπίδας", "ἀσπίδες"]),
  modelForms("lesson16-chart-third-declension-neuter-endings", "Third-declension neuter endings — ὄνομα sample", [
    "ὄνομα", "ὀνόματος", "ὀνόματι", "ὄνομα", "ὄνομα",
  ], ["ὀνόματα", "ὀνομάτων", "ὀνόμασιν", "ὀνόματα", "ὀνόματα"]),
] as const;
