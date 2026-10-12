import { BUILTIN_STUDY_DECKS, type BuiltinDeckRegistration } from "../study/builtin-study-catalog";
import type { DeckDefinition, StudyCard } from "../study/types";

export type TranslationHelperLanguage = "greek" | "latin";

export type WhitakerMetadata = {
  partOfSpeech?: string;
  dictionaryDetails?: string;
  code?: string;
  age?: string;
  area?: string;
  geography?: string;
  frequency?: string;
  dictionarySource?: string;
  rawEntry?: string;
  rawAnalyses?: string[];
};

export type DictionaryMatch = {
  headword: string;
  definition: string;
  source: string;
  sourceRef?: string;
  externalUrl?: string;
  morphology?: string[];
  whitaker?: WhitakerMetadata;
};

const ignoredHeadwordTokens = new Set([
  "m", "f", "n", "nt", "sg", "pl", "adj", "adv", "prep", "pron", "conj", "interj", "v", "tr", "intr",
]);

const grotonDeckPattern = /^alpha-omega-lesson(\d+)-(vocab|grammar)$/u;
const greekTokenPattern = /[\p{Script=Greek}\p{M}]+/gu;

export function normalizeDictionaryKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLocaleLowerCase()
    .replace(/ς/g, "σ")
    .replace(/[‐‑‒–—-]/g, "")
    .replace(/[^\p{L}]/gu, "");
}

export function tokenizeTranslationText(text: string) {
  return text.split(/([\p{L}\p{M}]+(?:[’'][\p{L}\p{M}]+)*)/gu).filter((part) => part.length > 0);
}

function greekTokens(value: string) {
  return value.match(greekTokenPattern) ?? [];
}

function headwordForms(headword: string) {
  return headword
    .split(",")
    .map((part) => greekTokens(part)[0] ?? "")
    .filter(Boolean);
}

function lexicalAliases(headword: string) {
  const aliases = new Set<string>();
  const whole = normalizeDictionaryKey(headword);
  if (whole) aliases.add(whole);

  const tokens = headword.match(/[\p{L}\p{M}]+/gu) ?? [];
  for (const token of tokens) {
    const normalized = normalizeDictionaryKey(token);
    if (!normalized || ignoredHeadwordTokens.has(normalized)) continue;
    aliases.add(normalized);
  }
  return [...aliases];
}

function sourceRef(card: StudyCard) {
  return typeof card.metadata?.sourceRef === "string" ? card.metadata.sourceRef : undefined;
}

function sourceName(card: StudyCard, fallback: string) {
  return card.source || fallback;
}

function partOfSpeech(card: StudyCard) {
  return typeof card.metadata?.partOfSpeech === "string" ? card.metadata.partOfSpeech.toLocaleLowerCase() : "";
}

function vocabularyMatch(card: StudyCard, fallbackSource: string): DictionaryMatch {
  return {
    headword: card.front,
    definition: card.back,
    source: sourceName(card, fallbackSource),
    sourceRef: sourceRef(card),
  };
}

function addMatch(index: Map<string, DictionaryMatch[]>, alias: string, match: DictionaryMatch, prepend = false) {
  const key = normalizeDictionaryKey(alias);
  if (!key) return;
  const existing = index.get(key) ?? [];
  if (existing.some((item) => item.headword === match.headword && item.definition === match.definition && item.source === match.source && item.sourceRef === match.sourceRef && item.morphology?.join("|") === match.morphology?.join("|"))) return;
  if (prepend) existing.unshift(match);
  else existing.push(match);
  index.set(key, existing);
}

function addElisionAlias(index: Map<string, DictionaryMatch[]>, card: StudyCard, match: DictionaryMatch) {
  const pos = partOfSpeech(card);
  if (!/(particle|conjunction|preposition|adverb)/u.test(pos)) return;
  const lemma = headwordForms(card.front)[0];
  const key = lemma ? normalizeDictionaryKey(lemma) : "";
  if (!key || !/[αεηιουω]$/u.test(key)) return;
  const elided = key.slice(0, -1);
  if (elided) addMatch(index, elided, match);
}

function addVocabularyDeck(index: Map<string, DictionaryMatch[]>, deck: DeckDefinition, fallbackSource: string) {
  for (const card of deck.cards) {
    if (!card.front || !card.back) continue;
    const match = vocabularyMatch(card, fallbackSource);
    for (const alias of lexicalAliases(card.front)) addMatch(index, alias, match);
    addElisionAlias(index, card, match);
  }
}

type ChartRow = { label: string; cells: string[] };

function chartRows(card: StudyCard): ChartRow[] {
  const rows = card.metadata?.chartRows;
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const candidate = row as { label?: unknown; cells?: unknown };
    if (typeof candidate.label !== "string" || !Array.isArray(candidate.cells) || candidate.cells.some((cell) => typeof cell !== "string")) return [];
    return [{ label: candidate.label, cells: candidate.cells as string[] }];
  });
}

function chartColumns(card: StudyCard) {
  const columns = card.metadata?.chartColumns;
  return Array.isArray(columns) && columns.every((column) => typeof column === "string") ? columns as string[] : [];
}

function grammarLemma(card: StudyCard) {
  return greekTokens(card.front)[0] ?? null;
}

function grammarGroup(card: StudyCard) {
  return typeof card.metadata?.grammarGroup === "string" ? card.metadata.grammarGroup : card.category || card.back;
}

function expandOptionalForm(form: string) {
  const optionalEnding = form.match(/^([\p{L}\p{M}]+)\(([\p{L}\p{M}]+)\)$/u);
  if (!optionalEnding) return [form];
  return [optionalEnding[1], `${optionalEnding[1]}${optionalEnding[2]}`];
}

function expandKnownForms(cell: string) {
  return cell.split(/\s*\/\s*/u).flatMap((rawForm) => {
    const form = rawForm.trim();
    if (!form || /^[‐‑‒–—-]/u.test(form)) return [];
    return expandOptionalForm(form);
  });
}

function endingVariants(cell: string) {
  return cell.split(/\s*\/\s*/u).flatMap((rawEnding) => {
    const ending = rawEnding.trim().replace(/^[‐‑‒–—-]\s*/u, "");
    if (!ending) return [];
    return expandOptionalForm(ending).map(normalizeDictionaryKey).filter(Boolean);
  });
}

function rowNamed(card: StudyCard, name: string) {
  return chartRows(card).find((row) => row.label.toLocaleLowerCase().startsWith(name.toLocaleLowerCase())) ?? null;
}

function columnIndexes(card: StudyCard, type: "singular" | "plural") {
  return chartColumns(card)
    .map((column, index) => column.toLocaleLowerCase().includes(type) ? index : -1)
    .filter((index) => index >= 0);
}

function morphologyLabel(card: StudyCard, row: ChartRow, columnIndex: number) {
  const column = chartColumns(card)[columnIndex];
  return [grammarGroup(card), row.label, column].filter(Boolean).join(" · ");
}

function combinedSourceRef(lexical: DictionaryMatch, grammarCard: StudyCard) {
  const grammarRef = sourceRef(grammarCard);
  if (!grammarRef) return lexical.sourceRef;
  if (!lexical.sourceRef || lexical.sourceRef === grammarRef) return grammarRef;
  return `${lexical.sourceRef}; form: ${grammarRef}`;
}

function addStemmedChartForms(index: Map<string, DictionaryMatch[]>, stem: string, match: DictionaryMatch, grammarCard: StudyCard, columns: number[]) {
  for (const row of chartRows(grammarCard)) {
    for (const columnIndex of columns) {
      const cell = row.cells[columnIndex];
      if (!cell) continue;
      for (const ending of endingVariants(cell)) {
        addMatch(index, `${stem}${ending}`, {
          ...match,
          sourceRef: combinedSourceRef(match, grammarCard),
          morphology: [morphologyLabel(grammarCard, row, columnIndex)],
        });
      }
    }
  }
}

function nounChartMatch(card: StudyCard, grammarCard: StudyCard) {
  const group = grammarGroup(grammarCard);
  if (!group.includes("Declension") || !group.includes("Endings") || group.includes("Adjective")) return null;

  const forms = headwordForms(card.front);
  const lemma = forms[0] ? normalizeDictionaryKey(forms[0]) : "";
  const genitive = forms[1] ? normalizeDictionaryKey(forms[1]) : "";
  if (!lemma || !genitive) return null;

  const nominativeRow = rowNamed(grammarCard, "Nominative");
  const genitiveRow = rowNamed(grammarCard, "Genitive");
  if (!nominativeRow || !genitiveRow) return null;

  for (const singularColumn of columnIndexes(grammarCard, "singular")) {
    const nominatives = endingVariants(nominativeRow.cells[singularColumn] ?? "");
    const genitives = endingVariants(genitiveRow.cells[singularColumn] ?? "");
    for (const nominative of nominatives) {
      if (!nominative || !lemma.endsWith(nominative)) continue;
      for (const genitiveEnding of genitives) {
        if (!genitiveEnding || !genitive.endsWith(genitiveEnding)) continue;
        return { stem: lemma.slice(0, -nominative.length), singularColumn };
      }
    }
  }
  return null;
}

function addNounInflections(index: Map<string, DictionaryMatch[]>, card: StudyCard, match: DictionaryMatch, grammarCards: StudyCard[]) {
  for (const grammarCard of grammarCards) {
    const resolved = nounChartMatch(card, grammarCard);
    if (!resolved) continue;
    addStemmedChartForms(index, resolved.stem, match, grammarCard, [resolved.singularColumn, ...columnIndexes(grammarCard, "plural")]);
    return;
  }
}

function adjectiveGender(group: string) {
  if (group.includes("Masculine")) return "masculine" as const;
  if (group.includes("Feminine")) return "feminine" as const;
  if (group.includes("Neuter")) return "neuter" as const;
  return null;
}

function adjectiveSingularColumn(grammarCard: StudyCard, descriptor: string) {
  const nominativeRow = rowNamed(grammarCard, "Nominative");
  if (!nominativeRow) return null;
  for (const singularColumn of columnIndexes(grammarCard, "singular")) {
    for (const ending of endingVariants(nominativeRow.cells[singularColumn] ?? "")) {
      if (ending && descriptor.endsWith(ending)) return { singularColumn, ending };
    }
  }
  return null;
}

function addAdjectiveInflections(index: Map<string, DictionaryMatch[]>, card: StudyCard, match: DictionaryMatch, grammarCards: StudyCard[]) {
  const forms = headwordForms(card.front);
  const masculine = forms[0] ? normalizeDictionaryKey(forms[0]) : "";
  const feminine = forms[1] ? normalizeDictionaryKey(forms[1]) : "";
  const neuter = forms[2] ? normalizeDictionaryKey(forms[2]) : "";
  if (!masculine || !feminine || !neuter) return;

  const adjectiveCharts = grammarCards.filter((grammarCard) => {
    const group = grammarGroup(grammarCard);
    return group.includes("Adjective Endings") && adjectiveGender(group);
  });
  const masculineChart = adjectiveCharts.find((grammarCard) => adjectiveGender(grammarGroup(grammarCard)) === "masculine");
  if (!masculineChart) return;
  const masculineVariant = adjectiveSingularColumn(masculineChart, masculine);
  if (!masculineVariant) return;
  const stem = masculine.slice(0, -masculineVariant.ending.length);

  const seen = new Set<string>();
  for (const grammarCard of adjectiveCharts) {
    const gender = adjectiveGender(grammarGroup(grammarCard));
    if (!gender || seen.has(gender)) continue;
    const descriptor = gender === "masculine" ? masculine : gender === "feminine" ? feminine : neuter;
    const variant = adjectiveSingularColumn(grammarCard, descriptor);
    if (!variant) continue;
    addStemmedChartForms(index, stem, match, grammarCard, [variant.singularColumn, ...columnIndexes(grammarCard, "plural")]);
    seen.add(gender);
  }
}

function thematicStem(form: string | undefined) {
  if (!form) return null;
  const key = normalizeDictionaryKey(form);
  if (key.endsWith("ομαι")) return key.slice(0, -4);
  if (key.endsWith("ω")) return key.slice(0, -1);
  return null;
}

function augmentedStem(stem: string | null) {
  if (!stem) return null;
  if (/^[αεηιουω]/u.test(stem)) return null;
  return `ε${stem}`;
}

function verbEndingChart(card: StudyCard) {
  const group = grammarGroup(card);
  return group.includes("Endings") && /(Indicative|Infinitive|Imperative)/u.test(group) && /(Present|Future|Imperfect)/u.test(group);
}

function addVerbInflections(index: Map<string, DictionaryMatch[]>, card: StudyCard, match: DictionaryMatch, grammarCards: StudyCard[]) {
  const forms = headwordForms(card.front);
  const presentStem = thematicStem(forms[0]);
  const futureStem = thematicStem(forms[1]);
  if (!presentStem && !futureStem) return;

  for (const grammarCard of grammarCards) {
    if (!verbEndingChart(grammarCard)) continue;
    const group = grammarGroup(grammarCard);
    const isFuture = group.includes("Future");
    const isImperfect = group.includes("Imperfect");
    const base = isFuture ? futureStem : isImperfect ? augmentedStem(presentStem) : presentStem;
    if (!base) continue;

    for (const row of chartRows(grammarCard)) {
      row.cells.forEach((cell, columnIndex) => {
        for (const rawEnding of endingVariants(cell)) {
          let ending = rawEnding;
          if (isFuture && /[σξψ]$/u.test(base) && ending.startsWith("σ")) ending = ending.slice(1);
          addMatch(index, `${base}${ending}`, {
            ...match,
            sourceRef: combinedSourceRef(match, grammarCard),
            morphology: [morphologyLabel(grammarCard, row, columnIndex)],
          });
        }
      });
    }
  }
}

function addProductiveGrotonForms(index: Map<string, DictionaryMatch[]>, vocabularyDecks: DeckDefinition[], grammarDecks: DeckDefinition[]) {
  const grammarCards = grammarDecks.flatMap((deck) => deck.cards);
  for (const deck of vocabularyDecks) {
    for (const card of deck.cards) {
      if (!card.front || !card.back) continue;
      const pos = partOfSpeech(card);
      const match = vocabularyMatch(card, "Groton, From Alpha to Omega");
      if (pos.includes("noun")) addNounInflections(index, card, match, grammarCards);
      if (pos.includes("adjective")) addAdjectiveInflections(index, card, match, grammarCards);
      if (pos.includes("verb")) addVerbInflections(index, card, match, grammarCards);
    }
  }
}

function addStandaloneArticleForms(index: Map<string, DictionaryMatch[]>, card: StudyCard) {
  if (!grammarGroup(card).includes("Definite Article")) return;
  for (const row of chartRows(card)) {
    row.cells.forEach((cell, columnIndex) => {
      for (const form of expandKnownForms(cell)) {
        const key = normalizeDictionaryKey(form);
        const existingArticle = index.get(key)?.some((item) => item.headword === "ὁ, ἡ, τό");
        if (existingArticle) continue;
        addMatch(index, form, {
          headword: "ὁ, ἡ, τό",
          definition: "the (definite article)",
          source: sourceName(card, "Groton, From Alpha to Omega"),
          sourceRef: sourceRef(card),
          morphology: [[row.label, chartColumns(card)[columnIndex]].filter(Boolean).join(" · ")].filter(Boolean),
        }, true);
      }
    });
  }
}

function addGrammarForms(index: Map<string, DictionaryMatch[]>, deck: DeckDefinition) {
  for (const card of deck.cards) {
    const lemma = grammarLemma(card);
    const lexicalMatch = lemma ? index.get(normalizeDictionaryKey(lemma))?.[0] : null;
    if (!lexicalMatch) {
      addStandaloneArticleForms(index, card);
      continue;
    }

    const columns = chartColumns(card);
    for (const row of chartRows(card)) {
      row.cells.forEach((cell, columnIndex) => {
        const column = columns[columnIndex];
        const morphology = [grammarGroup(card), row.label, column].filter(Boolean).join(" · ");
        for (const form of expandKnownForms(cell)) {
          addMatch(index, form, {
            ...lexicalMatch,
            sourceRef: sourceRef(card) ?? lexicalMatch.sourceRef,
            morphology: morphology ? [morphology] : undefined,
          }, true);
        }
      });
    }
  }
}

function grotonLessonNumber(registration: BuiltinDeckRegistration) {
  const match = registration.id.match(grotonDeckPattern);
  return match ? Number(match[1]) : -1;
}

export function translationGreekRegistrations(registrations: readonly BuiltinDeckRegistration[] = BUILTIN_STUDY_DECKS) {
  const groton = registrations
    .filter((registration) => registration.language === "Greek" && grotonDeckPattern.test(registration.id))
    .slice()
    .sort((a, b) => grotonLessonNumber(b) - grotonLessonNumber(a));
  return {
    grotonVocabulary: groton.filter((registration) => registration.id.endsWith("-vocab")),
    grotonGrammar: groton.filter((registration) => registration.id.endsWith("-grammar")),
    kubo: registrations.find((registration) => registration.id === "kubo-new-testament-vocab") ?? null,
  };
}

export function buildGreekTranslationIndex(grotonVocabularyDecks: DeckDefinition[], grotonGrammarDecks: DeckDefinition[], kuboDeck?: DeckDefinition | null) {
  const index = new Map<string, DictionaryMatch[]>();
  for (const deck of grotonVocabularyDecks) addVocabularyDeck(index, deck, "Groton, From Alpha to Omega");
  addProductiveGrotonForms(index, grotonVocabularyDecks, grotonGrammarDecks);
  for (const deck of grotonGrammarDecks) addGrammarForms(index, deck);
  if (kuboDeck) addVocabularyDeck(index, kuboDeck, "Kubo New Testament Vocabulary");
  return index;
}

let greekIndexPromise: Promise<Map<string, DictionaryMatch[]>> | null = null;

export function loadTranslationDictionary(language: TranslationHelperLanguage) {
  if (language === "latin") return Promise.resolve(new Map<string, DictionaryMatch[]>());

  if (!greekIndexPromise) {
    const { grotonVocabulary, grotonGrammar, kubo } = translationGreekRegistrations();
    greekIndexPromise = Promise.all([
      Promise.all(grotonVocabulary.map((registration) => registration.load())),
      Promise.all(grotonGrammar.map((registration) => registration.load())),
      kubo?.load() ?? Promise.resolve(null),
    ]).then(([vocabularyDecks, grammarDecks, kuboDeck]) => buildGreekTranslationIndex(vocabularyDecks, grammarDecks, kuboDeck));
  }
  return greekIndexPromise;
}

export function lookupDictionaryWord(index: Map<string, DictionaryMatch[]>, surface: string) {
  return index.get(normalizeDictionaryKey(surface)) ?? [];
}
