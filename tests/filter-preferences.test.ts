import { describe, expect, it } from "vitest";
import { loadGreekFilterSelection, loadLatinFilterPreferences, saveGreekFilterSelection, saveLatinFilterPreferences } from "../src/features/study/filter-preferences";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem(key: string) { return values.get(key) ?? null; },
    setItem(key: string, value: string) { values.set(key, value); },
  };
}

describe("study filter preferences", () => {
  it("restores the last Greek filter selection, including an empty selection", () => {
    const storage = memoryStorage();
    saveGreekFilterSelection(new Set(["lesson1-uppercase", "lesson2-accents"]), storage);
    expect([...loadGreekFilterSelection(["lesson1-uppercase", "lesson1-lowercase", "lesson2-accents"], storage)].sort()).toEqual(["lesson1-uppercase", "lesson2-accents"]);

    saveGreekFilterSelection(new Set(), storage);
    expect([...loadGreekFilterSelection(["lesson1-uppercase"], storage)]).toEqual([]);
  });

  it("restores Latin vocabulary and paradigm selections exactly", () => {
    const storage = memoryStorage();
    saveLatinFilterPreferences({
      materials: new Set(["adjective-paradigms", "active-indicative-paradigms", "passive-indicative-paradigms"]),
      vocabularyParts: new Set(["Noun: 1st Declension", "Verb: 1st Conjugation"]),
      paradigmCards: new Set(["latin-adjective-3rd-gravis", "latin-active-indicative-present-1st", "latin-passive-indicative-present-1st"]),
    }, storage);

    const restored = loadLatinFilterPreferences(storage);
    expect([...restored.materials].sort()).toEqual(["active-indicative-paradigms", "adjective-paradigms", "passive-indicative-paradigms"]);
    expect([...(restored.vocabularyParts ?? [])].sort()).toEqual(["Noun: 1st Declension", "Verb: 1st Conjugation"]);
    expect([...(restored.paradigmCards ?? [])].sort()).toEqual(["latin-active-indicative-present-1st", "latin-adjective-3rd-gravis", "latin-passive-indicative-present-1st"]);
  });

  it("persists the new Participles source and individual-card choices without changing older selections", () => {
    const storage = memoryStorage();
    saveLatinFilterPreferences({
      materials: new Set(["vocabulary", "participles"]),
      vocabularyParts: null,
      paradigmCards: new Set(["latin-participle-present-active"]),
    }, storage);
    const restored = loadLatinFilterPreferences(storage);
    expect([...restored.materials].sort()).toEqual(["participles", "vocabulary"]);
    expect([...restored.paradigmCards!]).toEqual(["latin-participle-present-active"]);
  });

  it("migrates a saved third-declension selection to include newly released Rules 80 and 82", () => {
    const storage = memoryStorage();
    storage.setItem("greeklatinstudy:latin-filters:v1", JSON.stringify({
      materials: ["adjective-paradigms"],
      vocabularyParts: null,
      paradigmCards: ["latin-adjective-3rd-gravis"],
    }));

    const restored = loadLatinFilterPreferences(storage);
    expect([...(restored.paradigmCards ?? [])].sort()).toEqual([
      "latin-adjective-3rd-acer",
      "latin-adjective-3rd-diligens",
      "latin-adjective-3rd-gravis",
    ]);
    saveLatinFilterPreferences({ ...restored, paradigmCards: new Set(["latin-adjective-3rd-gravis"]) }, storage);
    const intentionallyRestricted = loadLatinFilterPreferences(storage);
    expect([...(intentionallyRestricted.paradigmCards ?? [])]).toEqual(["latin-adjective-3rd-gravis"]);
  });

  it("does not turn on new third-declension cards when the older third-declension card was not selected", () => {
    const storage = memoryStorage();
    storage.setItem("greeklatinstudy:latin-filters:v1", JSON.stringify({
      materials: ["adjective-paradigms"],
      vocabularyParts: null,
      paradigmCards: ["latin-adjective-1st-2nd-feminine"],
    }));
    expect([...(loadLatinFilterPreferences(storage).paradigmCards ?? [])])
      .toEqual(["latin-adjective-1st-2nd-feminine"]);
  });

  it("drops deleted Henle material keys from older stored preferences", () => {
    const storage = memoryStorage();
    storage.setItem("greeklatinstudy:latin-filters:v1", JSON.stringify({
      materials: ["grammar-forms", "grammar-charts", "vocabulary"],
      vocabularyParts: null,
      paradigmCards: null,
    }));
    expect([...loadLatinFilterPreferences(storage).materials]).toEqual(["vocabulary"]);
  });

  it("uses vocabulary as the default when no stored preference exists", () => {
    const restored = loadLatinFilterPreferences(memoryStorage());
    expect([...restored.materials]).toEqual(["vocabulary"]);
    expect(restored.vocabularyParts).toBeNull();
    expect(restored.paradigmCards).toBeNull();
  });
});
