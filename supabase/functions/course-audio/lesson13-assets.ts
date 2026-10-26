import { greekToClassicalIpa, greekToElevenLabsIpa } from "./greek-ipa.ts";
import type { Lesson3CourseAudioAsset } from "./lesson3-assets.ts";

function formChart(id: string, label: string, columns: readonly (readonly string[])[]): Lesson3CourseAudioAsset {
  const forms = columns.flat();
  return { id, label, canonicalIpa: greekToClassicalIpa(forms.join(", ")),
    ttsText: columns.map(column => column.map(greekToElevenLabsIpa).filter(Boolean).join(" ")).filter(Boolean).join(" [pause] ") };
}
export const lesson13VocabularyAudio: Readonly<Record<string, {label: string; greek: string}>> = {
  "lesson13-v1": { label: "βλέπω, βλέψομαι", greek: "βλέπω, βλέψομαι" },
  "lesson13-v2": { label: "σοφίᾱ, -ᾱς, ἡ", greek: "σοφίᾱ" },
  "lesson13-v3": { label: "φιλοσοφίᾱ, -ᾱς, ἡ", greek: "φιλοσοφίᾱ" },
  "lesson13-v4": { label: "ἐκεῖνος, -η, -ο", greek: "ἐκεῖνος, ἐκείνη, ἐκεῖνο" },
  "lesson13-v5": { label: "ὅδε, ἥδε, τόδε", greek: "ὅδε, ἥδε, τόδε" },
  "lesson13-v6": { label: "οὗτος, αὕτη, τοῦτο", greek: "οὗτος, αὕτη, τοῦτο" },
  "lesson13-v7": { label: "σοφός, -ή, -όν", greek: "σοφός" },
  "lesson13-v8": { label: "φιλόσοφος, -ον", greek: "φιλόσοφος" },
  "lesson13-v9": { label: "νῦν", greek: "νῦν" },
  "lesson13-v10": { label: "τότε (τότ᾽, τόθ᾽)", greek: "τότε (τότ᾽" },
  "lesson13-v11": { label: "γάρ", greek: "γάρ" },
};
export const lesson13CourseAudioAssets: readonly Lesson3CourseAudioAsset[] = [
  formChart("lesson13-chart-hode-singular-forms", "ὅδε — Singular Demonstrative Forms", [["ὅδε","τοῦδε","τῷδε","τόνδε"],["ἥδε","τῆσδε","τῇδε","τήνδε"],["τόδε","τοῦδε","τῷδε","τόδε"]]),
  formChart("lesson13-chart-hode-plural-forms", "ὅδε — Plural Demonstrative Forms", [["οἵδε","τῶνδε","τοῖσδε","τούσδε"],["αἵδε","τῶνδε","ταῖσδε","τάσδε"],["τάδε","τῶνδε","τοῖσδε","τάδε"]]),
  formChart("lesson13-chart-houtos-singular-forms", "οὗτος — Singular Demonstrative Forms", [["οὗτος","τούτου","τούτῳ","τοῦτον"],["αὕτη","ταύτης","ταύτῃ","ταύτην"],["τοῦτο","τούτου","τούτῳ","τοῦτο"]]),
  formChart("lesson13-chart-houtos-plural-forms", "οὗτος — Plural Demonstrative Forms", [["οὗτοι","τούτων","τούτοις","τούτους"],["αὗται","τούτων","ταύταις","ταύτᾱς"],["ταῦτα","τούτων","τούτοις","ταῦτα"]]),
  formChart("lesson13-chart-ekeinos-singular-forms", "ἐκεῖνος — Singular Demonstrative Forms", [["ἐκεῖνος","ἐκείνου","ἐκείνῳ","ἐκεῖνον"],["ἐκείνη","ἐκείνης","ἐκείνῃ","ἐκείνην"],["ἐκεῖνο","ἐκείνου","ἐκείνῳ","ἐκεῖνο"]]),
  formChart("lesson13-chart-ekeinos-plural-forms", "ἐκεῖνος — Plural Demonstrative Forms", [["ἐκεῖνοι","ἐκείνων","ἐκείνοις","ἐκείνους"],["ἐκεῖναι","ἐκείνων","ἐκείναις","ἐκείνᾱς"],["ἐκεῖνα","ἐκείνων","ἐκείνοις","ἐκεῖνα"]]),
] as const;
