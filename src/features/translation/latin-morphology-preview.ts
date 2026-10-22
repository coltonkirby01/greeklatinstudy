/** Format the source's individual Latin analyses for compact dictionary choice previews.
 * Do not combine fields across ambiguous Whitaker analyses or infer morphology. */
const nounCases: Record<string, string> = {
  nominative: "Nom", genitive: "Gen", dative: "Dat", accusative: "Acc",
  ablative: "Abl", vocative: "Voc", locative: "Loc",
};
const genders: Record<string, string> = {
  masculine: "M", feminine: "F", neuter: "N", "common gender": "M/F",
};
const tenses: Record<string, string> = {
  present: "Pres", imperfect: "Impf", future: "Fut", perfect: "Perf",
  pluperfect: "Plup", "future perfect": "Fut Perf",
};
const persons: Record<string, string> = {
  "first person": "1", "second person": "2", "third person": "3",
};
const voices: Record<string, string> = { active: "Act", passive: "Pass" };
const moods: Record<string, string> = {
  indicative: "Ind", subjunctive: "Sub", imperative: "Imp", infinitive: "Inf",
};

function formattedLatinForm(form: string, expectedPartOfSpeech?: string): string | null {
  const fields = form.toLocaleLowerCase().split(/\s*·\s*/u).map((field) => field.trim());
  const partOfSpeech = fields[0];
  const expected = expectedPartOfSpeech?.trim().toLocaleLowerCase();
  // A result can have mixed noun and supine analyses; report only the relevant one.
  if (expected && partOfSpeech !== expected) return null;

  if (["noun", "adjective", "pronoun", "participle", "numeral"].includes(partOfSpeech)) {
    const grammaticalCase = fields.find((field) => nounCases[field]);
    const number = fields.includes("singular") ? "S" : fields.includes("plural") ? "P" : null;
    const gender = fields.find((field) => genders[field]);
    const pieces = [grammaticalCase ? nounCases[grammaticalCase] : null, number, gender ? genders[gender] : null].filter(Boolean);
    return pieces.length ? pieces.join(" ") : null;
  }
  if (partOfSpeech === "verb") {
    const tense = fields.find((field) => tenses[field]);
    const person = fields.find((field) => persons[field]);
    const number = fields.includes("singular") ? "S" : fields.includes("plural") ? "P" : null;
    const voice = fields.find((field) => voices[field]);
    const mood = fields.find((field) => moods[field]);
    const pieces = [
      tense ? tenses[tense] : null,
      person && number ? persons[person] + number : null,
      voice ? voices[voice] : null,
      mood ? moods[mood] : null,
    ].filter(Boolean);
    return pieces.length ? pieces.join(" ") : null;
  }
  return null;
}

/** Abbreviations: noun case / number / gender; verb tense / person-number / voice / mood. */
export function latinGrammaticalPreview(forms?: readonly string[], partOfSpeech?: string): string | null {
  if (!forms?.length) return null;
  const candidates = [...new Set(forms.map((form) => formattedLatinForm(form, partOfSpeech)).filter((value): value is string => Boolean(value)))];
  if (!candidates.length) return null;
  const shown = candidates.slice(0, 3);
  return shown.join(" / ") + (candidates.length > shown.length ? " / +" + (candidates.length - shown.length) + " more" : "");
}
