import { greekToClassicalIpa, greekToElevenLabsIpa } from "./greek-ipa.ts";
import type { Lesson3CourseAudioAsset } from "./lesson3-assets.ts";

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

export const lesson11VocabularyAudio: Readonly<Record<string, { label: string; greek: string }>> = {
  "lesson11-v1": { label: "πείθω, πείσω", greek: "πείθω, πείσω" },
  "lesson11-v2": { label: "τρέπω, τρέψω", greek: "τρέπω, τρέψω" },
  "lesson11-v3": { label: "ἅμαξα", greek: "ἅμαξα" },
  "lesson11-v4": { label: "λίμνη", greek: "λίμνη" },
  "lesson11-v5": { label: "τόπος", greek: "τόπος" },
  "lesson11-v6": { label: "τρόπος", greek: "τρόπος" },
  "lesson11-v7": { label: "μακρός, -ά, -όν", greek: "μακρός, μακρά, μακρόν" },
  "lesson11-v8": { label: "μικρός, -ά, -όν", greek: "μικρός, μικρά, μικρόν" },
  "lesson11-v9": { label: "πόρρω", greek: "πόρρω" },
  "lesson11-v10": { label: "ὑπό", greek: "ὑπό" },
};

export const lesson11CourseAudioAssets: readonly Lesson3CourseAudioAsset[] = [
  endingChart("lesson11-chart-present-middle-passive-indicative-endings", "Present Middle/Passive Indicative Endings", [
    ["-ομαι", "-ῃ", "-εται"],
    ["-ομεθα", "-εσθε", "-ονται"],
  ]),
  endingChart("lesson11-chart-present-middle-passive-infinitive-endings", "Present Middle/Passive Infinitive Endings", [
    ["-εσθαι"],
  ]),
  endingChart("lesson11-chart-future-middle-indicative-endings", "Future Middle Indicative Endings", [
    ["-σομαι", "-σῃ", "-σεται"],
    ["-σομεθα", "-σεσθε", "-σονται"],
  ]),
  endingChart("lesson11-chart-future-middle-infinitive-endings", "Future Middle Infinitive Endings", [
    ["-σεσθαι"],
  ]),
  endingChart("lesson11-chart-imperfect-middle-passive-indicative-endings", "Imperfect Middle/Passive Indicative Endings", [
    ["-όμην", "-ου", "-ετο"],
    ["-όμεθα", "-εσθε", "-οντο"],
  ]),
  endingChart("lesson11-chart-present-middle-passive-imperative-endings", "Present Middle/Passive Imperative Endings", [
    ["-ου", "-εσθω"],
    ["-εσθε", "-εσθων"],
  ]),
] as const;
