import { describe, expect, it } from "vitest";
import { CARDS } from "../data/cards";
import type { Card, EarnRate } from "../types/card";
import {
  COMPARISON_ROWS,
  computeRowWinners,
  getCategoryCell,
  getEffectiveCategoryValue,
} from "./cardComparison";
import { getMatchNote, withCurrentOffer, withFirstYearMatch } from "./welcomeOffer";

const quicksilver = CARDS.find((card) => card.id === "capital-one-quicksilver-we") as Card;

const winners = (cards: Card[], label: string): string[] => {
  const index = COMPARISON_ROWS.findIndex((row) => row.label === label);
  return [...(computeRowWinners(cards)[index] ?? [])];
};

describe("withFirstYearMatch", () => {
  it("doubles every Quicksilver rate and states that there is no limit", () => {
    const matched = withFirstYearMatch(quicksilver);
    expect(getEffectiveCategoryValue(matched, "groceries")).toBe(6);
    expect(getEffectiveCategoryValue(matched, "usd-spend")).toBe(2);
    expect(getCategoryCell(matched, "gas")).toMatchObject({
      primary: "6%",
      matchNote: "First-year match, no limit",
    });
  });

  it("never applies twice or changes the original", () => {
    const matched = withFirstYearMatch(quicksilver);
    expect(withFirstYearMatch(matched)).toBe(matched);
    expect(getEffectiveCategoryValue(quicksilver, "groceries")).toBe(3);
    expect(getMatchNote(quicksilver)).toBeUndefined();
  });

  it("leaves cards without a match, or whose offer ended, alone", () => {
    for (const card of CARDS.filter((item) => !item.welcomeOffer?.firstYearMatch)) {
      expect(withFirstYearMatch(card)).toBe(card);
    }
    const ended = withCurrentOffer(
      { ...quicksilver, welcomeOffer: { headline: "Match", firstYearMatch: { multiplier: 2 }, expires: "2026-01-01" } },
      "2026-01-02",
    );
    expect(withFirstYearMatch(ended)).toBe(ended);
  });

  it("scales post-cap and brand rates and shows a limit on the match", () => {
    const rate = { ...(quicksilver.earnRates[0] as EarnRate), rateAfterCap: 0.5 };
    const matched = withFirstYearMatch({
      ...quicksilver,
      earnRates: [rate],
      specificBrands: [rate],
      welcomeOffer: { headline: "Match", firstYearMatch: { multiplier: 2, maxBonus: 1500 } },
    });
    expect(matched.earnRates[0]?.rateAfterCap).toBe(1);
    expect(matched.specificBrands?.[0]?.rateMultiplier).toBe(6);
    expect(getMatchNote(matched)).toBe("First-year match, up to $1,500 extra");
  });

  it("re-ranks rows: gas goes to Quicksilver outright", () => {
    expect(winners(CARDS.map(withFirstYearMatch), "Gas")).toEqual([quicksilver.id]);
  });
});
