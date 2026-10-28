import { greekToClassicalIpa, greekToElevenLabsIpa } from "./greek-ipa.ts";
import type { Lesson3CourseAudioAsset } from "./lesson3-assets.ts";

function formChart(id: string, label: string, columns: readonly (readonly string[])[]): Lesson3CourseAudioAsset {
  const forms = columns.flat();
  return { id, label, canonicalIpa: greekToClassicalIpa(forms.join(", ")),
    ttsText: columns.map(column => column.map(greekToElevenLabsIpa).filter(Boolean).join(" ")).filter(Boolean).join(" [pause] ") };
}
export const lesson14VocabularyAudio: Readonly<Record<string, {label: string; greek: string}>> = {
  "lesson14-v1": { label: "πλήττω, πλήξω", greek: "πλήττω, πλήξω" },
  "lesson14-v2": { label: "φέρω, οἴσω", greek: "φέρω, οἴσω" },
  "lesson14-v3": { label: "βιβλίον, -ου, τό", greek: "βιβλίον" },
  "lesson14-v4": { label: "ἱμάτιον, -ου, τό", greek: "ἱμάτιον" },
  "lesson14-v5": { label: "ἐγώ", greek: "ἐγώ" },
  "lesson14-v6": { label: "ἡμεῖς", greek: "ἡμεῖς" },
  "lesson14-v7": { label: "σύ", greek: "σύ" },
  "lesson14-v8": { label: "ὑμεῖς", greek: "ὑμεῖς" },
  "lesson14-v9": { label: "αὐτός, αὐτή, αὐτό", greek: "αὐτός, αὐτή, αὐτό" },
  "lesson14-v10": { label: "ἐπί (ἐπ᾽, ἐφ᾽)", greek: "ἐπί (ἐπ᾽" },
};
export const lesson14CourseAudioAssets: readonly Lesson3CourseAudioAsset[] = [
  formChart("lesson14-chart-first-person-forms", "First-Person Personal Pronoun Forms", [["ἐγώ","ἐμοῦ, μου","ἐμοί, μοι","ἐμέ, με"],["ἡμεῖς","ἡμῶν","ἡμῖν","ἡμᾶς"]]),
  formChart("lesson14-chart-second-person-forms", "Second-Person Personal Pronoun Forms", [["σύ","σοῦ, σου","σοί, σοι","σέ, σε"],["ὑμεῖς","ὑμῶν","ὑμῖν","ὑμᾶς"]]),
  formChart("lesson14-chart-autos-singular-forms", "αὐτός — Third-Person/Intensive Forms (Singular & Plural)", [
    ["αὐτός","αὐτοῦ","αὐτῷ","αὐτόν","αὐτοί","αὐτῶν","αὐτοῖς","αὐτούς"],
    ["αὐτή","αὐτῆς","αὐτῇ","αὐτήν","αὐταί","αὐτῶν","αὐταῖς","αὐτάς"],
    ["αὐτό","αὐτοῦ","αὐτῷ","αὐτό","αὐτά","αὐτῶν","αὐτοῖς","αὐτά"],
  ]),
] as const;
