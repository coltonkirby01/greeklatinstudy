from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing patch target: {label}")
    return text.replace(old, new, 1)


# Greek page integration.
p = Path("src/pages/greek-page-v2.tsx")
text = p.read_text()
if "../data/greek-new-testament-vocab" not in text:
    text = replace_once(
        text,
        '} from "../data/greek-lessons-9-10";\n',
        '} from "../data/greek-lessons-9-10";\nimport { NEW_TESTAMENT_FREQUENCY_GROUPS, loadGreekNewTestamentVocabularyDeck, newTestamentFrequencyGroupForCard } from "../data/greek-new-testament-vocab";\n',
        "NT import",
    )
text = text.replace("ExactCardSelection, FilterCheckbox, FilterDirectionControl, FilterDisclosure, FilterSection, StudyFilterMenu", "FilterCheckbox, FilterDirectionControl, FilterDisclosure, FilterSection, StudyFilterMenu")
if "newTestamentVocabulary: DeckDefinition;" not in text:
    text = replace_once(text, "  lesson10Grammar: DeckDefinition;\n};", "  lesson10Grammar: DeckDefinition;\n  newTestamentVocabulary: DeckDefinition;\n};", "LoadedDecks")
old_keys = "const allVocabularyKeys = lessonConfigs.map((config) => config.vocabularyKey);\nconst allEndingKeys = lessonConfigs.flatMap((config) => [...config.endingKeys]);\nconst allKeys: KeyValue[] = [...lesson1Keys, ...lesson2Keys, ...allVocabularyKeys, ...allEndingKeys];"
new_keys = "const lessonVocabularyKeys = lessonConfigs.map((config) => config.vocabularyKey);\nconst newTestamentVocabularyKeys = NEW_TESTAMENT_FREQUENCY_GROUPS.map((group) => group.key);\nconst allVocabularyKeys: string[] = [...lessonVocabularyKeys, ...newTestamentVocabularyKeys];\nconst allEndingKeys = lessonConfigs.flatMap((config) => [...config.endingKeys]);\nconst defaultKeys: string[] = [...lesson1Keys, ...lesson2Keys, ...lessonVocabularyKeys, ...allEndingKeys];\nconst allKeys: string[] = [...defaultKeys, ...newTestamentVocabularyKeys];"
if old_keys in text:
    text = text.replace(old_keys, new_keys, 1)
if "decks.newTestamentVocabulary," not in text:
    text = replace_once(text, "    decks.foundation,\n    ...lessonConfigs.flatMap((config) => [decks[config.vocabularyDeck], decks[config.grammarDeck]]),", "    decks.foundation,\n    decks.newTestamentVocabulary,\n    ...lessonConfigs.flatMap((config) => [decks[config.vocabularyDeck], decks[config.grammarDeck]]),", "deckList")
old_promise = "const [foundation, lesson3Vocabulary, lesson3Grammar, lesson4Vocabulary, lesson4Grammar, lesson5Vocabulary, lesson5Grammar, lesson6Vocabulary, lesson6Grammar, lesson7Vocabulary, lesson7Grammar, lesson8Vocabulary, lesson8Grammar, lesson9Vocabulary, lesson9Grammar, lesson10Vocabulary, lesson10Grammar] = await Promise.all(["
new_promise = "const [foundation, lesson3Vocabulary, lesson3Grammar, lesson4Vocabulary, lesson4Grammar, lesson5Vocabulary, lesson5Grammar, lesson6Vocabulary, lesson6Grammar, lesson7Vocabulary, lesson7Grammar, lesson8Vocabulary, lesson8Grammar, lesson9Vocabulary, lesson9Grammar, lesson10Vocabulary, lesson10Grammar, newTestamentVocabulary] = await Promise.all(["
if old_promise in text:
    text = text.replace(old_promise, new_promise, 1)
old_return = "      loadGreekLesson10VocabularyDeck(), loadGreekLesson10GrammarDeck(),\n    ]);\n    return { foundation, lesson3Vocabulary, lesson3Grammar, lesson4Vocabulary, lesson4Grammar, lesson5Vocabulary, lesson5Grammar, lesson6Vocabulary, lesson6Grammar, lesson7Vocabulary, lesson7Grammar, lesson8Vocabulary, lesson8Grammar, lesson9Vocabulary, lesson9Grammar, lesson10Vocabulary, lesson10Grammar } satisfies LoadedDecks;"
new_return = "      loadGreekLesson10VocabularyDeck(), loadGreekLesson10GrammarDeck(),\n      loadGreekNewTestamentVocabularyDeck(),\n    ]);\n    return { foundation, lesson3Vocabulary, lesson3Grammar, lesson4Vocabulary, lesson4Grammar, lesson5Vocabulary, lesson5Grammar, lesson6Vocabulary, lesson6Grammar, lesson7Vocabulary, lesson7Grammar, lesson8Vocabulary, lesson8Grammar, lesson9Vocabulary, lesson9Grammar, lesson10Vocabulary, lesson10Grammar, newTestamentVocabulary } satisfies LoadedDecks;"
if old_return in text:
    text = text.replace(old_return, new_return, 1)
text = text.replace("const [selected, setSelected] = useState<Set<string>>(() => loadGreekFilterSelection(allKeys));", "const [selected, setSelected] = useState<Set<string>>(() => loadGreekFilterSelection(defaultKeys, undefined, allKeys));")
old_group = "    for (const config of lessonConfigs) {\n      if (sourceDeck.id === decks[config.vocabularyDeck].id) return config.vocabularyKey;"
new_group = "    if (sourceDeck.id === decks.newTestamentVocabulary.id) return newTestamentFrequencyGroupForCard(card)?.key ?? null;\n    for (const config of lessonConfigs) {\n      if (sourceDeck.id === decks[config.vocabularyDeck].id) return config.vocabularyKey;"
if old_group in text:
    text = text.replace(old_group, new_group, 1)
start = text.find("  function changeExactVocabularyDeck(")
if start >= 0:
    end = text.index("\n\n  function changeSavedCards", start)
    text = text[:start] + text[end + 2 :]
if "const newTestamentCards = useMemo" not in text:
    marker = "  const savedCardCount = useMemo(() => {"
    addition = '''  const newTestamentCards = useMemo(() => {
    if (!decks) return [];
    return decks.newTestamentVocabulary.cards.filter((card) => {
      const key = newTestamentFrequencyGroupForCard(card)?.key;
      return Boolean(key && selected.has(key) && !excludedCards.refs.has(savedCardRef(decks.newTestamentVocabulary.id, card.id)));
    });
  }, [decks, excludedCards.refs, selected]);

'''
    text = replace_once(text, marker, addition + marker, "NT selected cards")
old_sources = '''    for (const { config, vocabularyDeck, grammarDeck, vocabularyCards, endingCards } of lessonCardSets) {
      if (vocabularyCards.length) next.push({ id: `lesson${config.lesson}-vocabulary`, label: `Lesson ${config.lesson} vocabulary`, deck: vocabularyDeck, cards: vocabularyCards, studyKey: direction, direction });
      if (endingCards.length) next.push({ id: `lesson${config.lesson}-endings`, label: `Lesson ${config.lesson} endings`, deck: grammarDeck, cards: endingCards, studyKey: "forward", direction: "forward" });
    }'''
new_sources = old_sources + '''
    if (newTestamentCards.length) next.push({ id: "new-testament-vocabulary", label: "New Testament Vocab", deck: decks.newTestamentVocabulary, cards: newTestamentCards, studyKey: direction, direction });'''
if "id: \"new-testament-vocabulary\"" not in text:
    text = replace_once(text, old_sources, new_sources, "NT study source")
old_saved = '''      for (const { config, vocabularyDeck, grammarDeck } of lessonCardSets) {
        appendSaved(`saved-lesson${config.lesson}-vocabulary`, vocabularyDeck, direction, direction, () => true);
        appendSaved(`saved-lesson${config.lesson}-endings`, grammarDeck, "forward", "forward", (card) => Boolean(keyForCategory(config.categoryByKey, card.category)));
      }'''
new_saved = old_saved + '''
      appendSaved("saved-new-testament-vocabulary", decks.newTestamentVocabulary, direction, direction, () => true);'''
if "saved-new-testament-vocabulary" not in text:
    text = replace_once(text, old_saved, new_saved, "NT saved cards")
text = text.replace("  }, [decks, direction, excludedCards.refs, foundationCards, includeSavedCards, lessonCardSets, savedCards.refs]);", "  }, [decks, direction, excludedCards.refs, foundationCards, includeSavedCards, lessonCardSets, newTestamentCards, savedCards.refs]);")
if "const newTestamentState" not in text:
    text = replace_once(text, "  const vocabularyState = groupSelectionState(allVocabularyKeys);", "  const vocabularyState = groupSelectionState(allVocabularyKeys);\n  const newTestamentState = groupSelectionState(newTestamentVocabularyKeys);\n  const selectedNewTestamentCount = decks?.newTestamentVocabulary.cards.filter((card) => exactCardSelected(decks.newTestamentVocabulary, card)).length ?? 0;", "NT filter state")
lesson2 = '''      <FilterDisclosure title="Lesson 2" summary={`${lesson2State.selectedCount} of ${lesson2Keys.length} groups selected`} checked={lesson2State.checked} mixed={lesson2State.mixed} onCheckedChange={(checked) => changeGroups(lesson2Keys, checked)}>
        <FilterCheckbox label="Accent marks" count={countFoundation(categories.accents)} checked={groupSelectionState([keys.accents]).checked} mixed={groupSelectionState([keys.accents]).mixed} onChange={(checked) => changeGroups([keys.accents], checked)} />
      </FilterDisclosure>
'''
nt_filter = lesson2 + '''
      <FilterDisclosure title="New Testament Vocab" summary={`${selectedNewTestamentCount} of ${decks.newTestamentVocabulary.cards.length} words selected`} count={decks.newTestamentVocabulary.cards.length} checked={newTestamentState.checked} mixed={newTestamentState.mixed} onCheckedChange={(checked) => changeGroups(newTestamentVocabularyKeys, checked)}>
        {NEW_TESTAMENT_FREQUENCY_GROUPS.map((group) => {
          const cards = decks.newTestamentVocabulary.cards.filter((card) => card.metadata?.frequencyGroupKey === group.key);
          const state = groupSelectionState([group.key]);
          const selectedCount = cards.filter((card) => exactCardSelected(decks.newTestamentVocabulary, card)).length;
          return <FilterDisclosure key={group.key} title={group.label} summary={`${selectedCount} of ${cards.length} selected`} count={cards.length} nested checked={state.checked} mixed={state.mixed} onCheckedChange={(checked) => changeGroups([group.key], checked)}>
            {cards.map((card) => <FilterCheckbox key={card.id} label={`#${card.rank} · ${card.front}`} checked={exactCardSelected(decks.newTestamentVocabulary, card)} onChange={(checked) => changeExactCard(decks.newTestamentVocabulary, card, checked)} />)}
          </FilterDisclosure>;
        })}
      </FilterDisclosure>
'''
if 'title="New Testament Vocab"' not in text:
    text = replace_once(text, lesson2, nt_filter, "NT filter UI")
old_vocab = '''          <FilterDisclosure title="Vocabulary" summary={`${selectedVocabularyCount} of ${vocabularyDeck.cards.length} words selected`} count={vocabularyDeck.cards.length} nested checked={vocabularySelection.checked} mixed={vocabularySelection.mixed} onCheckedChange={(checked) => changeGroups([config.vocabularyKey], checked)}>
            <FilterDisclosure title="Vocabulary words" summary={`${selectedVocabularyCount} of ${vocabularyDeck.cards.length} selected`} count={vocabularyDeck.cards.length} nested checked={selectedVocabularyCount === vocabularyDeck.cards.length} mixed={selectedVocabularyCount > 0 && selectedVocabularyCount < vocabularyDeck.cards.length} onCheckedChange={(checked) => changeExactVocabularyDeck(vocabularyDeck, checked)}>
              <ExactCardSelection cards={vocabularyDeck.cards} isSelected={(card) => exactCardSelected(vocabularyDeck, card)} onCardChange={(card, checked) => changeExactCard(vocabularyDeck, card, checked)} sectionTitle={`Lesson ${config.lesson} words`} />
            </FilterDisclosure>
          </FilterDisclosure>'''
new_vocab = '''          <FilterDisclosure title="Vocabulary" summary={`${selectedVocabularyCount} of ${vocabularyDeck.cards.length} words selected`} count={vocabularyDeck.cards.length} nested checked={vocabularySelection.checked} mixed={vocabularySelection.mixed} onCheckedChange={(checked) => changeGroups([config.vocabularyKey], checked)}>
            {vocabularyDeck.cards.map((card) => <FilterCheckbox key={card.id} label={`#${card.rank} · ${card.front}`} checked={exactCardSelected(vocabularyDeck, card)} onChange={(checked) => changeExactCard(vocabularyDeck, card, checked)} />)}
          </FilterDisclosure>'''
if old_vocab in text:
    text = text.replace(old_vocab, new_vocab, 1)
text = text.replace('{sourceRef(card) && <span className="answer-notes">{sourceRef(card)}</span>}<GreekCardAudio card={card} /></div>;\n      }}', '{sourceRef(card) && <span className="answer-notes">{sourceRef(card)}</span>}{card.metadata?.audioDisabled !== true && <GreekCardAudio card={card} />}</div>;\n      }}')
p.write_text(text)

# Built-in Stats catalog.
p = Path("src/features/study/builtin-study-catalog.ts")
text = p.read_text()
if "greek-new-testament-vocab" not in text:
    text = replace_once(text, '} from "../../data/greek-lessons-9-10";\n', '} from "../../data/greek-lessons-9-10";\nimport { loadGreekNewTestamentVocabularyDeck } from "../../data/greek-new-testament-vocab";\n', "catalog import")
    needle = '  { id: "alpha-omega-lesson10-grammar", language: "Greek", source: "Lesson 10 Grammar", load: loadGreekLesson10GrammarDeck, modes: [{ mode: "Forward", direction: "forward", studyKey: "forward" }] },\n'
    text = replace_once(text, needle, needle + '  { id: "kubo-new-testament-vocab", language: "Greek", source: "New Testament Vocab", load: loadGreekNewTestamentVocabularyDeck, modes: [{ mode: "Forward", direction: "forward", studyKey: "forward" }, { mode: "Reverse", direction: "reverse", studyKey: "reverse" }] },\n', "catalog registration")
p.write_text(text)

# Visible Z pause hint beside timer, without widening the whole app.
p = Path("src/features/study/multi-source-study-session.tsx")
text = p.read_text()
if "toolbar-timer-shortcut" not in text:
    needle = '<span className="toolbar-timer-value">{displayedTimer}</span>\n              <button type="button" className="toolbar-timer-toggle"'
    replacement = '<span className="toolbar-timer-value">{displayedTimer}</span>\n              <span className="toolbar-timer-shortcut" aria-label="Z pauses the timer"><kbd>Z</kbd><span>Pause</span></span>\n              <button type="button" className="toolbar-timer-toggle"'
    text = replace_once(text, needle, replacement, "timer shortcut hint")
p.write_text(text)

p = Path("src/features/study/study-gate.css")
text = p.read_text()
if ".toolbar-timer-shortcut {" not in text:
    text += '''
.toolbar-timer-shortcut {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  color: var(--ink-soft);
  font-size: 0.72rem;
  font-weight: 750;
  white-space: nowrap;
}

.toolbar-timer-shortcut kbd {
  min-width: 1.35rem;
  padding: 0.08rem 0.3rem;
  border: 1px solid var(--border);
  border-radius: 0.35rem;
  background: var(--background);
  color: var(--ink);
  font: inherit;
  text-align: center;
}

@media (max-width: 720px) {
  .toolbar-timer-shortcut > span { display: none; }
}
'''
p.write_text(text)

# User-facing guide.
p = Path("src/pages/how-site-works.tsx")
text = p.read_text()
old = 'Greek Lessons 3–10 are organized around <strong>Vocabulary</strong> and <strong>Endings</strong>; the Vocabulary heading itself is the all-vocabulary control for that lesson, and its <strong>Vocabulary words</strong> dropdown exposes every word individually without a redundant second “All Lesson … vocabulary” row. Greek paradigm cards remain source data but are not exposed in the active lesson menu. Dickinson\'s larger Latin vocabulary list is divided into 10-card ranges such as <strong>1–10</strong> and <strong>11–20</strong>, which open to the exact individual cards.'
new = 'Greek Lessons 3–10 are organized around <strong>Vocabulary</strong> and <strong>Endings</strong>; opening a lesson\'s Vocabulary heading shows its individual words immediately, with no extra “Vocabulary words” layer. <strong>New Testament Vocab</strong> is a separate Kubo source, ordered from highest to lowest New Testament frequency. It is divided into parent bands of 1,000+, 500–999, 250–499, 150–249, 100–149, 75–99, 60–74, and 50–59 occurrences, and each band opens directly to its individual words. The answer side shows both the occurrence count and frequency rank. Kubo\'s separate John special-vocabulary lists are not imported unless a word also appears on the general frequency list. Greek paradigm cards remain source data but are not exposed in the active lesson menu. Dickinson\'s larger Latin vocabulary list is divided into 10-card ranges such as <strong>1–10</strong> and <strong>11–20</strong>, which open to the exact individual cards.'
if old in text:
    text = text.replace(old, new, 1)
old2 = 'The response timer measures active time on the unrevealed question side and is the first control in the main Greek/Latin toolbar. It pauses when the tab or window is hidden or loses focus. While question-side timing is running, <strong>Z</strong> stops the timer and reopens the Start gate.'
new2 = 'The response timer measures active time on the unrevealed question side and is the first control in the main Greek/Latin toolbar. The timer displays a compact <strong>Z Pause</strong> shortcut reminder. It pauses when the tab or window is hidden or loses focus. While question-side timing is running, <strong>Z</strong> stops the timer and reopens the Start gate.'
if old2 in text:
    text = text.replace(old2, new2, 1)
p.write_text(text)

# Maintenance conventions.
p = Path("AGENTS.md")
text = p.read_text()
text = text.replace('Each lesson Vocabulary heading is already its all-vocabulary selector, and Vocabulary words exposes exact cards, so do not add a redundant “All Lesson N vocabulary” row.', 'Each lesson Vocabulary heading is already its all-vocabulary selector and exposes exact word checkboxes immediately beneath it; do not add a redundant “Vocabulary words” or “All Lesson N vocabulary” layer.')
if "`kubo-new-testament-vocab` contains the 301 entries" not in text:
    text += '\n- `kubo-new-testament-vocab` contains the 301 entries in Kubo Appendix I’s general frequency list (pp. 274–277), ordered by descending occurrence frequency. Do not import John-only special-vocabulary entries from the later John lists. Preserve the source occurrence count and frequency rank on every card and group the selector into 1,000+, 500–999, 250–499, 150–249, 100–149, 75–99, 60–74, and 50–59 parent bands. These frequency bands are valid persistent filter keys but are not selected by default; explicit All Vocabulary / Select all actions may select them.\n'
text = text.replace('- Z stops active question-side timing and reopens the Start gate.', '- The timer toolbar visibly labels `Z` as the Pause shortcut. Z stops active question-side timing and reopens the Start gate.')
p.write_text(text)

# Update the regression test that describes the active Greek selector structure.
p = Path("tests/study-ux-request.test.ts")
text = p.read_text()
text = text.replace('it("routes Greek to a menu with vocabulary words and endings but no paradigm selector", () => {', 'it("routes Greek to direct vocabulary words and endings but no paradigm selector", () => {')
text = text.replace("    expect(page).toContain('title=\"Vocabulary words\"');\n", "    expect(page).not.toContain('title=\"Vocabulary words\"');\n    expect(page).toContain('title=\"New Testament Vocab\"');\n")
text = text.replace('    expect(page).toContain("<ExactCardSelection");\n', '    expect(page).toContain(\'label={`#${card.rank} · ${card.front}`}\');\n')
p.write_text(text)

# Optional-Greek-filter test.
p = Path("tests/filter-preferences.test.ts")
text = p.read_text()
if "optional Greek groups without enabling them by default" not in text:
    anchor = '  it("restores Latin vocabulary and paradigm selections exactly", () => {'
    test = '''  it("can restore optional Greek groups without enabling them by default", () => {
    const storage = memoryStorage();
    expect([...loadGreekFilterSelection(["lesson3-vocabulary"], storage, ["lesson3-vocabulary", "nt-vocab-1000-plus"])]).toEqual(["lesson3-vocabulary"]);
    saveGreekFilterSelection(new Set(["nt-vocab-1000-plus"]), storage);
    expect([...loadGreekFilterSelection(["lesson3-vocabulary"], storage, ["lesson3-vocabulary", "nt-vocab-1000-plus"])]).toEqual(["nt-vocab-1000-plus"]);
  });

'''
    text = replace_once(text, anchor, test + anchor, "filter preference test")
p.write_text(text)

# Dataset and structure regression tests.
Path("tests/greek-new-testament-vocab.test.ts").write_text('''import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type SourceCard = { id: string; greek: string; frequency: number; frequency_rank: number; group: string };
const bands = ["1000-plus", "500-999", "250-499", "150-249", "100-149", "75-99", "60-74", "50-59"];
const cards = bands.flatMap((band) => JSON.parse(readFileSync(`public/data/greek-new-testament-vocab-${band}.json`, "utf8")) as SourceCard[]);

describe("Kubo New Testament vocabulary", () => {
  it("contains exactly the 301 general-list entries in descending frequency order", () => {
    expect(cards).toHaveLength(301);
    expect(new Set(cards.map((card) => card.id)).size).toBe(301);
    expect(cards.map((card) => card.frequency_rank)).toEqual(Array.from({ length: 301 }, (_, index) => index + 1));
    expect(cards.every((card) => card.frequency >= 50)).toBe(true);
    expect(cards.every((card, index) => index === 0 || cards[index - 1].frequency >= card.frequency)).toBe(true);
  });
  it("uses the intended natural frequency bands", () => {
    const counts = Object.fromEntries(bands.map((band) => [band, cards.filter((card) => card.group === band).length]));
    expect(counts).toEqual({ "1000-plus": 19, "500-999": 19, "250-499": 23, "150-249": 44, "100-149": 60, "75-99": 57, "60-74": 42, "50-59": 37 });
  });
  it("includes general-list φάγω but no John-only χριστός import", () => {
    expect(cards.find((card) => card.greek === "φάγω")?.frequency).toBe(94);
    expect(cards.some((card) => card.greek.startsWith("χριστ"))).toBe(false);
  });
});
''')

# Remove accidental placeholder; the split frequency-band files are canonical.
Path("public/data/greek-new-testament-vocab.json").unlink(missing_ok=True)
