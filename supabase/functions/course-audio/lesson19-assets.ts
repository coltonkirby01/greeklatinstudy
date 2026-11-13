import { greekToClassicalIpa, greekToElevenLabsIpa } from "./greek-ipa.ts";
import type { Lesson3CourseAudioAsset } from "./lesson3-assets.ts";

// Match the vocabulary source order and retain permanent lesson19-vN IDs.
// These declarations only resolve audio requests; they do not trigger paid TTS.
export const lesson19VocabularyAudio: Readonly<Record<string, { label: string; greek: string }>> = {
  "lesson19-v1": { label: "λαμβάνω, λήψομαι, ἔλαβον", greek: "λαμβάνω, λήψομαι, ἔλαβον" },
  "lesson19-v2": { label: "μένω, μενῶ, ἔμεινα", greek: "μένω, μενῶ, ἔμεινα" },
  "lesson19-v3": { label: "αἰτίᾱ, -ᾱς, ἡ", greek: "αἰτίᾱ" },
  "lesson19-v4": { label: "ἑαυτοῦ, -ῆς, -οῦ (αὑτοῦ, -ῆς, -οῦ)", greek: "ἑαυτοῦ, ἑαυτῆς, ἑαυτοῦ" },
  "lesson19-v5": { label: "ἐμαυτοῦ, -ῆς", greek: "ἐμαυτοῦ, ἐμαυτῆς" },
  "lesson19-v6": { label: "ἡμῶν αὐτῶν, -ῶν", greek: "ἡμῶν αὐτῶν" },
  "lesson19-v7": { label: "σεαυτοῦ, -ῆς (σαυτοῦ, -ῆς)", greek: "σεαυτοῦ, σεαυτῆς" },
  "lesson19-v8": { label: "ὑμῶν αὐτῶν, -ῶν", greek: "ὑμῶν αὐτῶν" },
  "lesson19-v9": { label: "αἴτιος, -ᾱ, -ον", greek: "αἴτιος, αἰτίᾱ, αἴτιον" },
  "lesson19-v10": { label: "μετά (μετ᾽, μεθ᾽) (+ gen., acc.)", greek: "μετά" },
  "lesson19-v11": { label: "σύν (+ dat.)", greek: "σύν" },
};

// Following previous lessons, pronounce complete charts column by column.
function chartAudio(id: string, label: string, columns: readonly (readonly string[])[]): Lesson3CourseAudioAsset {
  const normalizeCell = (value: string) => value.replace(/^[—-]/gu, "").replace(/\s*\/\s*/gu, ", ").replace(/[()]/gu, "").trim();
  const spokenColumns = columns.map((column) => column.map(normalizeCell).filter(Boolean));
  return {
    id,
    label,
    canonicalIpa: greekToClassicalIpa(spokenColumns.flat().join(", ")),
    ttsText: spokenColumns.map((column) => column.map(greekToElevenLabsIpa).filter(Boolean).join(" ")).filter(Boolean).join(" [pause] "),
  };
}

export const lesson19CourseAudioAssets: readonly Lesson3CourseAudioAsset[] = [
  chartAudio("lesson19-chart-second-aorist-active-indicative", "Second Aorist Active Indicative Endings", [["-ον", "-ες", "-ε(ν)"], ["-ομεν", "-ετε", "-ον"]]),
  chartAudio("lesson19-chart-second-aorist-middle-indicative", "Second Aorist Middle Indicative Endings", [["-όμην", "-ου (-εσο)", "-ετο"], ["-όμεθα", "-εσθε", "-οντο"]]),
  chartAudio("lesson19-chart-second-aorist-active-infinitive", "Second Aorist Active Infinitive Ending", [["-εῖν"]]),
  chartAudio("lesson19-chart-second-aorist-middle-infinitive", "Second Aorist Middle Infinitive Ending", [["-έσθαι"]]),
  chartAudio("lesson19-chart-second-aorist-active-imperative", "Second Aorist Active Imperative Endings", [["-ε", "-έτω"], ["-ετε", "-όντων"]]),
  chartAudio("lesson19-chart-second-aorist-middle-imperative", "Second Aorist Middle Imperative Endings", [["-οῦ (-εσο)", "-έσθω"], ["-εσθε", "-έσθων"]]),
  chartAudio("lesson19-chart-first-person-reflexive-pronouns", "First-Person Reflexive Pronoun Forms", [
    ["ἐμαυτοῦ", "ἐμαυτῷ", "ἐμαυτόν", "ἡμῶν αὐτῶν", "ἡμῖν αὐτοῖς", "ἡμᾶς αὐτούς"],
    ["ἐμαυτῆς", "ἐμαυτῇ", "ἐμαυτήν", "ἡμῶν αὐτῶν", "ἡμῖν αὐταῖς", "ἡμᾶς αὐτάς"],
  ]),
  chartAudio("lesson19-chart-second-person-reflexive-pronouns", "Second-Person Reflexive Pronoun Forms", [
    ["σεαυτοῦ / σαυτοῦ", "σεαυτῷ / σαυτῷ", "σεαυτόν / σαυτόν", "ὑμῶν αὐτῶν", "ὑμῖν αὐτοῖς", "ὑμᾶς αὐτούς"],
    ["σεαυτῆς / σαυτῆς", "σεαυτῇ / σαυτῇ", "σεαυτήν / σαυτήν", "ὑμῶν αὐτῶν", "ὑμῖν αὐταῖς", "ὑμᾶς αὐτάς"],
  ]),
  chartAudio("lesson19-chart-third-person-reflexive-pronouns", "Third-Person Reflexive Pronoun Forms", [
    ["ἑαυτοῦ / αὑτοῦ", "ἑαυτῷ / αὑτῷ", "ἑαυτόν / αὑτόν", "ἑαυτῶν", "ἑαυτοῖς", "ἑαυτούς"],
    ["ἑαυτῆς / αὑτῆς", "ἑαυτῇ / αὑτῇ", "ἑαυτήν / αὑτήν", "ἑαυτῶν", "ἑαυταῖς", "ἑαυτάς"],
    ["ἑαυτοῦ / αὑτοῦ", "ἑαυτῷ / αὑτῷ", "ἑαυτό / αὑτό", "ἑαυτῶν", "ἑαυτοῖς", "ἑαυτά"],
  ]),
] as const;
