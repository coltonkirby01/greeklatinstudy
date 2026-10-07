# Kubo New Testament vocabulary source

The built-in `kubo-new-testament-vocab` deck is transcribed from the general vocabulary list in Kubo, Appendix I, **Words Occurring More Than 50 Times**, pp. 274–277, as supplied by the project owner.

Implementation conventions:

- Keep the 301 entries from the general frequency list only. Do not import entries solely from the separate John special-vocabulary/chapter lists.
- Preserve the New Testament occurrence count supplied by Kubo and assign frequency rank from highest to lowest occurrence count.
- The Choose cards menu groups this source into 1,000+, 500–999, 250–499, 150–249, 100–149, 75–99, 60–74, and 50–59 occurrence bands.
- The occurrence count and frequency rank appear on the answer side as card notes.
- These groups are valid saved filter keys but are intentionally not selected by default, so adding the source does not silently expand an existing Greek study pool.
- New Testament vocabulary cards currently do not invoke automatic paid audio generation; preserve the existing course-audio conventions unless audio for this source is deliberately added later.
