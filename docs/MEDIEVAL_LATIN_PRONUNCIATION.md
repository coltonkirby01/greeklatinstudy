# Medieval Latin pronunciation policy

## Learner-facing label

Use **Medieval Latin** in the study interface.

The internal pronunciation profile is a deliberately normalized **scholastic Medieval Latin** reconstruction. It is intended for theology, philosophy, and general medieval reading without tying the learner to one narrow national accent. Parisian/French scholastic evidence is useful context, but the production pronunciation must remain broadly intelligible to learners who also encounter Classical, patristic, Renaissance, or modern ecclesiastical Latin.

## Source hierarchy

The pronunciation engine is source-led rather than inferred from ElevenLabs defaults.

1. **A. G. Rigg, “Orthography and Pronunciation,” in _Medieval Latin: An Introduction and Bibliographical Guide_**, ed. F. A. C. Mantello and A. G. Rigg (Catholic University of America Press, 1996), pp. 79–82. This is the practical first authority for widespread medieval developments and for identifying changes that were nearly pan-European.
2. **Peter Stotz, _Handbuch zur lateinischen Sprache des Mittelalters_, vol. 3, _Lautlehre_**. This is the deeper technical control source for the history of medieval Latin sounds and spellings across regions and periods.
3. **Timothy J. McGee, A. G. Rigg, and David N. Klausner, eds., _Singing Early Music: The Pronunciation of European Languages in the Late Middle Ages and Renaissance_**, especially Harold Copeman’s regional Latin treatments. Use these comparatively: a feature found across several regional traditions is a stronger candidate for the normalized profile than a feature peculiar to France, England, Germany, or Italy.
4. **W. Sidney Allen, _Vox Latina_**. Use this only as the Classical baseline: it helps preserve recognizable Latin word structure and the inherited stress system, but it does not govern the medieval profile.

Useful public reference pages used when establishing this policy:

- Rigg excerpt: https://www.cultus.hk/latin_medieval/readings/Orthography%20and%20Pronunciation.pdf
- Stotz project description (University of Zürich): https://www.iaka.uzh.ch/de/klph/research/mlat/perfectae/handbuch.html
- McGee/Rigg/Klausner volume: https://iupress.org/9780253210265/singing-early-music/
- Allen, _Vox Latina_: https://www.cambridge.org/core/books/vox-latina/0D460CEF06E5B2210ABA29EDB6AB5F2A

## Normalization principle

The goal is not “the exact accent of a Paris master in 1270.” Medieval Latin was pronounced differently in different places. The goal is a historically informed common denominator suitable for scholastic study.

Prefer a pronunciation feature when:

- Rigg or Stotz treats the development as widespread rather than narrowly local;
- several regional reconstructions point in the same direction;
- it preserves the identity of the written Latin word clearly enough for transfer to other Latin pronunciation systems.

Avoid or soften a feature when:

- it is strongly regional;
- the evidence changes substantially by century or locality;
- adopting it would make ordinary Latin unnecessarily difficult to recognize outside that one tradition.

Rigg explicitly warns that medieval Latin pronunciation had diverged so far regionally that only broad phonemic contrasts can be reconstructed with confidence. That warning is part of the design: the site should normalize rather than pretend to reproduce one local speaker exactly.

## Phase-one high-confidence rules

These are safe enough to encode before paid audio generation:

- **Instructional morphology is not spoken.** A card such as `laud-āmus` is pronounced as the complete word `laudāmus`; a stem/ending hyphen is visual only.
- **`ae` and `oe` are monophthongized to an e-quality vowel.** Rigg identifies this as one of the changes that became nearly universal across medieval Europe.
- **Classical vowel length is not maintained as a phonemic long/short contrast in the normalized medieval output.** Written macrons remain valuable on the card and may help determine inherited stress, but the audio does not exaggerate Classical quantity.
- **`y` is normalized toward `i`**, reflecting the widespread medieval interchange noted by Rigg.
- **Consonantal `v` is /v/** rather than the Classical /w/. This makes the result recognizably post-Classical while remaining broadly intelligible.
- **`c` before `e`, `i`, `y`, `ae`, or `oe` is normalized to /s/.** Rigg says this assibilation occurred in many countries, especially the Romance-speaking regions and England. This broad value also fits the French/Parisian scholastic center of gravity without forcing a narrowly modern Italianate `/tʃ/` pronunciation.
- **`sc` before those same front vowels is normalized to /s/.** Rigg explicitly treats it as similarly assibilated.
- **`ti` before another vowel is normalized to `si` except after `s`, `t`, or `x`.** Rigg identifies `ci` for Classical `ti` before vowels as a widespread medieval spelling, direct evidence that the two sequences converged in ordinary pronunciation. This profile therefore aligns the sound with the normalized front-`c` value rather than introducing an unrelated modern convention.
- **Initial and internal `h` is normally silent.** Rigg records both widespread loss of `h` and hypercorrect addition of `h`, showing that it had weak phonological status in much medieval usage.
- **Greek aspirate spellings are normalized conservatively:** `ph → /f/`, `th → /t/`, `ch → /k/` unless a later source-specific exception is deliberately added.
- **Inherited Latin stress remains the organizing baseline.** The penult receives stress when heavy; otherwise stress falls on the antepenult. Macrons on the authoritative grammar data may be used to identify a historically heavy penult even though the actual Medieval Latin audio does not preserve phonemic vowel length.
- **Written double consonants remain audibly distinct in the canonical representation where practical.** Regional weakening varied; preserving the written distinction is the more transferable teaching choice.

## Rules that still require a comparative audit before production generation

Do not generate the full Latin grammar cache until these have been checked against Stotz and the regional evidence:

- exact realization of `g` before front vowels; Rigg explicitly gives different values in different countries;
- `gn`; Rigg explicitly notes regional variation and records different spellings in Italy versus England;
- whether `qu` should always remain `/kw/` in the normalized scholastic profile;
- fine vowel qualities (`e/ɛ`, `o/ɔ`) and whether any positional distinctions are pedagogically useful;
- consonantal `i/j` in ambiguous orthographies;
- whether any common final-consonant devoicing or cluster simplification should be included without harming broad intelligibility.

Until that audit is complete, the engine deliberately keeps conservative, recognizable values for these variable sequences and tests mark their status as provisional.

## ElevenLabs and Supabase architecture

Use the existing `course-audio` architecture rather than creating an unrelated Latin audio service:

1. Reconstruct the complete spoken Latin form from the instructional card display.
2. Convert it deterministically to canonical normalized Medieval Latin IPA.
3. Convert that representation to an ElevenLabs v3 input. Eleven v3 supports IPA directly; the generated recording remains an approximation and must be audited with the chosen voice.
4. Include pronunciation system, canonical IPA, TTS input, model, and voice in the cache signature.
5. Store generated MP3s in the existing Supabase `course-audio` Storage bucket and metadata in `course_audio_assets`.
6. Reuse an existing matching cache entry. A replay must never spend new ElevenLabs credits.
7. For paradigm cards, pronounce the **singular column vertically first**, then one pause, then the **plural column vertically**, matching the established Greek grammar-audio behavior.

Do not pre-generate or regenerate paid Latin audio merely because this pronunciation code changes. First run the representative pronunciation corpus, listen to samples, settle the variable rules and voice, and only then generate the full cache with explicit user approval.

## Representative pre-generation corpus

Before generating the full grammar deck, audit a compact corpus containing both current paradigm forms and scholastic vocabulary:

- `laudō`, `laudāmus`, `laudābimus`
- `moneō`, `monēmus`
- `mittimus`, `mittuntur`
- `audiō`, `audītis`
- `gratia`, `scientia`, `quaestio`, `essentia`, `substantia`
- `philosophia`, `intellectus`, `voluntas`, `ecclesia`

The grammar forms verify stress, morphology stripping, consonant doubling, diphthongs, and the four conjugations. The scholastic terms expose the consonant sequences that need the strongest historical audit before production generation.
