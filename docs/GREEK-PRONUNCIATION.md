# Classical Greek pronunciation policy

The built-in Greek course audio follows **Anne H. Groton, _From Alpha to Omega_, 4th ed. (2013)** first. This is a course-specific pronunciation policy, not an attempt to flatten every scholarly reconstruction of Attic Greek into one supposedly certain system.

## Source hierarchy

1. **Anne H. Groton, _From Alpha to Omega_, 4th ed.**, especially Lesson 1 §§3–8 (alphabet, vowel quantity, diphthongs, breathings, consonants, pronunciation) and Lesson 2 §§11–14 (pitch accent and the classroom stress convention). When Groton gives an explicit pronunciation choice, course audio follows it.
2. **W. Sidney Allen, _Vox Graeca: A Guide to the Pronunciation of Classical Greek_, 3rd ed. (Cambridge University Press, 1987).** Allen is the principal scholarly reconstruction used to fill details that Groton leaves implicit.
3. **Herbert Weir Smyth, _A Greek Grammar for Colleges_**, especially §19 on gamma nasal and §§149–156 on accent, plus the **Open University, _Getting started on ancient Greek_, Session 2**, as independent grammatical and practical-audio cross-checks.

The implementation was historically informed by Jónatan Sólon's MIT-licensed Ancient Greek Dictionary phonology code, which in turn follows Allen. See `docs/THIRD-PARTY-NOTICES.md`.

## Course values

### Vowels

| Spelling | Course IPA | Note |
| --- | --- | --- |
| α | /a/ or /aː/ | Macron marks long α where the textbook needs to disambiguate quantity. |
| ε | /e/ | Always short. |
| η | /ɛː/ | Groton's long, more open eta ("error" cue). |
| ι | /i/ or /iː/ | Quantity follows the textbook's macron where needed. |
| ο | /o/ | Always short. |
| υ | /y/ or /yː/ | Groton's French-u value. |
| ω | /ɔː/ | Groton's long, more open omega ("aw" cue). |

Long and short are real quantity distinctions in the course audio; long vowels should not merely receive English-style stress.

### Proper diphthongs

| Spelling | Course IPA | Groton cue |
| --- | --- | --- |
| αι | /ai̯/ | "aisle" |
| αυ | /au̯/ | "ouch" |
| ει | /ei̯/ | "eight" |
| ευ | /ey̯/ | ε gliding into French _u_ |
| ηυ | /ɛːy̯/ | η gliding into French _u_ |
| οι | /oi̯/ | "oily" |
| ου | /uː/ | "ooze" |
| υι | /yi̯/ | French _u_ gliding into _ee_ |

Groton explicitly treats these as one long syllable whose two vowel elements are pronounced. Therefore course audio does **not** silently replace ει with /eː/ or οι with a front rounded monophthong/diphthong merely because a narrower historical reconstruction might prefer that value for some period or environment.

### Improper diphthongs

Groton states that the iota was still pronounced in the Classical period. Course audio therefore retains it:

- ᾳ → /aːi̯/
- ῃ → /ɛːi̯/
- ῳ → /ɔːi̯/

### Consonants and breathings

The main reconstructed values used by the course are β /b/, γ /ɡ/, δ /d/, ζ /zd/, θ /tʰ/, κ /k/, ξ /ks/, π /p/, τ /t/, φ /pʰ/, χ /kʰ/, ψ /ps/, with a trilled ρ.

Important contextual rules:

- A rough breathing on an initial vowel/diphthong supplies /h/.
- Initial ρ is treated as rough/voiceless-trilled in the IPA output.
- γ is nasal /ŋ/ before γ, κ, χ, ξ. It is **not** nasalized merely because μ follows; this follows Groton and Smyth §19.
- σ is voiced /z/ before β, γ, δ, μ, following Groton's alphabet table.
- Repeated consonants remain audibly doubled rather than being collapsed to a single consonant.

## Accent: historical metadata vs synthesized audio

Groton is explicit about the distinction:

- Classical accent was fundamentally **pitch**, not English-style stress.
- Acute indicates a rise, circumflex a rise followed by a fall, and grave a lower/non-rising alternative to final acute.
- Groton also says that most teachers and students pronounce Ancient Greek by **stressing the accented syllable**, and instructs beginners to do so.

The application therefore maintains two representations:

- `greekToClassicalIpa()` keeps pitch-accent information in canonical metadata.
- `greekToElevenLabsIpa()` puts a primary-stress marker before the accented **syllable** as a deliberate classroom/TTS approximation. Acute, grave, and circumflex all identify the syllable for this synthesis approximation.

This distinction must remain explicit. We should never describe ElevenLabs's stress-based rendering as a literal recreation of Classical pitch accent.

## ElevenLabs policy

Course Greek uses explicit IPA input rather than asking ElevenLabs to infer Ancient Greek pronunciation from Greek spelling. The preferred model is **Eleven v4** because ElevenLabs documents improved native IPA support in v4 and recommends testing important pronunciations with the chosen voice.

Before bulk-generating a new batch of vocabulary:

1. Update and test the Groton data and the IPA engine.
2. Audit a diagnostic set that exercises rough breathing, long α/ι/υ, ει/οι/ευ, aspirated stops, gamma nasal, iota subscript, and accent placement.
3. Audition the chosen ElevenLabs voice on that diagnostic set.
4. Only then prewarm the full new batch.

A custom ElevenLabs Voice Design voice may improve consistency and pacing, but it is secondary to correct IPA. Do not make a new permanent voice the production default until its previews have been auditioned against the diagnostic set.

## Maintenance rule for future Groton lessons

Every newly added Groton lesson must feed its vocabulary and grammar forms through the same pronunciation engine. Do not hand-write English respellings for individual cards unless a documented override is genuinely required. If a new Greek form exposes a phonological case not covered here, extend this policy and add a regression test before generating paid audio.
