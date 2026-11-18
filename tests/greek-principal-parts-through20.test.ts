import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { hasAmbiguousGreekTonos } from "../src/features/greek/greek-orthography";
import { resolveBuiltinGreekAsset } from "../supabase/functions/course-audio/builtin-greek-assets";

type Vocabulary = {
  id: string;
  greek: string;
  meaning: string;
  lesson: number;
  source_ref: string;
  part_of_speech: string;
  third_principal_part?: string;
  fourth_principal_part?: string;
};
const lessons=Array.from({length:18},(_,i)=>i+3);
const cards=lessons.flatMap(lesson=>{
  const path="public/data/greek-lesson"+lesson+"-vocab.json";
  const items=JSON.parse(fs.readFileSync(path,"utf8")) as Vocabulary[];
  if(hasAmbiguousGreekTonos(fs.readFileSync(path,"utf8"))) throw Error("Ambiguous Greek tonos in "+path);
  return items;
});
const verbs=cards.filter(x=>x.part_of_speech==="verb");

// Fixed expected fourth principal parts from Groton's Lesson 20 first/second
// perfect review. No fifth/sixth principal parts are imported from later lessons.
// Variants taught together remain grouped into the single fourth slot.
const fourth: Record<string,string>={
  "lesson3-v1":"γέγραφα",
  "lesson3-v2":"ἠθέληκα",
  "lesson3-v3":"τέθῡκα",
  "lesson3-v4":"κέκλοφα",
  "lesson3-v5":"πεπαίδευκα",
  "lesson3-v7":"πεφύλαχα",
  "lesson4-v1":"πέπομφα",
  "lesson5-v1":"ἀκήκοα",
  "lesson5-v2":"βέβλαφα",
  "lesson5-v3":"κεκέλευκα",
  "lesson6-v1":"ἤλλαχα",
  "lesson6-v2":"δεδίωχα",
  "lesson6-v3":"ἔσχηκα",
  "lesson7-v1":"κεχάρηκα",
  "lesson8-v1":"εὕρηκα/ηὕρηκα",
  "lesson8-v2":"λέλοιπα",
  "lesson9-v1":"δεδούλευκα",
  "lesson10-v1":"εἴρηκα",
  "lesson10-v2":"πέπρᾱχα/πέπρᾱγα",
  "lesson10-v3":"πέφευγα",
  "lesson11-v1":"πέπεικα/πέποιθα",
  "lesson11-v2":"τέτροφα",
  "lesson12-v2":"λέλῡκα",
  "lesson13-v1":"βέβλεφα",
  "lesson14-v1":"πέπληγα",
  "lesson14-v2":"ἐνήνοχα",
  "lesson15-v1":"ἥρπακα",
  "lesson15-v2":"βέβληκα",
  "lesson15-v4":"δεδήλωκα",
  "lesson15-v5":"κεκόμικα",
  "lesson15-v6":"τετῑ́μηκα",
  "lesson15-v7":"πεφίληκα",
  "lesson15-v8":"ὠφέληκα",
  "lesson16-v1":"πεποίηκα",
  "lesson18-v1":"ἤγγελκα",
  "lesson18-v2":"ἠρώτηκα",
  "lesson18-v3":"πεπώληκα",
  "lesson19-v1":"εἴληφα",
  "lesson19-v2":"μεμένηκα",
  "lesson20-v1":"ἐζήτηκα",
  "lesson20-v2":"ἔρριφα",
};
const withoutFourth=["lesson3-v6","lesson6-v4","lesson12-v1","lesson15-v3"] as const;

describe("Groton verb principal-parts completeness through Lesson 20",()=>{
  it("audits exactly 45 distinct verb cards, with 41 fourth parts and only four source-supported omissions",()=>{
    expect(verbs).toHaveLength(45);
    expect(new Set(verbs.map(x=>x.id)).size).toBe(45);
    expect(Object.keys(fourth)).toHaveLength(41);
    expect(verbs.filter(x=>!x.fourth_principal_part).map(x=>x.id).sort()).toEqual([...withoutFourth].sort());
    expect(verbs.filter(x=>!x.third_principal_part).map(x=>x.id)).toEqual(["lesson12-v1"]);
  });

  it("preserves the exact first-to-fourth order, punctuation, source, lesson and stable card ID",()=>{
    const byId=new Map(verbs.map(x=>[x.id,x]));
    for (const [id,perfect] of Object.entries(fourth)) {
      const card=byId.get(id);
      expect(card,id).toBeDefined();
      expect(card?.fourth_principal_part,id).toBe(perfect);
    }
    for(const card of verbs) {
      const parts=card.greek.split(", ");
      expect(parts.length,card.id).toBe(card.id==="lesson12-v1" ? 2 : card.fourth_principal_part ? 4 : 3);
      expect(parts[0],card.id).toBeTruthy();
      expect(parts[1],card.id).toBeTruthy();
      if(card.third_principal_part) expect(parts[2],card.id).toBe(card.third_principal_part);
      if(card.fourth_principal_part) expect(parts[3],card.id).toBe(card.fourth_principal_part);
      expect(card.id).toMatch(new RegExp("^lesson"+card.lesson+"-v\\d+$"));
      expect(card.source_ref,card.id).toBeTruthy();
      expect(card.meaning,card.id).toBeTruthy();
    }
    for(const card of cards) expect(card.id).toMatch(new RegExp("^lesson"+card.lesson+"-v\\d+$"));
  });

  it("preserves alternative principal parts, not one alternative at the expense of the other",()=>{
    const byId=new Map(verbs.map(x=>[x.id,x]));
    expect(byId.get("lesson6-v3")?.greek).toContain("ἕξω/σχήσω");
    expect(byId.get("lesson8-v1")?.third_principal_part).toBe("εὗρον/ηὗρον");
    expect(byId.get("lesson8-v1")?.fourth_principal_part).toBe("εὕρηκα/ηὕρηκα");
    expect(byId.get("lesson10-v1")?.third_principal_part).toBe("εἶπον/ἔλεξα");
    expect(byId.get("lesson10-v2")?.fourth_principal_part).toBe("πέπρᾱχα/πέπρᾱγα");
    expect(byId.get("lesson11-v1")?.fourth_principal_part).toBe("πέπεικα/πέποιθα");
    expect(byId.get("lesson14-v2")?.third_principal_part).toBe("ἤνεγκον/ἤνεγκα");
    expect(byId.get("lesson7-v1")?.third_principal_part).toBe("ἐχαίρησα");
    for(const id of ["lesson18-v1","lesson18-v2","lesson18-v3"])
      expect(byId.get(id)?.third_principal_part,id).toBeTruthy();
  });

  it("has exact matching audio headword labels for every verb, including all taught parts",()=>{
    for(const card of verbs){
      const audio=resolveBuiltinGreekAsset(card.id);
      expect(audio,card.id).not.toBeNull();
      expect(audio?.label,card.id).toBe(card.greek);
      expect(audio?.canonicalIpa,card.id).toBeTruthy();
      expect(audio?.ttsText,card.id).toBeTruthy();
    }
  });

  it("exposes third and fourth principal parts to both the early and later lesson study loaders",()=>{
    const early=fs.readFileSync("src/data/builtin-decks.ts","utf8");
    const later=fs.readFileSync("src/data/greek-lessons-9-10.ts","utf8");
    for(const file of [early,later]) {
      expect(file).toContain("thirdPrincipalPart: card.third_principal_part");
      expect(file).toContain("fourthPrincipalPart: card.fourth_principal_part");
    }
  });
});
