import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { BUILTIN_STUDY_DECKS } from "../src/features/study/builtin-study-catalog";

type ParticipleCard = {
  id: string;
  front: string;
  formation: string;
  declension: string;
  example: string;
};

const cards = JSON.parse(fs.readFileSync("public/data/latin-participles.json", "utf8")) as ParticipleCard[];

describe("Henle Participles", () => {
  it("defines exactly four stable formation cards in the requested order", () => {
    expect(cards.map(({ id, front }) => ({ id, front }))).toEqual([
      { id: "latin-participle-present-active", front: "Present Active Participle" },
      { id: "latin-participle-perfect-passive", front: "Perfect Passive Participle" },
      { id: "latin-participle-future-active", front: "Future Active Participle" },
      { id: "latin-participle-future-passive", front: "Future Passive Participle" },
    ]);
  });

  it("uses the second principal part for the present participle and declines it in the third declension", () => {
    expect(cards[0].formation).toContain("second principal part");
    expect(cards[0].formation).toContain("-ns");
    expect(cards[0].declension).toContain("third-declension adjective");
    expect(cards[0].example).toBe("amāre → amāns, amantis");
  });

  it("uses the fourth principal part for perfect passive and future active", () => {
    expect(cards[1].formation).toContain("fourth principal part");
    expect(cards[1].declension).toContain("first- and second-declension adjective");
    expect(cards[1].example).toBe("amātus, amāta, amātum");
    expect(cards[2].formation).toContain("fourth principal part");
    expect(cards[2].formation).toContain("-ūrus, -ūra, -ūrum");
    expect(cards[2].declension).toContain("first- and second-declension adjective");
    expect(cards[2].example).toBe("amātus → amātūrus, amātūra, amātūrum");
  });

  it("correctly forms the gerundive from the present stem, not the fourth principal part", () => {
    expect(cards[3].formation).toContain("present stem from the second principal part");
    expect(cards[3].formation).toContain("-ndus, -nda, -ndum");
    expect(cards[3].formation).not.toContain("fourth principal part");
    expect(cards[3].declension).toContain("first- and second-declension adjective");
    expect(cards[3].example).toBe("amāre → amandus, amanda, amandum");
  });

  it("registers Participles for Stats and uses the shared exact-card and Deselect hierarchy", () => {
    const registration = BUILTIN_STUDY_DECKS.find((deck) => deck.id === "latin-participles");
    expect(registration?.language).toBe("Latin");
    expect(registration?.source).toBe("Participles");
    expect(registration?.modes).toEqual([{ mode: "Forward", direction: "forward", studyKey: "forward" }]);

    const page = fs.readFileSync("src/pages/latin-page.tsx", "utf8");
    expect(page).toContain('title="Participles"');
    expect(page).toContain('materials.has("participles")');
    expect(page).toContain('onExclude={excludedCards.exclude}');
    expect(page).toContain('onDeckChange={changeParadigmDeck}');
    expect(page).toContain('next.add("participles")');
    expect(page).toContain('source.deck.id === participlesDeck?.id');
    expect(page).toContain('saved-participles');

    const filter = fs.readFileSync("src/features/study/filter-preferences.ts", "utf8");
    expect(filter).toContain('"participles"');
    const prewarm = fs.readFileSync(".github/workflows/prewarm-greek-audio.yml", "utf8");
    expect(prewarm).not.toContain("latin-participle");
  });
});
