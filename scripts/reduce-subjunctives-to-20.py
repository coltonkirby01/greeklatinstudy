from pathlib import Path
import json
import re

ROOT = Path('.')


def write_json(path: str, value):
    Path(path).write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n')


def group_perfect_system(path: str, voice: str):
    cards = json.loads(Path(path).read_text())
    keep = [c for c in cards if c['category'].endswith('Present Tense') or c['category'].endswith('Imperfect Tense')]
    grouped = []
    for tense in ('Perfect Tense', 'Pluperfect Tense'):
        members = [c for c in cards if c['category'].endswith(tense)]
        if len(members) != 4:
            raise SystemExit(f'{path}: expected four {tense} cards, found {len(members)}')
        rows = []
        row_plan = [
            ('1st person singular', 0, 0),
            ('2nd person singular', 1, 0),
            ('3rd person singular', 2, 0),
            ('1st person plural', 0, 1),
            ('2nd person plural', 1, 1),
            ('3rd person plural', 2, 1),
        ]
        for label, row_i, cell_i in row_plan:
            rows.append({'label': label, 'cells': [c['rows'][row_i]['cells'][cell_i] for c in members]})
        grouped.append({
            # Preserve the former 1st-conjugation ID as the stable survivor so existing progress
            # attached to that ID remains attached after the explicit user-requested merge.
            'id': members[0]['id'],
            'category': members[0]['category'],
            'prompt': f'{voice} Voice, Subjunctive Mood, {tense}, Conjugations 1–4',
            'columns': ['1st Conjugation', '2nd Conjugation', '3rd Conjugation', '4th Conjugation'],
            'rows': rows,
        })
    result = keep + grouped
    if len(result) != 10:
        raise SystemExit(f'{path}: expected 10 cards after grouping, found {len(result)}')
    write_json(path, result)
    return result


active = group_perfect_system('public/data/latin-active-subjunctive-paradigms.json', 'Active')
passive = group_perfect_system('public/data/latin-passive-subjunctive-paradigms.json', 'Passive')


def replace_once(path: str, old: str, new: str):
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f'Missing expected text in {path}: {old[:140]!r}')
    p.write_text(text.replace(old, new, 1))


replace_once(
    'src/data/latin-active-subjunctive-paradigms.ts',
    'description: "Sixteen whole-paradigm cards covering all four active subjunctive tenses in all four regular conjugations.",',
    'description: "Ten active subjunctive cards: present and imperfect by conjugation, with all four conjugations grouped on one perfect card and one pluperfect card.",',
)
replace_once(
    'src/data/latin-passive-subjunctive-paradigms.ts',
    'description: "Sixteen whole-paradigm cards covering all four passive subjunctive tenses in all four regular conjugations.",',
    'description: "Ten passive subjunctive cards: present and imperfect by conjugation, with all four conjugations grouped on one perfect card and one pluperfect card.",',
)

# The parent grammar count falls by twelve. Tense disclosures now describe cards rather
# than assuming every tense card corresponds to one conjugation.
page = Path('src/pages/latin-page.tsx')
text = page.read_text()
text = text.replace('summary={`${tenseState.selectedCount} of ${cards.length} conjugations selected`}', 'summary={`${tenseState.selectedCount} of ${cards.length} cards selected`}')
text = text.replace('description="Choose the conjugations you want in the paradigm study pool."', 'description="Choose the paradigm cards you want in the study pool."')
text = text.replace('allParadigmIds.length || 78', 'allParadigmIds.length || 66')
page.write_text(text)

# One-time filter migration. If any formerly separate perfect-system conjugation was
# selected, carry that intent to the surviving grouped card and remove retired IDs.
prefs = Path('src/features/study/filter-preferences.ts')
text = prefs.read_text()
needle = 'const NEW_ADJECTIVE_CARD_IDS = ["latin-adjective-3rd-acer", "latin-adjective-3rd-diligens"] as const;\n'
insert = needle + '''\nconst SUBJUNCTIVE_SELECTION_VERSION = 2;\nconst SUBJUNCTIVE_SELECTION_MIGRATIONS = [\n  { survivor: "latin-active-subjunctive-perfect-1st", retired: ["latin-active-subjunctive-perfect-2nd", "latin-active-subjunctive-perfect-3rd", "latin-active-subjunctive-perfect-4th"] },\n  { survivor: "latin-active-subjunctive-pluperfect-1st", retired: ["latin-active-subjunctive-pluperfect-2nd", "latin-active-subjunctive-pluperfect-3rd", "latin-active-subjunctive-pluperfect-4th"] },\n  { survivor: "latin-passive-subjunctive-perfect-1st", retired: ["latin-passive-subjunctive-perfect-2nd", "latin-passive-subjunctive-perfect-3rd", "latin-passive-subjunctive-perfect-4th"] },\n  { survivor: "latin-passive-subjunctive-pluperfect-1st", retired: ["latin-passive-subjunctive-pluperfect-2nd", "latin-passive-subjunctive-pluperfect-3rd", "latin-passive-subjunctive-pluperfect-4th"] },\n] as const;\n'''
if needle not in text:
    raise SystemExit('Could not insert subjunctive preference migration constants')
text = text.replace(needle, insert, 1)
needle = '''    if (stored.adjectiveSelectionVersion !== ADJECTIVE_SELECTION_VERSION &&\n      materials.has("adjective-paradigms") && paradigmCards !== null &&\n      paradigmCards.has("latin-adjective-3rd-gravis")) {\n      for (const id of NEW_ADJECTIVE_CARD_IDS) paradigmCards.add(id);\n    }\n'''
insert = needle + '''    if (stored.subjunctiveSelectionVersion !== SUBJUNCTIVE_SELECTION_VERSION && paradigmCards !== null) {\n      for (const migration of SUBJUNCTIVE_SELECTION_MIGRATIONS) {\n        const selectedBeforeMerge = paradigmCards.has(migration.survivor) || migration.retired.some((id) => paradigmCards.has(id));\n        for (const id of migration.retired) paradigmCards.delete(id);\n        if (selectedBeforeMerge) paradigmCards.add(migration.survivor);\n      }\n    }\n'''
if needle not in text:
    raise SystemExit('Could not insert subjunctive preference migration')
text = text.replace(needle, insert, 1)
needle = '      adjectiveSelectionVersion: ADJECTIVE_SELECTION_VERSION,\n'
if needle not in text:
    raise SystemExit('Could not persist subjunctive preference migration version')
text = text.replace(needle, needle + '      subjunctiveSelectionVersion: SUBJUNCTIVE_SELECTION_VERSION,\n', 1)
prefs.write_text(text)

# Generate audio definitions directly from the authoritative displayed chart columns.
def ts_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def chart_spec(card):
    groups = []
    for col_i in range(len(card['columns'])):
        groups.append([row['cells'][col_i] for row in card['rows']])
    groups_ts = ', '.join('[' + ', '.join(ts_string(v) for v in group) + ']' for group in groups)
    return f'  {{ id: {ts_string(card["id"])}, label: {ts_string(card["prompt"])}, groups: [{groups_ts}] }},'

spec_lines = '\n'.join(chart_spec(card) for card in active + passive)
audio = Path('supabase/functions/course-audio/builtin-latin-assets.ts')
text = audio.read_text()
# Replace the no-longer-needed two-column-only full-paradigm type/helper with a general chart helper.
text = re.sub(
    r'type FullParadigmSpec = \{\n  id: string;\n  label: string;\n  singular: readonly string\[\];\n  plural: readonly string\[\];\n\};\n',
    'type ChartParadigmSpec = {\n  id: string;\n  label: string;\n  groups: readonly (readonly string[])[];\n};\n',
    text,
    count=1,
)
text = re.sub(
    r'function fullParadigm\(spec: FullParadigmSpec\): LatinCourseAudioAsset \{.*?\n\}\n\n',
    '''function chartParadigm(spec: ChartParadigmSpec): LatinCourseAudioAsset {\n  const allForms = spec.groups.flat();\n  return {\n    id: spec.id,\n    label: spec.label,\n    canonicalIpa: latinToMedievalIpa(allForms.join(", ")),\n    ttsText: latinParadigmToElevenLabsIpa(spec.groups),\n    pronunciationSystem: MEDIEVAL_LATIN_PRONUNCIATION_SYSTEM,\n  };\n}\n\n''',
    text,
    count=1,
    flags=re.S,
)
start = text.find('const activeSubjunctiveSpecs:')
end = text.find('export const latinParadigmAudioAssets:')
if start < 0 or end < 0 or end <= start:
    raise SystemExit('Could not locate subjunctive audio spec region')
replacement = f'''const subjunctiveChartSpecs: readonly ChartParadigmSpec[] = [\n{spec_lines}\n];\n\n'''
text = text[:start] + replacement + text[end:]
old_export = '''export const latinParadigmAudioAssets: readonly LatinCourseAudioAsset[] = [\n  ...activeSpecs.map(paradigm),\n  ...activeSubjunctiveSpecs.map(paradigm),\n  ...passiveSpecs.map(paradigm),\n  ...passiveSubjunctiveSimpleSpecs.map(paradigm),\n  ...passiveSubjunctivePeriphrasticSpecs.map(fullParadigm),\n];'''
new_export = '''export const latinParadigmAudioAssets: readonly LatinCourseAudioAsset[] = [\n  ...activeSpecs.map(paradigm),\n  ...passiveSpecs.map(paradigm),\n  ...subjunctiveChartSpecs.map(chartParadigm),\n];'''
if old_export not in text:
    raise SystemExit('Could not replace Latin audio export list')
text = text.replace(old_export, new_export, 1)
audio.write_text(text)

# Regression test: 20 subjunctive cards, with exactly four grouped perfect-system cards.
Path('tests/latin-subjunctive-paradigms.test.ts').write_text(r'''import fs from "node:fs";
import { describe, expect, it } from "vitest";

type SourceCard = {
  id: string;
  category: string;
  prompt: string;
  columns: string[];
  rows: Array<{ label: string; cells: string[] }>;
};

const active = JSON.parse(fs.readFileSync("public/data/latin-active-subjunctive-paradigms.json", "utf8")) as SourceCard[];
const passive = JSON.parse(fs.readFileSync("public/data/latin-passive-subjunctive-paradigms.json", "utf8")) as SourceCard[];

const retiredPerfectSystemIds = [
  "latin-active-subjunctive-perfect-2nd", "latin-active-subjunctive-perfect-3rd", "latin-active-subjunctive-perfect-4th",
  "latin-active-subjunctive-pluperfect-2nd", "latin-active-subjunctive-pluperfect-3rd", "latin-active-subjunctive-pluperfect-4th",
  "latin-passive-subjunctive-perfect-2nd", "latin-passive-subjunctive-perfect-3rd", "latin-passive-subjunctive-perfect-4th",
  "latin-passive-subjunctive-pluperfect-2nd", "latin-passive-subjunctive-pluperfect-3rd", "latin-passive-subjunctive-pluperfect-4th",
];

describe("Henle subjunctive paradigms", () => {
  it("reduces the subjunctive pool to exactly 20 cards", () => {
    expect(active).toHaveLength(10);
    expect(passive).toHaveLength(10);
    expect([...active, ...passive]).toHaveLength(20);
    expect(new Set([...active, ...passive].map((card) => card.id)).size).toBe(20);
    const activeTenseCounts = Object.fromEntries(["Present Tense", "Imperfect Tense", "Perfect Tense", "Pluperfect Tense"].map((tense) => [tense, active.filter((card) => card.category.endsWith(tense)).length]));
    const passiveTenseCounts = Object.fromEntries(["Present Tense", "Imperfect Tense", "Perfect Tense", "Pluperfect Tense"].map((tense) => [tense, passive.filter((card) => card.category.endsWith(tense)).length]));
    expect(activeTenseCounts).toEqual({ "Present Tense": 4, "Imperfect Tense": 4, "Perfect Tense": 1, "Pluperfect Tense": 1 });
    expect(passiveTenseCounts).toEqual({ "Present Tense": 4, "Imperfect Tense": 4, "Perfect Tense": 1, "Pluperfect Tense": 1 });
    for (const retiredId of retiredPerfectSystemIds) expect([...active, ...passive].some((card) => card.id === retiredId)).toBe(false);
  });

  it("keeps present and imperfect separated by conjugation", () => {
    expect(active[0]).toMatchObject({
      id: "latin-active-subjunctive-present-1st",
      category: "Active Subjunctive — Present Tense",
      rows: [
        { label: "1st person", cells: ["laud-em", "laud-ēmus"] },
        { label: "2nd person", cells: ["laud-ēs", "laud-ētis"] },
        { label: "3rd person", cells: ["laud-et", "laud-ent"] },
      ],
    });
    expect(passive.find((card) => card.id === "latin-passive-subjunctive-imperfect-4th")?.rows[2].cells)
      .toEqual(["aud-īrētur", "aud-īrentur"]);
  });

  it("groups all four active conjugations onto one perfect card and one pluperfect card", () => {
    const perfect = active.find((card) => card.id === "latin-active-subjunctive-perfect-1st");
    const pluperfect = active.find((card) => card.id === "latin-active-subjunctive-pluperfect-1st");
    expect(perfect?.prompt).toContain("Conjugations 1–4");
    expect(perfect?.columns).toEqual(["1st Conjugation", "2nd Conjugation", "3rd Conjugation", "4th Conjugation"]);
    expect(perfect?.rows[0]).toEqual({ label: "1st person singular", cells: ["laudāv-erim", "monu-erim", "mīs-erim", "audīv-erim"] });
    expect(perfect?.rows[5]).toEqual({ label: "3rd person plural", cells: ["laudāv-erint", "monu-erint", "mīs-erint", "audīv-erint"] });
    expect(pluperfect?.rows[1]).toEqual({ label: "2nd person singular", cells: ["laudāv-issēs", "monu-issēs", "mīs-issēs", "audīv-issēs"] });
  });

  it("groups all four passive conjugations onto one perfect card and one pluperfect card", () => {
    const perfect = passive.find((card) => card.id === "latin-passive-subjunctive-perfect-1st");
    const pluperfect = passive.find((card) => card.id === "latin-passive-subjunctive-pluperfect-1st");
    expect(perfect?.prompt).toContain("Conjugations 1–4");
    expect(perfect?.rows[0]).toEqual({ label: "1st person singular", cells: ["laudātus (a, um) sim", "monitus (a, um) sim", "missus (a, um) sim", "audītus (a, um) sim"] });
    expect(perfect?.rows[4]).toEqual({ label: "2nd person plural", cells: ["laudātī (ae, a) sītis", "monitī (ae, a) sītis", "missī (ae, a) sītis", "audītī (ae, a) sītis"] });
    expect(pluperfect?.rows[5]).toEqual({ label: "3rd person plural", cells: ["laudātī (ae, a) essent", "monitī (ae, a) essent", "missī (ae, a) essent", "audītī (ae, a) essent"] });
  });

  it("preserves Henle rule references in the deck loaders", () => {
    const activeLoader = fs.readFileSync("src/data/latin-active-subjunctive-paradigms.ts", "utf8");
    const passiveLoader = fs.readFileSync("src/data/latin-passive-subjunctive-paradigms.ts", "utf8");
    for (const rule of ["186, 194-196", "187, 197-199", "200, 202-204", "201, 205-207"]) expect(activeLoader).toContain(rule);
    for (const rule of ["267, 269-271", "268, 272-274", "275, 277-279", "276, 280-282"]) expect(passiveLoader).toContain(rule);
  });

  it("wires both decks into Latin filters, exact selection, Stats/session coverage, and paradigm rendering", () => {
    const page = fs.readFileSync("src/pages/latin-page.tsx", "utf8");
    const catalog = fs.readFileSync("src/features/study/builtin-study-catalog.ts", "utf8");
    const filters = fs.readFileSync("src/features/study/filter-preferences.ts", "utf8");
    for (const key of ["active-subjunctive-paradigms", "passive-subjunctive-paradigms"]) {
      expect(page).toContain(key);
      expect(filters).toContain(key);
    }
    expect(page).toContain('title="Active Subjunctive Paradigms"');
    expect(page).toContain('title="Passive Subjunctive Paradigms"');
    expect(page).toContain("source.deck.id === activeSubjunctiveDeck?.id");
    expect(page).toContain("source.deck.id === passiveSubjunctiveDeck?.id");
    expect(catalog).toContain('id: "latin-active-subjunctive-paradigms"');
    expect(catalog).toContain('id: "latin-passive-subjunctive-paradigms"');
  });
});
''')

# Audio regression follows the number of displayed columns instead of assuming every chart
# is singular/plural. Grouped perfect-system cards therefore have four pronunciation groups.
audio_test = Path('tests/medieval-latin-audio.test.ts')
text = audio_test.read_text()
text = text.replace('rows: Array<{ cells: [string, string] }>;', 'columns: string[];\n  rows: Array<{ cells: string[] }>;')
text = text.replace('defines one stable cached-audio asset for all 68 current paradigm cards', 'defines one stable cached-audio asset for all 56 current paradigm cards')
text = text.replace('expect(cards).toHaveLength(68);', 'expect(cards).toHaveLength(56);')
old = '''      const singular = card.rows.map((row) => row.cells[0]);\n      const plural = card.rows.map((row) => row.cells[1]);\n      const asset = resolveBuiltinLatinAsset(card.id);\n      expect(asset?.ttsText, card.id).toBe(latinParadigmToElevenLabsIpa([singular, plural]));\n      expect(asset?.ttsText.match(/\\[pause\\]/gu), card.id).toHaveLength(1);'''
new = '''      const groups = card.columns.map((_, columnIndex) => card.rows.map((row) => row.cells[columnIndex]));\n      const asset = resolveBuiltinLatinAsset(card.id);\n      expect(asset?.ttsText, card.id).toBe(latinParadigmToElevenLabsIpa(groups));\n      expect(asset?.ttsText.match(/\\[pause\\]/gu), card.id).toHaveLength(Math.max(0, groups.length - 1));'''
if old not in text:
    raise SystemExit('Could not update Latin audio regression grouping')
text = text.replace(old, new, 1)
audio_test.write_text(text)

# Filter migration regression.
filter_test = Path('tests/filter-preferences.test.ts')
text = filter_test.read_text()
marker = '''  it("drops deleted Henle material keys from older stored preferences", () => {'''
case = r'''  it("migrates formerly separate subjunctive perfect-system selections onto the grouped cards", () => {
    const storage = memoryStorage();
    storage.setItem("greeklatinstudy:latin-filters:v1", JSON.stringify({
      materials: ["active-subjunctive-paradigms", "passive-subjunctive-paradigms"],
      vocabularyParts: null,
      paradigmCards: ["latin-active-subjunctive-perfect-3rd", "latin-passive-subjunctive-pluperfect-4th"],
      adjectiveSelectionVersion: 2,
    }));
    const restored = loadLatinFilterPreferences(storage);
    expect([...(restored.paradigmCards ?? [])].sort()).toEqual([
      "latin-active-subjunctive-perfect-1st",
      "latin-passive-subjunctive-pluperfect-1st",
    ]);
    saveLatinFilterPreferences({ ...restored, paradigmCards: new Set() }, storage);
    expect([...(loadLatinFilterPreferences(storage).paradigmCards ?? [])]).toEqual([]);
  });

'''
if marker not in text:
    raise SystemExit('Could not add filter migration regression')
text = text.replace(marker, case + marker, 1)
filter_test.write_text(text)

agents = Path('AGENTS.md')
text = agents.read_text()
old = '- Henle subjunctive paradigms are registered as separate `latin-active-subjunctive-paradigms` and `latin-passive-subjunctive-paradigms` decks. Each has 16 stable whole-paradigm cards: present, imperfect, perfect, and pluperfect across all four regular conjugations. Preserve the attached Quick Reference forms/macrons and Rules 186–207 (active) and 267–282 (passive); passive perfect-system cards keep the perfect passive participle gender alternatives together with `sim`/`essem` forms.\n'
new = '- Henle subjunctive paradigms are registered as separate `latin-active-subjunctive-paradigms` and `latin-passive-subjunctive-paradigms` decks. Each has 10 active cards: four present cards and four imperfect cards (one per regular conjugation), plus one grouped perfect card and one grouped pluperfect card containing conjugations 1–4 together. The grouped cards deliberately retain the former `-perfect-1st` and `-pluperfect-1st` IDs as stable survivors; the former perfect/pluperfect `-2nd`, `-3rd`, and `-4th` IDs are retired historical IDs and must not re-enter active pools. Preserve the attached Quick Reference forms/macrons and Rules 186–207 (active) and 267–282 (passive); passive perfect-system cards keep the perfect passive participle gender alternatives together with `sim`/`essem` forms.\n'
if old not in text:
    raise SystemExit('Could not update AGENTS subjunctive convention')
agents.write_text(text.replace(old, new, 1))

copilot = Path('.github/copilot-instructions.md')
text = copilot.read_text()
old = '- Latin paradigm audio is ordered vertically: singular column first, exactly one `[pause]`, then plural column.\n'
new = '- Latin paradigm audio follows the displayed chart columns vertically. Ordinary two-column singular/plural charts have exactly one `[pause]`; the grouped subjunctive perfect-system cards have four conjugation columns and therefore three pauses.\n'
if old not in text:
    raise SystemExit('Could not update Latin audio column convention')
copilot.write_text(text.replace(old, new, 1))
