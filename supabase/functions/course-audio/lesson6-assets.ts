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

export const lesson6VocabularyAudio: Readonly<Record<string, { label: string; greek: string }>> = {
  "lesson6-v1": { label: "ἀλλάττω, ἀλλάξω, ἤλλαξα", greek: "ἀλλάττω, ἀλλάξω, ἤλλαξα" },
  "lesson6-v2": { label: "διώκω, διώξω, ἐδίωξα", greek: "διώκω, διώξω, ἐδίωξα" },
  "lesson6-v3": { label: "ἔχω, ἕξω/σχήσω, ἔσχον", greek: "ἔχω, ἕξω, σχήσω, ἔσχον" },
  "lesson6-v4": { label: "μέλλω, μελλήσω, ἐμέλλησα", greek: "μέλλω, μελλήσω, ἐμέλλησα" },
  "lesson6-v5": { label: "κόρη", greek: "κόρη, κόρης, ἡ" },
  "lesson6-v6": { label: "οἰκίᾱ", greek: "οἰκίᾱ, οἰκίᾱς, ἡ" },
  "lesson6-v7": { label: "ἔτι", greek: "ἔτι" },
  "lesson6-v8": { label: "μηκέτι", greek: "μηκέτι" },
  "lesson6-v9": { label: "οὐκέτι", greek: "οὐκέτι" },
  "lesson6-v10": { label: "πάλιν", greek: "πάλιν" },
  "lesson6-v11": { label: "ἀλλά", greek: "ἀλλά" },
};

/** Future paradigms and endings are spoken vertically: singular first, then plural. */
export const lesson6CourseAudioAssets: readonly Lesson3CourseAudioAsset[] = [
  endingChart("lesson6-chart-future-active-indicative-endings", "Future Active Indicative Endings", [
    ["-σω", "-σεις", "-σει"],
    ["-σομεν", "-σετε", "-σουσι(ν)"],
  ]),
  endingChart("lesson6-chart-future-active-infinitive-endings", "Future Active Infinitive Ending", [["-σειν"]]),
  paradigm("lesson6-chart-future-active-indicative", "Future Active Indicative", [
    "παιδεύσω", "παιδεύσεις", "παιδεύσει",
    "παιδεύσομεν", "παιδεύσετε", "παιδεύσουσι(ν)",
  ]),
  paradigm("lesson6-chart-future-active-infinitive", "Future Active Infinitive", ["παιδεύσειν"]),
] as const;
