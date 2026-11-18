import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { hasAmbiguousGreekTonos } from "../src/features/greek/greek-orthography";
import { BUILTIN_STUDY_DECKS } from "../src/features/study/builtin-study-catalog";
import { buildGreekTranslationIndex, lookupDictionaryWord, normalizeDictionaryKey, translationGreekRegistrations } from "../src/features/translation/dictionary-sources";
import { resolveBuiltinGreekAsset } from "../supabase/functions/course-audio/builtin-greek-assets";
import type { DeckDefinition, StudyCard } from "../src/features/study/types";

type Vocab = { id: string; greek: string; meaning: string; part_of_speech: string; lesson: number; source_ref: string; third_principal_part?: string };
type Chart = { id: string; category: string; prompt: string; columns: string[]; rows: { label: string; cells: string[] }[]; source_ref: string };
const read = <T>(path: string) => JSON.parse(fs.readFileSync(path, "utf8")) as T;
const vocab = read<Vocab[]>("public/data/greek-lesson19-vocab.json");
const grammar = read<Chart[]>("public/data/greek-lesson19-grammar.json");

function vocabDeck(): DeckDefinition {
  return {
    id: "alpha-omega-lesson19-vocab", slug: "greek", title: "Lesson 19 Vocabulary", eyebrow: "Vocabulary",
    description: "source test", language: "greek", supportsReverse: true,
    cards: vocab.map((item): StudyCard => ({
      id: item.id, deckId: "alpha-omega-lesson19-vocab", front: item.greek, back: item.meaning,
      metadata: { partOfSpeech: item.part_of_speech, sourceRef: item.source_ref },
    })),
  };
}

function grammarDeck(): DeckDefinition {
  return {
    id: "alpha-omega-lesson19-grammar", slug: "greek", title: "Lesson 19 Grammar", eyebrow: "Grammar",
    description: "source test", language: "greek", supportsReverse: false,
    cards: grammar.map((item): StudyCard => ({
      id: item.id, deckId: "alpha-omega-lesson19-grammar", front: item.prompt, back: item.category, category: item.category,
      metadata: { grammarGroup: item.category, chartColumns: item.columns, chartRows: item.rows, sourceRef: item.source_ref },
    })),
  };
}

describe("Groton Lesson 19: second aorist and reflexive pronouns", () => {
  it("has eleven unique, ordered vocabulary cards, including both new verb principal parts", () => {
    expect(vocab).toHaveLength(11);
    expect(vocab.map((x) => x.id)).toEqual(Array.from({ length: 11 }, (_, i) => "lesson19-v" + (i+1)));
    expect(vocab.map((x) => x.part_of_speech)).toEqual([
      "verb", "verb", "noun", "pronoun", "pronoun", "pronoun", "pronoun", "pronoun", "adjective", "preposition", "preposition",
    ]);
    expect(vocab[0].greek).toBe("λαμβάνω, λήψομαι, ἔλαβον, εἴληφα");
    expect(vocab[1].greek).toBe("μένω, μενῶ, ἔμεινα, μεμένηκα");
    expect(vocab[0].third_principal_part).toBe("ἔλαβον");
    expect(vocab[1].third_principal_part).toBe("ἔμεινα");
    expect(vocab.every(x => x.lesson === 19 && x.source_ref && x.meaning)).toBe(true);
  });

  it("has six second-aorist active/middle charts: indicative, infinitives and imperatives", () => {
    expect(grammar.slice(0,6).map(x=>x.category)).toEqual([
      "Second Aorist Active Indicative Endings",
      "Second Aorist Middle Indicative Endings",
      "Second Aorist Active Infinitive Endings",
      "Second Aorist Middle Infinitive Endings",
      "Second Aorist Active Imperative Endings",
      "Second Aorist Middle Imperative Endings",
    ]);
    expect(grammar[0].rows.map(x=>x.cells)).toEqual([["-ον","-ομεν"],["-ες","-ετε"],["-ε(ν)","-ον"]]);
    expect(grammar[1].rows.map(x=>x.cells)).toEqual([["-όμην","-όμεθα"],["-ου (-εσο)","-εσθε"],["-ετο","-οντο"]]);
    expect(grammar[2].rows[0].cells).toEqual(["-εῖν"]);
    expect(grammar[3].rows[0].cells).toEqual(["-έσθαι"]);
    expect(grammar[4].rows.map(x=>x.cells)).toEqual([["-ε","-ετε"],["-έτω","-όντων"]]);
    expect(grammar[5].rows.map(x=>x.cells)).toEqual([["-οῦ (-εσο)","-εσθε"],["-έσθω","-έσθων"]]);
  });

  it("follows the Lesson 13 pronoun convention: distinct singular and plural cards, case rows and gender columns", () => {
    expect(grammar).toHaveLength(12);
    const pronouns = grammar.slice(6);
    expect(pronouns.map(x => x.id)).toEqual([
      "lesson19-chart-first-person-reflexive-pronouns",
      "lesson19-chart-first-person-reflexive-pronouns-plural",
      "lesson19-chart-second-person-reflexive-pronouns",
      "lesson19-chart-second-person-reflexive-pronouns-plural",
      "lesson19-chart-third-person-reflexive-pronouns",
      "lesson19-chart-third-person-reflexive-pronouns-plural",
    ]);
    const persons = ["First-Person", "First-Person", "Second-Person", "Second-Person", "Third-Person", "Third-Person"];
    for (const [i, chart] of pronouns.entries()) {
      const number = i % 2 === 0 ? "Singular" : "Plural";
      expect(chart.category).toBe(`${persons[i]} Reflexive Pronoun Forms — ${number}`);
      expect(chart.prompt).toBe(chart.category);
      expect(chart.rows.map(x => x.label)).toEqual(["Genitive", "Dative", "Accusative"]);
      expect(chart.columns).toEqual(i >= 4 ? ["Masculine", "Feminine", "Neuter"] : ["Masculine", "Feminine"]);
      expect(chart.rows.every(x => x.cells.length === chart.columns.length && x.cells.every(Boolean))).toBe(true);
      expect(chart.source_ref).toContain("Groton 19.116");
    }
    expect(pronouns[0].rows[0].cells).toEqual(["ἐμαυτοῦ", "ἐμαυτῆς"]);
    expect(pronouns[1].rows[2].cells).toEqual(["ἡμᾶς αὐτούς", "ἡμᾶς αὐτάς"]);
    expect(pronouns[2].rows[0].cells[0]).toContain("σαυτοῦ");
    expect(pronouns[3].rows[1].cells).toEqual(["ὑμῖν αὐτοῖς", "ὑμῖν αὐταῖς"]);
    expect(pronouns[4].rows[0].cells[0]).toContain("αὑτοῦ");
    expect(pronouns[5].rows[2].cells).toEqual(["ἑαυτούς", "ἑαυτάς", "ἑαυτά"]);
  });

  it("registers both decks for study, selection, stats, dictionary and audio", () => {
    const source=fs.readFileSync("src/pages/greek-page-v2.tsx","utf8");
    const loader=fs.readFileSync("src/data/greek-lessons-9-10.ts","utf8");
    expect(source).toContain("lesson: 19, vocabularyKey: keys.lesson19Vocabulary");
    expect(source).toContain("lesson19ReflexiveThirdPlural");
    expect(source).toContain("Endings & Pronoun Forms");
    expect(source).toContain("lesson19AoristMiddleImperative");
    expect(loader).toContain("loadGreekLesson19VocabularyDeck");
    expect(loader).toContain("loadGreekLesson19GrammarDeck");
    for(const kind of ["vocab","grammar"]) {
      const id="alpha-omega-lesson19-"+kind;
      expect(BUILTIN_STUDY_DECKS.find(deck=>deck.id===id)).toBeDefined();
      expect(translationGreekRegistrations().grotonVocabulary.concat(translationGreekRegistrations().grotonGrammar).some(x=>x.id===id)).toBe(true);
    }
    for (const item of [...vocab,...grammar]){
      const audio=resolveBuiltinGreekAsset(item.id);
      expect(audio,item.id).not.toBeNull();
      expect(audio?.canonicalIpa,item.id).toBeTruthy();
      expect(audio?.ttsText,item.id).toBeTruthy();
    }
  });

  it("indexes full singular/plural reflexive case forms with the correct vocabulary headwords", () => {
    const index=buildGreekTranslationIndex([vocabDeck()],[grammarDeck()]);
    for(const [form,headword,grammaticalCase] of [
      ["ἐμαυτῷ","ἐμαυτοῦ","Singular · Dative"],
      ["ἡμᾶς αὐτούς","ἡμῶν","Plural · Accusative"],
      ["σεαυτῆς","σεαυτοῦ","Singular · Genitive"],
      ["σαυτῇ","σεαυτοῦ","Singular · Dative"],
      ["ὑμῖν αὐτοῖς","ὑμῶν","Plural · Dative"],
      ["ἑαυτόν","ἑαυτοῦ","Singular · Accusative"],
      ["αὑτῆς","ἑαυτοῦ","Singular · Genitive"],
      ["ἑαυταῖς","ἑαυτοῦ","Plural · Dative"],
      ["ἑαυτά","ἑαυτοῦ","Plural · Accusative"],
    ] as const){
      const matches=lookupDictionaryWord(index,form);
      expect(matches.some(x=>normalizeDictionaryKey(x.headword.match(/[\p{Script=Greek}\p{M}]+/u)?.[0] ?? "")===normalizeDictionaryKey(headword) &&
        x.morphology?.some(v=>v.includes(grammaticalCase))),form).toBe(true);
    }
  });

  it("keeps source-provided polytonic accents and all previous vocabulary card IDs", () => {
    for (const file of ["public/data/greek-lesson19-vocab.json", "public/data/greek-lesson19-grammar.json"])
      expect(hasAmbiguousGreekTonos(fs.readFileSync(file,"utf8")),file).toBe(false);
    for (const lesson of [6,8,10,14,15]){
      const cards=read<Vocab[]>("public/data/greek-lesson"+lesson+"-vocab.json");
      expect(cards.map(x=>x.id)).toEqual(cards.map((_,i)=>"lesson"+lesson+"-v"+(i+1)));
    }
    const verbs=[
      [6,"lesson6-v3","ἔσχον"],[8,"lesson8-v1","εὗρον/ηὗρον"],[8,"lesson8-v2","ἔλιπον"],
      [10,"lesson10-v1","εἶπον/ἔλεξα"],[10,"lesson10-v3","ἔφυγον"],[14,"lesson14-v2","ἤνεγκον/ἤνεγκα"],[15,"lesson15-v2","ἔβαλον"],
    ] as const;
    for (const [lesson,id,part] of verbs){
      const card=read<Vocab[]>("public/data/greek-lesson"+lesson+"-vocab.json").find(x=>x.id===id);
      expect(card?.third_principal_part,id).toBe(part);
      expect(card?.greek.includes(", "+part),id).toBe(true);
    }
  });
});
