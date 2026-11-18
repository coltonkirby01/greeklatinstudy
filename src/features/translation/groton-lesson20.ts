/**
 * Lesson 20 Translation Helper entries. Kept separate from the study-card
 * catalogue until the user requests Lesson 20 flashcards. The ten vocabulary
 * lemmata agree with independent transcriptions of Groton, Lesson 20;
 * the fourth principal parts below are corroborated by the user's scan of
 * Lesson 20 Greek-to-English exercises (p. 129).
 */
export type Lesson20Entry = {
  id: string;
  greek: string;
  meaning: string;
  part_of_speech: string;
  source_ref: string;
  fourth_principal_part?: string;
};
const ref = "Groton, From Alpha to Omega (4th ed.), Lesson 20 vocabulary";
export const lesson20Vocabulary: readonly Lesson20Entry[] = [
  { id: "lesson20-v1", greek: "ζητέω, ζητήσω, ἐζήτησα, ἐζήτηκα", meaning: "seek, search for, investigate; (+ infinitive) seek to", part_of_speech: "verb", source_ref: ref, fourth_principal_part: "ἐζήτηκα" },
  { id: "lesson20-v2", greek: "ῥίπτω, ῥίψω, ἔρριψα, ἔρριφα", meaning: "throw, hurl, cast aside", part_of_speech: "verb", source_ref: ref, fourth_principal_part: "ἔρριφα" },
  { id: "lesson20-v3", greek: "γῆ, γῆς, γῇ, γῆν, ἡ", meaning: "earth, ground, land; Γῆ: Earth personified", part_of_speech: "noun", source_ref: ref },
  { id: "lesson20-v4", greek: "δένδρον, -ου, τό", meaning: "tree", part_of_speech: "noun", source_ref: ref },
  { id: "lesson20-v5", greek: "Ἑλλάς, -άδος, ἡ", meaning: "Hellas, Greece", part_of_speech: "noun", source_ref: ref },
  { id: "lesson20-v6", greek: "Ἕλλην, -ηνος, ὁ, ἡ", meaning: "a Greek, a Hellene", part_of_speech: "noun", source_ref: ref },
  { id: "lesson20-v7", greek: "οὐρανός, -οῦ, ὁ", meaning: "sky, heaven; Οὐρανός: Sky personified", part_of_speech: "noun", source_ref: ref },
  { id: "lesson20-v8", greek: "Ἑλληνικός, -ή, -όν", meaning: "Greek, Hellenic", part_of_speech: "adjective", source_ref: ref },
  { id: "lesson20-v9", greek: "κατά (κατ’, καθ’) (+ gen., acc.)", meaning: "(+ gen.) down from, against; (+ acc.) down, along, according to, by", part_of_speech: "preposition", source_ref: ref },
  { id: "lesson20-v10", greek: "ὑπέρ (+ gen., acc.)", meaning: "(+ gen.) over, above, on behalf of; (+ acc.) over, beyond", part_of_speech: "preposition", source_ref: ref },
] as const;

export type Lesson20Perfect = {
  lemma: string;
  perfect: string;
  /** Explicitly attested or straightforwardly formed pluperfect base. */
  pluperfectBase?: string;
  source_ref: string;
};
const exerciseRef = "Groton, From Alpha to Omega (4th ed.), Lesson 20 Greek-to-English exercises, p. 129";
export const lesson20Perfects: readonly Lesson20Perfect[] = [
  { lemma: "λέγω", perfect: "εἴρηκα", source_ref: exerciseRef },
  { lemma: "πράττω", perfect: "πέπραχα", source_ref: exerciseRef },
  { lemma: "ἀκούω", perfect: "ἀκήκοα", pluperfectBase: "ἠκηκο", source_ref: exerciseRef },
  { lemma: "γράφω", perfect: "γέγραφα", source_ref: exerciseRef },
  { lemma: "πείθω", perfect: "πέποιθα", source_ref: exerciseRef },
  { lemma: "ἐθέλω", perfect: "ἠθέληκα", pluperfectBase: "ἠθεληκ", source_ref: exerciseRef },
  { lemma: "πέμπω", perfect: "πέπομφα", pluperfectBase: "ἐπεπομφ", source_ref: exerciseRef },
  { lemma: "βλέπω", perfect: "βέβλεφα", source_ref: exerciseRef },
  { lemma: "παιδεύω", perfect: "πεπαίδευκα", source_ref: exerciseRef },
  { lemma: "βλάπτω", perfect: "βέβλαφα", source_ref: exerciseRef },
  { lemma: "εὑρίσκω", perfect: "εὕρηκα", source_ref: exerciseRef },
  { lemma: "ζητέω", perfect: "ἐζήτηκα", source_ref: ref },
  { lemma: "ῥίπτω", perfect: "ἔρριφα", source_ref: ref },
] as const;

export type Lesson20AttestedForm = {
  id: string;
  form: string;
  morphology: string;
};
export const lesson20NounForms: readonly Lesson20AttestedForm[] = [
  { id: "lesson20-v3", form: "γῆ", morphology: "Nominative singular" },
  { id: "lesson20-v3", form: "γῆς", morphology: "Genitive singular" },
  { id: "lesson20-v3", form: "γῇ", morphology: "Dative singular" },
  { id: "lesson20-v3", form: "γῆν", morphology: "Accusative singular" },
  { id: "lesson20-v5", form: "Ἑλλάς", morphology: "Nominative singular" },
  { id: "lesson20-v5", form: "Ἑλλάδος", morphology: "Genitive singular" },
  { id: "lesson20-v5", form: "Ἑλλάδι", morphology: "Dative singular" },
  { id: "lesson20-v5", form: "Ἑλλάδα", morphology: "Accusative singular" },
  { id: "lesson20-v6", form: "Ἕλλην", morphology: "Nominative singular" },
  { id: "lesson20-v6", form: "Ἕλληνος", morphology: "Genitive singular" },
  { id: "lesson20-v6", form: "Ἕλληνι", morphology: "Dative singular" },
  { id: "lesson20-v6", form: "Ἕλληνα", morphology: "Accusative singular" },
  { id: "lesson20-v6", form: "Ἕλληνες", morphology: "Nominative plural" },
  { id: "lesson20-v6", form: "Ἑλλήνων", morphology: "Genitive plural" },
  { id: "lesson20-v6", form: "Ἕλλησι", morphology: "Dative plural" },
  { id: "lesson20-v6", form: "Ἕλλησιν", morphology: "Dative plural with movable nu" },
  { id: "lesson20-v6", form: "Ἕλληνας", morphology: "Accusative plural" },
] as const;
