import { readFileSync } from "node:fs";
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
