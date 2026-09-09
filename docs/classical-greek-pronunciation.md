# Classical Greek pronunciation policy

The site's Greek audio aims at reconstructed Classical Attic pronunciation, approximately the late fifth to fourth century BCE. The course textbook, *From Alpha to Omega*, remains the local pedagogical guide, but the pronunciation engine is deliberately cross-checked against open scholarly and teaching references.

## Source hierarchy

1. **Josolon, Ancient Greek Dictionary — dominant implementation reference.** Its MIT-licensed `scripts/phonology.py` follows W. Sidney Allen's *Vox Graeca* and provides a practical computational model for Classical Attic vowel quantity, aspirated stops, diphthongs, gamma nasalization, consonant clusters, hiatus behavior, and pitch accent. The site reimplements the relevant rules in TypeScript rather than depending on the repository at runtime.
2. **Herbert Weir Smyth, *A Greek Grammar for Colleges* (Perseus).** Used especially for the distinction between Classical pitch accent and later stress accent, and for breathings.
3. **Open University, *Getting started on ancient Greek*.** Used as an open academic check on reconstructed fifth-century Athenian pronunciation, including breathings, aspirates, zeta, diphthongs, and gamma before velars.
4. **University of Victoria / BCcampus, Peter Smith, *Greek and Latin Roots: Part II — Greek*.** Used as an open academic check on vowel quality/quantity, upsilon, aspirated stops, rho, and consonant values.
5. **From Alpha to Omega.** Used for course-specific pedagogical alignment where the textbook explicitly chooses or presents a pronunciation convention. Existing course card data also preserves the textbook-style pronunciation notes used by the study materials.

When these references represent a real scholarly disagreement, the site does not pretend that the question is settled. Josolon/Vox Graeca is the default implementation choice, while card metadata can preserve a reviewed exception when the course or lexical evidence calls for one.

## Implemented Classical Attic choices

- vowel length is phonemic; eta and omega are long, epsilon and omicron short, while alpha/iota/upsilon require length information when it is available;
- upsilon is front rounded;
- phi, theta, and chi are aspirated stops rather than later fricatives;
- zeta defaults to **/zd/** following the Josolon/Vox Graeca implementation and Open University's strict reconstruction; the University of Victoria source presents **/dz/** as an alternative reconstruction, while the course material also notes a simpler z-like classroom option;
- gamma becomes a velar nasal before gamma, kappa, chi, xi, and in the gamma-mu cluster;
- sigma voices before beta, gamma, delta, and mu;
- initial rho is voiceless/aspirated in the reconstruction;
- geminate consonants remain geminate;
- `οι` uses the fronted Classical value used by the Josolon/Vox Graeca implementation;
- `ει` and `ου` follow the long-vowel treatment used by that implementation, including its `ει` hiatus handling;
- genuine diphthongs use the Josolon/Vox Graeca hiatus treatment when another vowel immediately follows;
- parenthetical paradigm material is omitted from default playback, so a parenthetical nu is not pronounced;
- grammar paradigms are spoken vertically, singular column first and then plural column.

## Canonical IPA versus TTS

The site stores two conceptual representations. **Canonical IPA** preserves the reconstructed pitch-accent information. **TTS IPA** keeps the same segmental pronunciation but substitutes a stress cue where useful because ElevenLabs does not provide deterministic Ancient-Greek pitch-accent synthesis. The generated audio should therefore be treated as a high-quality approximation of the canonical reconstruction, not as evidence that Classical Greek had a modern stress accent.

This separation is intentional: a future audio provider can improve pitch realization without changing the underlying scholarly transcription.

## Future Greek deck imports

Every published Greek cloud card receives audio automatically. Ordinary vocabulary needs no pronunciation columns: the backend derives Classical Attic IPA from the Greek text and stores the resulting shared MP3 for all users. Uploaded grammar charts use `Chart Columns` and `Chart Rows`; chart cells are read **vertically by column**, so singular forms precede plural forms.

For maximum accuracy, the importer also accepts optional reviewed pronunciation metadata. This is important because bare Greek spelling cannot recover every historical vowel length in alpha/iota/upsilon or every lexical distinction that may matter to a strict reconstruction.

Optional CSV/XLSX columns are:

- `Pronunciation Text` — Greek text used for automatic transcription; use this to preserve macrons or a cleaned pronunciation form without changing the visible card.
- `Canonical IPA` — reviewed scholarly reconstruction. If supplied, it replaces automatic canonical IPA for that card.
- `ElevenLabs IPA` — reviewed synthesis input. If supplied, it replaces automatically derived ElevenLabs IPA without changing the canonical transcription.
- `Pronunciation System` — optional source/system label for a reviewed exception.
- `Chart Columns` and `Chart Rows` — JSON arrays for grammar paradigms; these also trigger vertical paradigm speech ordering.

JSON imports support the equivalent fields `pronunciationText`, `canonicalIpa`, `elevenLabsIpa` (or `ttsIpa`), and `pronunciationSystem`, either as top-level card fields or in `metadata` where applicable.

The override order is deliberately conservative:

1. use explicitly reviewed IPA when supplied;
2. otherwise use reviewed `Pronunciation Text` if supplied;
3. otherwise transcribe the Greek card/chart text automatically with the Josolon/Vox Graeca-led engine.

A change to reviewed pronunciation metadata changes the stored audio source signature, so the shared audio is regenerated rather than silently serving an older pronunciation.

## References

- Josolon, Ancient Greek Dictionary: https://github.com/Josolon/ancient-greek-dictionary
- Smyth at Perseus, accent: https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.04.0007:part=1:chapter=7
- Open University, *Getting started on ancient Greek*: https://www.open.edu/openlearn/history-the-arts/getting-started-on-ancient-greek
- University of Victoria / BCcampus, Classical Greek pronunciation: https://pressbooks.bccampus.ca/greeklatinroots2/chapter/%C2%A7100-notes-on-classical-greek-pronunciation/
