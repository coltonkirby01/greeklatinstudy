import { greekToClassicalIpa, greekToElevenLabsIpa } from "./greek-ipa.ts";
import type { Lesson3CourseAudioAsset } from "./lesson3-assets.ts";

function formChart(id: string, label: string, columns: readonly (readonly string[])[]): Lesson3CourseAudioAsset {
  const forms = columns.flat();
  const spokenColumns = columns.map((column) => column.map((form) => greekToElevenLabsIpa(form)).filter(Boolean).join(" "));
  return {
    id,
    label,
    canonicalIpa: greekToClassicalIpa(forms.join(", ")),
    ttsText: spokenColumns.filter(Boolean).join(" [pause] "),
  };
}

export const lesson12VocabularyAudio: Readonly<Record<string, { label: string; greek: string }>> = {
  "lesson12-v1": { label: "εἰμί, ἔσομαι", greek: "εἰμί, ἔσομαι" },
  "lesson12-v2": { label: "λῡ́ω, λῡ́σω", greek: "λῡ́ω, λῡ́σω" },
  "lesson12-v3": { label: "ἀρχή", greek: "ἀρχή" },
  "lesson12-v4": { label: "εἰρήνη", greek: "εἰρήνη" },
  "lesson12-v5": { label: "λόγος", greek: "λόγος" },
  "lesson12-v6": { label: "πόλεμος", greek: "πόλεμος" },
  "lesson12-v7": { label: "ἐχθρός, -ᾱ́, -όν", greek: "ἐχθρός, ἐχθρᾱ́, ἐχθρόν" },
  "lesson12-v8": { label: "πολέμιος, -ᾱ, -ον", greek: "πολέμιος, πολεμίᾱ, πολέμιον" },
  "lesson12-v9": { label: "διά", greek: "διά" },
  "lesson12-v10": { label: "γε", greek: "γε" },
};

export const lesson12CourseAudioAssets: readonly Lesson3CourseAudioAsset[] = [
  formChart("lesson12-chart-eimi-present-active-indicative-forms", "εἰμί — Present Active Indicative Forms", [
    ["εἰμί", "εἶ", "ἐστίν"],
    ["ἐσμέν", "ἐστέ", "εἰσίν"],
  ]),
  formChart("lesson12-chart-eimi-future-middle-indicative-forms", "εἰμί — Future Middle Indicative Forms", [
    ["ἔσομαι", "ἔσῃ, ἔσει", "ἔσται"],
    ["ἐσόμεθα", "ἔσεσθε", "ἔσονται"],
  ]),
  formChart("lesson12-chart-eimi-imperfect-active-indicative-forms", "εἰμί — Imperfect Active Indicative Forms", [
    ["ἦ, ἦν", "ἦσθα", "ἦν"],
    ["ἦμεν", "ἦτε, ἦστε", "ἦσαν"],
  ]),
  formChart("lesson12-chart-eimi-present-active-imperative-forms", "εἰμί — Present Active Imperative Forms", [
    ["ἴσθι", "ἔστω"],
    ["ἔστε", "ἔστων"],
  ]),
  formChart("lesson12-chart-eimi-present-active-infinitive-form", "εἰμί — Present Active Infinitive Form", [
    ["εἶναι"],
  ]),
  formChart("lesson12-chart-eimi-future-middle-infinitive-form", "εἰμί — Future Middle Infinitive Form", [
    ["ἔσεσθαι"],
  ]),
] as const;
