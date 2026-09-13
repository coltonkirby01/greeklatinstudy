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

Prefer a pronunciation feature when Rigg or Stotz treats the development as widespread, when several regional reconstructions point in the same direction, and when the result preserves the written word clearly enough to transfer to other Latin pronunciation systems. Avoid strongly local features when the evidence changes sharply by century or region or when adopting them would make ordinary Latin unnecessarily difficult to recognize elsewhere.

Rigg explicitly warns that medieval Latin pronunciation had diverged considerably by region. That warning is part of the design: the site normalizes rather than pretending to reproduce one local speaker exactly.

## Normalized production profile

These are the stable rules for the site's broad Medieval Latin profile:

- **Instructional morphology is not spoken.** A card such as `laud-āmus` is pronounced as the complete word `laudāmus`; a stem/ending hyphen is visual only.
- **`ae` and `oe` are monophthongized to an e-quality vowel.** Rigg identifies this as one of the changes that became nearly universal across medieval Europe.
- **Classical vowel length is not maintained as a phonemic long/short contrast in the audio.** Written macrons remain on the card and may help determine inherited stress, but the recording does not exaggerate Classical quantity.
- **`y` is normalized toward `i`**, reflecting widespread medieval interchange.
- **Consonantal `v` is /v/** rather than Classical /w/.
- **Consonantal `i` is represented as /j/** where the spelling clearly functions as a consonant, including ordinary initial or intervocalic environments such as `iudicium` and `maior`.
- **`c` before `e`, `i`, `y`, `ae`, or `oe` is normalized to /s/.** Rigg says this assibilation occurred in many countries, especially Romance-speaking regions and England. The broad value also suits the French/Parisian scholastic center of gravity without forcing modern Italianate `/tʃ/`.
- **`sc` before those same front vowels is normalized to /s/**; Rigg treats it as similarly assibilated.
- **`ti` before another vowel is normalized to `si` except after `s`, `t`, or `x`.** Widespread medieval `ti`/`ci` spelling interchange supports convergence with assibilated `c`.
- **Initial and internal `h` is normally silent.** Rigg records widespread loss and hypercorrect addition of `h`, showing its weak phonological status in much medieval usage.
- **Greek aspirate spellings are normalized conservatively:** `ph → /f/`, `th → /t/`, `ch → /k/`.
- **Inherited Latin stress remains the baseline.** The penult receives stress when heavy; otherwise stress falls on the antepenult. Macrons in authoritative grammar data may identify a historically heavy penult even though vowel quantity is not phonemic in the Medieval Latin audio.
- **Written double consonants remain distinct in the canonical representation where practical.** Preserving them is the more transferable teaching choice.

## Conservative choices where the medieval evidence varies

Some features do not have one credible pan-medieval realization. The site therefore makes explicit pedagogical normalizations rather than pretending that one regional form was universal:

- **`g` before front vowels remains /g/.** Medieval front-`g` values varied sharply by region. Keeping /g/ is a spelling-transparent, recognizable compromise for a broad scholastic learner.
- **`gn` remains /gn/.** Rigg explicitly notes regional variation. The site does not impose an Italianate palatal or another local realization.
- **`qu` remains /kw/.** This preserves the familiar written sequence and transfers well across Latin traditions.
- **Fine `e/ɛ` and `o/ɔ` distinctions are not systematically imposed.** They vary too much for the value they would add to this broad teaching profile.
- **No general final-consonant devoicing or regional cluster simplification is imposed.** Those changes are too local for the site's intended common denominator.

These are normalization choices, not claims that every medieval theologian or philosopher pronounced the forms this way.

## ElevenLabs and Supabase architecture

Use the existing `course-audio` architecture rather than creating an unrelated Latin service:

1. Reconstruct the complete spoken Latin form from the instructional card display.
2. Convert it deterministically to canonical normalized Medieval Latin IPA.
3. Convert that representation to an ElevenLabs v3 input. The generated recording remains a practical approximation and must be audited with the chosen voice.
4. Store generated MP3s in the existing Supabase `course-audio` Storage bucket and metadata in `course_audio_assets`.
5. Reuse an existing matching cache entry. Replaying a cached recording must never spend new ElevenLabs credits.
6. For paradigm cards, pronounce the **singular column vertically first**, then one pause, then the **plural column vertically**, matching the established Greek grammar-audio behavior.
7. Use a dedicated Latin voice configured as `ELEVENLABS_MEDIEVAL_LATIN_VOICE_ID`; do not silently fall back to the Greek voice.

The current 24 active-indicative and 12 passive-indicative paradigm cards have stable Latin audio definitions, for **36 total paradigm assets**.

## Paid-generation safeguard

Latin study is cache-only until the user explicitly approves generation. The learner-facing Latin audio component queries Supabase for an existing cached MP3 and **does not call the generation Edge Function**.

The Edge Function also requires an explicit `allowGeneration: true` request before a missing or changed Latin asset may call ElevenLabs. This is intentionally separate from Greek's existing on-demand behavior. Do not add Latin IDs to an automatic prewarm workflow without explicit user approval.

Before the first paid generation, audition a small representative set and choose the dedicated Latin voice. Only after that sample is approved should the complete 36-card grammar cache be generated.

## Representative audition corpus

The first sample should contain current paradigm forms plus common scholastic vocabulary, for example:

- `laudō`, `laudāmus`, `laudābimus`
- `moneō`, `monēmus`
- `mittimus`, `mittuntur`
- `audiō`, `audītis`
- `gratia`, `scientia`, `quaestio`, `essentia`, `substantia`
- `philosophia`, `intellectus`, `voluntas`, `ecclesia`, `iudicium`

The grammar forms verify stress, morphology stripping, consonant doubling, diphthongs, and the four conjugations. The scholastic terms exercise the medieval consonant rules most relevant to theology and philosophy.
