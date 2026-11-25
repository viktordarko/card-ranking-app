import { describe, expect, it } from "vitest";
import { CARDS } from "../data/cards";
import type { Card } from "../types/card";
import {
  COMPARISON_ROWS,
  computeRowWinners,
  getCategoryCell,
  getEffectiveCategoryValue,
} from "./cardComparison";
import { withRogersCustomer } from "./rogersCustomer";
import { withFirstYearMatch } from "./welcomeOffer";

const rogers = CARDS.find((card) => card.id === "rogers-world-elite") as Card;

const costcoWinners = (isCustomer: boolean, match: boolean): string[] => {
  const cards = CARDS.map((card) => withRogersCustomer(card, isCustomer)).map((card) =>
    match ? withFirstYearMatch(card) : card,
  );
  const index = COMPARISON_ROWS.findIndex((row) => row.label === "Costco");
  return [...(computeRowWinners(cards)[index] ?? [])];
};

describe("withRogersCustomer", () => {
  it("gives customers 2% without a condition, then 1.5% past the cap", () => {
    const card = withRogersCustomer(rogers, true);
    for (const tag of ["costco", "general"] as const) {
      const cell = getCategoryCell(card, tag);
      expect(cell).toMatchObject({
        primary: "2%",
        detail: "Customer rate; 1.5% past the cap",
        capped: true,
      });
      expect(cell.condition).toBeUndefined();
    }
  });

  it("gives everyone else an uncapped 1.5%", () => {
    const cell = getCategoryCell(withRogersCustomer(rogers, false), "costco");
    expect(cell).toMatchObject({ primary: "1.5%", detail: "Base rate" });
    expect(cell.capped).toBeFalsy();
  });

  it("leaves USD spend and every other card alone", () => {
    expect(getEffectiveCategoryValue(withRogersCustomer(rogers, false), "usd-spend")).toBe(0.5);
    for (const card of CARDS.filter((item) => item.id !== rogers.id)) {
      expect(withRogersCustomer(card, false)).toBe(card);
    }
  });

  it("decides the Costco row together with the first-year match", () => {
    expect(costcoWinners(true, false)).toEqual([rogers.id]);
    expect(costcoWinners(false, false)).toEqual([rogers.id]);
    expect(costcoWinners(false, true)).toEqual(["capital-one-quicksilver-we"]);
    expect(costcoWinners(true, true)).toEqual([rogers.id, "capital-one-quicksilver-we"]);
  });
});
