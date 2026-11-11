import { greekToClassicalIpa, greekToElevenLabsIpa } from "./greek-ipa.ts";
import type { Lesson3CourseAudioAsset } from "./lesson3-assets.ts";

export const lesson17VocabularyAudio: Readonly<Record<string, { label: string; greek: string }>> = {
  "lesson17-v1": { label: "αἰδώς, -οῦς, ἡ", greek: "αἰδώς" },
  "lesson17-v2": { label: "γέρας, -ως, τό", greek: "γέρας" },
  "lesson17-v3": { label: "δαίμων, -ονος, ὁ, ἡ", greek: "δαίμων" },
  "lesson17-v4": { label: "Σωκράτης, -ους, ὁ", greek: "Σωκράτης" },
  "lesson17-v5": { label: "τεῖχος, -ους, τό", greek: "τεῖχος" },
  "lesson17-v6": { label: "τριήρης, -ους, ἡ", greek: "τριήρης" },
  "lesson17-v7": { label: "ἀληθής, -ές", greek: "ἀληθής" },
  "lesson17-v8": { label: "εὐδαίμων, -ον", greek: "εὐδαίμων" },
  "lesson17-v9": { label: "εὖ", greek: "εὖ" },
  "lesson17-v10": { label: "κακῶς", greek: "κακῶς" },
  "lesson17-v11": { label: "πρός (+ gen., dat., acc.)", greek: "πρός" },
};

export const lesson18VocabularyAudio: Readonly<Record<string, { label: string; greek: string }>> = {
  "lesson18-v1": { label: "ἀγγέλλω, ἀγγελῶ, ἤγγειλα", greek: "ἀγγέλλω, ἀγγελῶ, ἤγγειλα" },
  "lesson18-v2": { label: "ἐρωτάω, ἐρωτήσω, ἠρώτησα", greek: "ἐρωτάω, ἐρωτήσω, ἠρώτησα" },
  "lesson18-v3": { label: "πωλέω, πωλήσω, ἐπώλησα", greek: "πωλέω, πωλήσω, ἐπώλησα" },
  "lesson18-v4": { label: "ἄγγελος, -ου, ὁ", greek: "ἄγγελος" },
  "lesson18-v5": { label: "δραχμή, -ῆς, ἡ", greek: "δραχμή" },
  "lesson18-v6": { label: "ὀβολός, -οῦ, ὁ", greek: "ὀβολός" },
  "lesson18-v7": { label: "μόνος, -η, -ον", greek: "μόνος" },
  "lesson18-v8": { label: "ὀλίγος, -η, -ον", greek: "ὀλίγος" },
  "lesson18-v9": { label: "πολύς, πολλή, πολύ", greek: "πολύς" },
  "lesson18-v10": { label: "μόνον", greek: "μόνον" },
  "lesson18-v11": { label: "οὐ μόνον … ἀλλὰ καί", greek: "οὐ μόνον … ἀλλὰ καί" },
  "lesson18-v12": { label: "πολύ / πολλά", greek: "πολύ / πολλά" },
  "lesson18-v13": { label: "περί (+ gen., dat., acc.)", greek: "περί" },
};

// Spoken endings follow the same column-major chart order as the earlier lessons.
// These phonetic assets are declared without prewarming or triggering paid TTS.
function endingAudio(id: string, label: string, columns: string[][]): Lesson3CourseAudioAsset {
  const clean = (cell: string) => cell.replace(/[—-]/gu, "").replace(/\s*\/\s*/gu, ", ").replace(/[()]/gu, "").trim();
  const words = columns.map(column => column.map(clean).filter(Boolean));
  return {
    id, label,
    canonicalIpa: greekToClassicalIpa(words.flat().join(", ")),
    ttsText: words.map(column => column.map(greekToElevenLabsIpa).filter(Boolean).join(" ")).filter(Boolean).join(" [pause] "),
  };
}

export const lesson17And18CourseAudioAssets: readonly Lesson3CourseAudioAsset[] = [
  endingAudio("lesson17-chart-epsilon-sigma-masculine-feminine", "3rd Declension εσ-stem (m./f.)", [["-ης","-ους","-ει","-η","-ες"],["-εις","-ων","-εσι(ν)","-εις","-εις"]]),
  endingAudio("lesson17-chart-epsilon-sigma-neuter", "3rd Declension εσ-stem (n.)", [["-ος","-ους","-ει","-ος","-ος"],["-η","-ων","-εσι(ν)","-η","-η"]]),
  endingAudio("lesson17-chart-alpha-sigma-neuter", "3rd Declension ασ-stem (n.)", [["-ας","-ως","-ᾱͅ / -αι","-ας","-ας"],["-ᾱ","-ῶν","-ασι(ν)","-ᾱ","-ᾱ"]]),
  endingAudio("lesson17-chart-omicron-sigma-feminine", "3rd Declension οσ-stem (f.)", [["-ως","-ους","-οι","-ω","-ως"],[]]),
  endingAudio("lesson17-chart-adjective-nasal-masculine-feminine", "3rd Declension Adjective — nasal stem (m./f.)", [["-ων","-ονος","-ονι","-ονα","-ον"],["-ονες","-ονων","-οσι(ν)","-ονας","-ονες"]]),
  endingAudio("lesson17-chart-adjective-nasal-neuter", "3rd Declension Adjective — nasal stem (n.)", [["-ον","-ονος","-ονι","-ον","-ον"],["-ονα","-ονων","-οσι(ν)","-ονα","-ονα"]]),
  endingAudio("lesson17-chart-adjective-sigma-masculine-feminine", "3rd Declension Adjective — εσ-stem (m./f.)", [["-ης","-ους","-ει","-η","-ες"],["-εις","-ων","-εσι(ν)","-εις","-εις"]]),
  endingAudio("lesson17-chart-adjective-sigma-neuter", "3rd Declension Adjective — εσ-stem (n.)", [["-ες","-ους","-ει","-ες","-ες"],["-η","-ων","-εσι(ν)","-η","-η"]]),
  endingAudio("lesson18-chart-first-aorist-active-indicative", "First Aorist Active Indicative Endings", [["-σα","-σας","-σε(ν)"],["-σαμεν","-σατε","-σαν"]]),
  endingAudio("lesson18-chart-first-aorist-middle-indicative", "First Aorist Middle Indicative Endings", [["-σαμην","-σω","-σατο"],["-σαμεθα","-σασθε","-σαντο"]]),
  endingAudio("lesson18-chart-first-aorist-active-infinitive", "First Aorist Active Infinitive Ending", [["-σαι"]]),
  endingAudio("lesson18-chart-first-aorist-middle-infinitive", "First Aorist Middle Infinitive Ending", [["-σασθαι"]]),
  endingAudio("lesson18-chart-first-aorist-active-imperative", "First Aorist Active Imperative Endings", [["-σον","-σάτω"],["-σατε","-σάντων"]]),
  endingAudio("lesson18-chart-first-aorist-middle-imperative", "First Aorist Middle Imperative Endings", [["-σαι","-σάσθω"],["-σασθε","-σάσθων"]]),
] as const;
