import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildGreekTranslationIndex, lookupDictionaryWord, normalizeDictionaryKey,
} from "../src/features/translation/dictionary-sources";
import {
  lesson20Vocabulary, lesson20Perfects, lesson20NounForms,
} from "../src/features/translation/groton-lesson20";
import { BUILTIN_STUDY_DECKS } from "../src/features/study/builtin-study-catalog";
import type { DeckDefinition, StudyCard } from "../src/features/study/types";

type Vocabulary = { id: string; greek: string; meaning: string; part_of_speech: string; source_ref?: string; third_principal_part?: string };
type Grammar = { id: string; category: string; prompt: string; rows: { label: string; cells: string[] }[]; columns: string[]; source_ref?: string };
const vocabPaths = Array.from({length:17},(_,i)=>i+3);
const vocabulary = vocabPaths.map(n=>({n,items:JSON.parse(fs.readFileSync("public/data/greek-lesson"+n+"-vocab.json","utf8")) as Vocabulary[]}));
const grammars = vocabPaths.filter(n=>fs.existsSync("public/data/greek-lesson"+n+"-grammar.json"))
  .map(n=>({n,items:JSON.parse(fs.readFileSync("public/data/greek-lesson"+n+"-grammar.json","utf8")) as Grammar[]}));
function vdeck(n:number,items:Vocabulary[]):DeckDefinition {
  const id="alpha-omega-lesson"+n+"-vocab";
  return {id, slug:"greek", language:"greek", title:"Lesson "+n, eyebrow:"Vocabulary", description:"Source",
    supportsReverse:true,cards:items.map((x):StudyCard=>({
      id:x.id,deckId:id,front:x.greek,back:x.meaning,
      metadata:{partOfSpeech:x.part_of_speech,thirdPrincipalPart:x.third_principal_part,sourceRef:x.source_ref},
    }))};
}
function gdeck(n:number,items:Grammar[]):DeckDefinition {
  const id="alpha-omega-lesson"+n+"-grammar";
  return {id, slug:"greek", language:"greek", title:"Lesson "+n, eyebrow:"Grammar", description:"Source",
    supportsReverse:false,cards:items.map((x):StudyCard=>({
      id:x.id,deckId:id,front:x.prompt,back:x.category,category:x.category,
      metadata:{grammarGroup:x.category,chartColumns:x.columns,chartRows:x.rows,sourceRef:x.source_ref},
    }))};
}
const index=buildGreekTranslationIndex(vocabulary.map(x=>vdeck(x.n,x.items)),grammars.map(x=>gdeck(x.n,x.items)));
function has(form:string,headword:string,morph?:string){
  return lookupDictionaryWord(index,form).some(x=>
    normalizeDictionaryKey(x.headword.match(/[\p{Script=Greek}\p{M}]+/u)?.[0] ?? "")===normalizeDictionaryKey(headword)
    && (!morph || x.morphology?.some(y=>y.includes(morph))));
}

describe("Groton Lesson 20 Translation Helper coverage",()=>{
  it("adds ten sourced entries to the helper without silently changing study cards",()=>{
    expect(lesson20Vocabulary).toHaveLength(10);
    expect(lesson20Vocabulary.map(x=>x.id)).toEqual(Array.from({length:10},(_,i)=>"lesson20-v"+(i+1)));
    expect(lesson20Vocabulary.every(x=>x.source_ref&&x.meaning)).toBe(true);
    for(const item of lesson20Vocabulary) {
      const headword=item.greek.match(/[\p{Script=Greek}\p{M}]+/u)?.[0] ?? "";
      expect(has(headword,headword),item.id+" "+headword).toBe(true);
    }
    expect(BUILTIN_STUDY_DECKS.filter(x=>x.id.startsWith("alpha-omega-lesson20-"))).toHaveLength(2);
  });

  it("recognizes the new Lesson 20 verbs, principal parts, prepositions and nouns",()=>{
    for(const [form,lemma] of [
      ["ζητῶ","ζητέω"],["ἐζήτηκα","ζητέω"],["ἔρριψαν","ῥίπτω"],["ἔρριφα","ῥίπτω"],
      ["γῆν","γῆ"],["Ἑλλάδα","Ἑλλάς"],["Ἑλλήνων","Ἕλλην"],["Ἕλλησι","Ἕλλην"],
      ["δένδρῳ","δένδρον"],["Ἑλληνικός","Ἑλληνικός"],["οὐρανοῦ","οὐρανός"],
      ["κατ’","κατά"],["καθ’","κατά"],["ὑπὲρ","ὑπέρ"],
    ] as const) expect(has(form,lemma),form+" → "+lemma).toBe(true);
    expect(lesson20NounForms.some(x=>x.form==="Ἑλλάδα")).toBe(true);
  });

  it("handles the complete perfect-active and pluperfect active patterns for fourth principal parts",()=>{
    expect(lesson20Perfects).toHaveLength(13);
    const forms=[
      ["εἰρήκᾱσιν","λέγω","Perfect Active Indicative"],
      ["πεπράχᾱσιν","πράττω","Perfect Active Indicative"],
      ["ἠκηκόεσαν","ἀκούω","Pluperfect Active Indicative"],
      ["γέγραφεν","γράφω","Perfect Active Indicative"],
      ["πέποιθας","πείθω","Perfect Active Indicative"],
      ["ἠθελήκειν","ἐθέλω","Pluperfect Active Indicative"],
      ["ἐπεπόμφειν","πέμπω","Pluperfect Active Indicative"],
      ["βέβλεφαμεν","βλέπω","Perfect Active Indicative"],
      ["πεπαίδευκας","παιδεύω","Perfect Active Indicative"],
      ["βέβλαφας","βλάπτω","Perfect Active Indicative"],
      ["εὑρηκέναι","εὑρίσκω","Perfect Active Infinitive"],
      ["εἰρηκέναι","λέγω","Perfect Active Infinitive"],
      ["ἐρρίφαμεν","ῥίπτω","Perfect Active Indicative"],
      ["ἐζητήκαμεν","ζητέω","Perfect Active Indicative"],
    ] as const;
    for(const [word,lemma,morphology] of forms)
      expect(has(word,lemma,morphology),word+" → "+lemma).toBe(true);
  });

  it("preserves all vocabulary and form registrations from Lessons 3 through 19",()=>{
    expect(vocabulary).toHaveLength(17);
    for(const {items} of vocabulary) for(const item of items) {
      const lemma=item.greek.match(/[\p{Script=Greek}\p{M}]+/u)?.[0]??"";
      expect(has(lemma,lemma),item.id).toBe(true);
    }
    expect(has("ἔλαβες","λαμβάνω","Second Aorist Active Indicative")).toBe(true);
    expect(has("ἑαυταῖς","ἑαυτοῦ","Plural · Dative")).toBe(true);
    expect(index.size).toBeGreaterThan(600);
  });
});
