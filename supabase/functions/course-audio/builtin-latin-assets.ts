import {
  MEDIEVAL_LATIN_PRONUNCIATION_SYSTEM,
  latinParadigmToElevenLabsIpa,
  latinToMedievalIpa,
} from "./medieval-latin-ipa.ts";

export type LatinCourseAudioAsset = {
  id: string;
  label: string;
  canonicalIpa: string;
  ttsText: string;
  pronunciationSystem: string;
};

type ParadigmSpec = {
  id: string;
  label: string;
  stem: string;
  singular: readonly string[];
  plural: readonly string[];
};

type FullParadigmSpec = {
  id: string;
  label: string;
  singular: readonly string[];
  plural: readonly string[];
};

function paradigm(spec: ParadigmSpec): LatinCourseAudioAsset {
  const singular = spec.singular.map((ending) => `${spec.stem}-${ending}`);
  const plural = spec.plural.map((ending) => `${spec.stem}-${ending}`);
  const allForms = [...singular, ...plural];
  return {
    id: spec.id,
    label: spec.label,
    canonicalIpa: latinToMedievalIpa(allForms.join(", ")),
    ttsText: latinParadigmToElevenLabsIpa([singular, plural]),
    pronunciationSystem: MEDIEVAL_LATIN_PRONUNCIATION_SYSTEM,
  };
}

function fullParadigm(spec: FullParadigmSpec): LatinCourseAudioAsset {
  const allForms = [...spec.singular, ...spec.plural];
  return {
    id: spec.id,
    label: spec.label,
    canonicalIpa: latinToMedievalIpa(allForms.join(", ")),
    ttsText: latinParadigmToElevenLabsIpa([spec.singular, spec.plural]),
    pronunciationSystem: MEDIEVAL_LATIN_PRONUNCIATION_SYSTEM,
  };
}

const activeSpecs: readonly ParadigmSpec[] = [
  { id: "latin-active-indicative-present-1st", label: "Active Voice, Indicative Mood, Present Tense, 1st Conjugation", stem: "laud", singular: ["ō", "ās", "at"], plural: ["āmus", "ātis", "ant"] },
  { id: "latin-active-indicative-present-2nd", label: "Active Voice, Indicative Mood, Present Tense, 2nd Conjugation", stem: "mon", singular: ["eō", "ēs", "et"], plural: ["ēmus", "ētis", "ent"] },
  { id: "latin-active-indicative-present-3rd", label: "Active Voice, Indicative Mood, Present Tense, 3rd Conjugation", stem: "mitt", singular: ["ō", "is", "it"], plural: ["imus", "itis", "unt"] },
  { id: "latin-active-indicative-present-4th", label: "Active Voice, Indicative Mood, Present Tense, 4th Conjugation", stem: "aud", singular: ["iō", "īs", "it"], plural: ["īmus", "ītis", "iunt"] },

  { id: "latin-active-indicative-imperfect-1st", label: "Active Voice, Indicative Mood, Imperfect Tense, 1st Conjugation", stem: "laud", singular: ["ābam", "ābās", "ābat"], plural: ["ābāmus", "ābātis", "ābant"] },
  { id: "latin-active-indicative-imperfect-2nd", label: "Active Voice, Indicative Mood, Imperfect Tense, 2nd Conjugation", stem: "mon", singular: ["ēbam", "ēbās", "ēbat"], plural: ["ēbāmus", "ēbātis", "ēbant"] },
  { id: "latin-active-indicative-imperfect-3rd", label: "Active Voice, Indicative Mood, Imperfect Tense, 3rd Conjugation", stem: "mitt", singular: ["ēbam", "ēbās", "ēbat"], plural: ["ēbāmus", "ēbātis", "ēbant"] },
  { id: "latin-active-indicative-imperfect-4th", label: "Active Voice, Indicative Mood, Imperfect Tense, 4th Conjugation", stem: "aud", singular: ["iēbam", "iēbās", "iēbat"], plural: ["iēbāmus", "iēbātis", "iēbant"] },

  { id: "latin-active-indicative-future-1st", label: "Active Voice, Indicative Mood, Future Tense, 1st Conjugation", stem: "laud", singular: ["ābō", "ābis", "ābit"], plural: ["ābimus", "ābitis", "ābunt"] },
  { id: "latin-active-indicative-future-2nd", label: "Active Voice, Indicative Mood, Future Tense, 2nd Conjugation", stem: "mon", singular: ["ēbō", "ēbis", "ēbit"], plural: ["ēbimus", "ēbitis", "ēbunt"] },
  { id: "latin-active-indicative-future-3rd", label: "Active Voice, Indicative Mood, Future Tense, 3rd Conjugation", stem: "mitt", singular: ["am", "ēs", "et"], plural: ["ēmus", "ētis", "ent"] },
  { id: "latin-active-indicative-future-4th", label: "Active Voice, Indicative Mood, Future Tense, 4th Conjugation", stem: "aud", singular: ["iam", "iēs", "iet"], plural: ["iēmus", "iētis", "ient"] },

  { id: "latin-active-indicative-perfect-1st", label: "Active Voice, Indicative Mood, Perfect Tense, 1st Conjugation", stem: "laudāv", singular: ["ī", "istī", "it"], plural: ["imus", "istis", "ērunt"] },
  { id: "latin-active-indicative-perfect-2nd", label: "Active Voice, Indicative Mood, Perfect Tense, 2nd Conjugation", stem: "monu", singular: ["ī", "istī", "it"], plural: ["imus", "istis", "ērunt"] },
  { id: "latin-active-indicative-perfect-3rd", label: "Active Voice, Indicative Mood, Perfect Tense, 3rd Conjugation", stem: "mīs", singular: ["ī", "istī", "it"], plural: ["imus", "istis", "ērunt"] },
  { id: "latin-active-indicative-perfect-4th", label: "Active Voice, Indicative Mood, Perfect Tense, 4th Conjugation", stem: "audīv", singular: ["ī", "istī", "it"], plural: ["imus", "istis", "ērunt"] },

  { id: "latin-active-indicative-pluperfect-1st", label: "Active Voice, Indicative Mood, Pluperfect Tense, 1st Conjugation", stem: "laudāv", singular: ["eram", "erās", "erat"], plural: ["erāmus", "erātis", "erant"] },
  { id: "latin-active-indicative-pluperfect-2nd", label: "Active Voice, Indicative Mood, Pluperfect Tense, 2nd Conjugation", stem: "monu", singular: ["eram", "erās", "erat"], plural: ["erāmus", "erātis", "erant"] },
  { id: "latin-active-indicative-pluperfect-3rd", label: "Active Voice, Indicative Mood, Pluperfect Tense, 3rd Conjugation", stem: "mīs", singular: ["eram", "erās", "erat"], plural: ["erāmus", "erātis", "erant"] },
  { id: "latin-active-indicative-pluperfect-4th", label: "Active Voice, Indicative Mood, Pluperfect Tense, 4th Conjugation", stem: "audīv", singular: ["eram", "erās", "erat"], plural: ["erāmus", "erātis", "erant"] },

  { id: "latin-active-indicative-future-perfect-1st", label: "Active Voice, Indicative Mood, Future Perfect Tense, 1st Conjugation", stem: "laudāv", singular: ["erō", "eris", "erit"], plural: ["erimus", "eritis", "erint"] },
  { id: "latin-active-indicative-future-perfect-2nd", label: "Active Voice, Indicative Mood, Future Perfect Tense, 2nd Conjugation", stem: "monu", singular: ["erō", "eris", "erit"], plural: ["erimus", "eritis", "erint"] },
  { id: "latin-active-indicative-future-perfect-3rd", label: "Active Voice, Indicative Mood, Future Perfect Tense, 3rd Conjugation", stem: "mīs", singular: ["erō", "eris", "erit"], plural: ["erimus", "eritis", "erint"] },
  { id: "latin-active-indicative-future-perfect-4th", label: "Active Voice, Indicative Mood, Future Perfect Tense, 4th Conjugation", stem: "audīv", singular: ["erō", "eris", "erit"], plural: ["erimus", "eritis", "erint"] },
];

const passiveSpecs: readonly ParadigmSpec[] = [
  { id: "latin-passive-indicative-present-1st", label: "Passive Voice, Indicative Mood, Present Tense, 1st Conjugation", stem: "laud", singular: ["or", "āris", "ātur"], plural: ["āmur", "āminī", "antur"] },
  { id: "latin-passive-indicative-present-2nd", label: "Passive Voice, Indicative Mood, Present Tense, 2nd Conjugation", stem: "mon", singular: ["eor", "ēris", "ētur"], plural: ["ēmur", "ēminī", "entur"] },
  { id: "latin-passive-indicative-present-3rd", label: "Passive Voice, Indicative Mood, Present Tense, 3rd Conjugation", stem: "mitt", singular: ["or", "eris", "itur"], plural: ["imur", "iminī", "untur"] },
  { id: "latin-passive-indicative-present-4th", label: "Passive Voice, Indicative Mood, Present Tense, 4th Conjugation", stem: "aud", singular: ["ior", "īris", "ītur"], plural: ["īmur", "īminī", "iuntur"] },

  { id: "latin-passive-indicative-imperfect-1st", label: "Passive Voice, Indicative Mood, Imperfect Tense, 1st Conjugation", stem: "laud", singular: ["ābar", "ābāris", "ābātur"], plural: ["ābāmur", "ābāminī", "ābantur"] },
  { id: "latin-passive-indicative-imperfect-2nd", label: "Passive Voice, Indicative Mood, Imperfect Tense, 2nd Conjugation", stem: "mon", singular: ["ēbar", "ēbāris", "ēbātur"], plural: ["ēbāmur", "ēbāminī", "ēbantur"] },
  { id: "latin-passive-indicative-imperfect-3rd", label: "Passive Voice, Indicative Mood, Imperfect Tense, 3rd Conjugation", stem: "mitt", singular: ["ēbar", "ēbāris", "ēbātur"], plural: ["ēbāmur", "ēbāminī", "ēbantur"] },
  { id: "latin-passive-indicative-imperfect-4th", label: "Passive Voice, Indicative Mood, Imperfect Tense, 4th Conjugation", stem: "aud", singular: ["iēbar", "iēbāris", "iēbātur"], plural: ["iēbāmur", "iēbāminī", "iēbantur"] },

  { id: "latin-passive-indicative-future-1st", label: "Passive Voice, Indicative Mood, Future Tense, 1st Conjugation", stem: "laud", singular: ["ābor", "āberis", "ābitur"], plural: ["ābimur", "ābiminī", "ābuntur"] },
  { id: "latin-passive-indicative-future-2nd", label: "Passive Voice, Indicative Mood, Future Tense, 2nd Conjugation", stem: "mon", singular: ["ēbor", "ēberis", "ēbitur"], plural: ["ēbimur", "ēbiminī", "ēbuntur"] },
  { id: "latin-passive-indicative-future-3rd", label: "Passive Voice, Indicative Mood, Future Tense, 3rd Conjugation", stem: "mitt", singular: ["ar", "ēris", "ētur"], plural: ["ēmur", "ēminī", "entur"] },
  { id: "latin-passive-indicative-future-4th", label: "Passive Voice, Indicative Mood, Future Tense, 4th Conjugation", stem: "aud", singular: ["iar", "iēris", "iētur"], plural: ["iēmur", "iēminī", "ientur"] },
];


const activeSubjunctiveSpecs: readonly ParadigmSpec[] = [
  { id: "latin-active-subjunctive-present-1st", label: "Active Voice, Subjunctive Mood, Present Tense, 1st Conjugation", stem: "laud", singular: ["em", "ēs", "et"], plural: ["ēmus", "ētis", "ent"] },
  { id: "latin-active-subjunctive-present-2nd", label: "Active Voice, Subjunctive Mood, Present Tense, 2nd Conjugation", stem: "mon", singular: ["eam", "eās", "eat"], plural: ["eāmus", "eātis", "eant"] },
  { id: "latin-active-subjunctive-present-3rd", label: "Active Voice, Subjunctive Mood, Present Tense, 3rd Conjugation", stem: "mitt", singular: ["am", "ās", "at"], plural: ["āmus", "ātis", "ant"] },
  { id: "latin-active-subjunctive-present-4th", label: "Active Voice, Subjunctive Mood, Present Tense, 4th Conjugation", stem: "aud", singular: ["iam", "iās", "iat"], plural: ["iāmus", "iātis", "iant"] },
  { id: "latin-active-subjunctive-imperfect-1st", label: "Active Voice, Subjunctive Mood, Imperfect Tense, 1st Conjugation", stem: "laud", singular: ["ārem", "ārēs", "āret"], plural: ["ārēmus", "ārētis", "ārent"] },
  { id: "latin-active-subjunctive-imperfect-2nd", label: "Active Voice, Subjunctive Mood, Imperfect Tense, 2nd Conjugation", stem: "mon", singular: ["ērem", "ērēs", "ēret"], plural: ["ērēmus", "ērētis", "ērent"] },
  { id: "latin-active-subjunctive-imperfect-3rd", label: "Active Voice, Subjunctive Mood, Imperfect Tense, 3rd Conjugation", stem: "mitt", singular: ["erem", "erēs", "eret"], plural: ["erēmus", "erētis", "erent"] },
  { id: "latin-active-subjunctive-imperfect-4th", label: "Active Voice, Subjunctive Mood, Imperfect Tense, 4th Conjugation", stem: "aud", singular: ["īrem", "īrēs", "īret"], plural: ["īrēmus", "īrētis", "īrent"] },
  { id: "latin-active-subjunctive-perfect-1st", label: "Active Voice, Subjunctive Mood, Perfect Tense, 1st Conjugation", stem: "laudāv", singular: ["erim", "eris", "erit"], plural: ["erimus", "eritis", "erint"] },
  { id: "latin-active-subjunctive-perfect-2nd", label: "Active Voice, Subjunctive Mood, Perfect Tense, 2nd Conjugation", stem: "monu", singular: ["erim", "eris", "erit"], plural: ["erimus", "eritis", "erint"] },
  { id: "latin-active-subjunctive-perfect-3rd", label: "Active Voice, Subjunctive Mood, Perfect Tense, 3rd Conjugation", stem: "mīs", singular: ["erim", "eris", "erit"], plural: ["erimus", "eritis", "erint"] },
  { id: "latin-active-subjunctive-perfect-4th", label: "Active Voice, Subjunctive Mood, Perfect Tense, 4th Conjugation", stem: "audīv", singular: ["erim", "eris", "erit"], plural: ["erimus", "eritis", "erint"] },
  { id: "latin-active-subjunctive-pluperfect-1st", label: "Active Voice, Subjunctive Mood, Pluperfect Tense, 1st Conjugation", stem: "laudāv", singular: ["issem", "issēs", "isset"], plural: ["issēmus", "issētis", "issent"] },
  { id: "latin-active-subjunctive-pluperfect-2nd", label: "Active Voice, Subjunctive Mood, Pluperfect Tense, 2nd Conjugation", stem: "monu", singular: ["issem", "issēs", "isset"], plural: ["issēmus", "issētis", "issent"] },
  { id: "latin-active-subjunctive-pluperfect-3rd", label: "Active Voice, Subjunctive Mood, Pluperfect Tense, 3rd Conjugation", stem: "mīs", singular: ["issem", "issēs", "isset"], plural: ["issēmus", "issētis", "issent"] },
  { id: "latin-active-subjunctive-pluperfect-4th", label: "Active Voice, Subjunctive Mood, Pluperfect Tense, 4th Conjugation", stem: "audīv", singular: ["issem", "issēs", "isset"], plural: ["issēmus", "issētis", "issent"] },
];

const passiveSubjunctiveSimpleSpecs: readonly ParadigmSpec[] = [
  { id: "latin-passive-subjunctive-present-1st", label: "Passive Voice, Subjunctive Mood, Present Tense, 1st Conjugation", stem: "laud", singular: ["er", "ēris", "ētur"], plural: ["ēmur", "ēminī", "entur"] },
  { id: "latin-passive-subjunctive-present-2nd", label: "Passive Voice, Subjunctive Mood, Present Tense, 2nd Conjugation", stem: "mon", singular: ["ear", "eāris", "eātur"], plural: ["eāmur", "eāminī", "eantur"] },
  { id: "latin-passive-subjunctive-present-3rd", label: "Passive Voice, Subjunctive Mood, Present Tense, 3rd Conjugation", stem: "mitt", singular: ["ar", "āris", "ātur"], plural: ["āmur", "āminī", "antur"] },
  { id: "latin-passive-subjunctive-present-4th", label: "Passive Voice, Subjunctive Mood, Present Tense, 4th Conjugation", stem: "aud", singular: ["iar", "iāris", "iātur"], plural: ["iāmur", "iāminī", "iantur"] },
  { id: "latin-passive-subjunctive-imperfect-1st", label: "Passive Voice, Subjunctive Mood, Imperfect Tense, 1st Conjugation", stem: "laud", singular: ["ārer", "ārēris", "ārētur"], plural: ["ārēmur", "ārēminī", "ārentur"] },
  { id: "latin-passive-subjunctive-imperfect-2nd", label: "Passive Voice, Subjunctive Mood, Imperfect Tense, 2nd Conjugation", stem: "mon", singular: ["ērer", "ērēris", "ērētur"], plural: ["ērēmur", "ērēminī", "ērentur"] },
  { id: "latin-passive-subjunctive-imperfect-3rd", label: "Passive Voice, Subjunctive Mood, Imperfect Tense, 3rd Conjugation", stem: "mitt", singular: ["erer", "erēris", "erētur"], plural: ["erēmur", "erēminī", "erentur"] },
  { id: "latin-passive-subjunctive-imperfect-4th", label: "Passive Voice, Subjunctive Mood, Imperfect Tense, 4th Conjugation", stem: "aud", singular: ["īrer", "īrēris", "īrētur"], plural: ["īrēmur", "īrēminī", "īrentur"] },
];

const passiveSubjunctivePeriphrasticSpecs: readonly FullParadigmSpec[] = [
  { id: "latin-passive-subjunctive-perfect-1st", label: "Passive Voice, Subjunctive Mood, Perfect Tense, 1st Conjugation", singular: ["laudātus (a, um) sim", "laudātus (a, um) sīs", "laudātus (a, um) sit"], plural: ["laudātī (ae, a) sīmus", "laudātī (ae, a) sītis", "laudātī (ae, a) sint"] },
  { id: "latin-passive-subjunctive-perfect-2nd", label: "Passive Voice, Subjunctive Mood, Perfect Tense, 2nd Conjugation", singular: ["monitus (a, um) sim", "monitus (a, um) sīs", "monitus (a, um) sit"], plural: ["monitī (ae, a) sīmus", "monitī (ae, a) sītis", "monitī (ae, a) sint"] },
  { id: "latin-passive-subjunctive-perfect-3rd", label: "Passive Voice, Subjunctive Mood, Perfect Tense, 3rd Conjugation", singular: ["missus (a, um) sim", "missus (a, um) sīs", "missus (a, um) sit"], plural: ["missī (ae, a) sīmus", "missī (ae, a) sītis", "missī (ae, a) sint"] },
  { id: "latin-passive-subjunctive-perfect-4th", label: "Passive Voice, Subjunctive Mood, Perfect Tense, 4th Conjugation", singular: ["audītus (a, um) sim", "audītus (a, um) sīs", "audītus (a, um) sit"], plural: ["audītī (ae, a) sīmus", "audītī (ae, a) sītis", "audītī (ae, a) sint"] },
  { id: "latin-passive-subjunctive-pluperfect-1st", label: "Passive Voice, Subjunctive Mood, Pluperfect Tense, 1st Conjugation", singular: ["laudātus (a, um) essem", "laudātus (a, um) essēs", "laudātus (a, um) esset"], plural: ["laudātī (ae, a) essēmus", "laudātī (ae, a) essētis", "laudātī (ae, a) essent"] },
  { id: "latin-passive-subjunctive-pluperfect-2nd", label: "Passive Voice, Subjunctive Mood, Pluperfect Tense, 2nd Conjugation", singular: ["monitus (a, um) essem", "monitus (a, um) essēs", "monitus (a, um) esset"], plural: ["monitī (ae, a) essēmus", "monitī (ae, a) essētis", "monitī (ae, a) essent"] },
  { id: "latin-passive-subjunctive-pluperfect-3rd", label: "Passive Voice, Subjunctive Mood, Pluperfect Tense, 3rd Conjugation", singular: ["missus (a, um) essem", "missus (a, um) essēs", "missus (a, um) esset"], plural: ["missī (ae, a) essēmus", "missī (ae, a) essētis", "missī (ae, a) essent"] },
  { id: "latin-passive-subjunctive-pluperfect-4th", label: "Passive Voice, Subjunctive Mood, Pluperfect Tense, 4th Conjugation", singular: ["audītus (a, um) essem", "audītus (a, um) essēs", "audītus (a, um) esset"], plural: ["audītī (ae, a) essēmus", "audītī (ae, a) essētis", "audītī (ae, a) essent"] },
];

export const latinParadigmAudioAssets: readonly LatinCourseAudioAsset[] = [
  ...activeSpecs.map(paradigm),
  ...activeSubjunctiveSpecs.map(paradigm),
  ...passiveSpecs.map(paradigm),
  ...passiveSubjunctiveSimpleSpecs.map(paradigm),
  ...passiveSubjunctivePeriphrasticSpecs.map(fullParadigm),
];

const byId = new Map(latinParadigmAudioAssets.map((asset) => [asset.id, asset]));

export function resolveBuiltinLatinAsset(assetId: string): LatinCourseAudioAsset | null {
  return byId.get(assetId) ?? null;
}
