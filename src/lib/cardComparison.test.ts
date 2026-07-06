import { describe, expect, it } from "vitest";
import { CARDS } from "../data/cards";
import type { Card } from "../types/card";
import {
  type ComparisonCell,
  COMPARISON_ROWS,
  computeRowWinners,
  computeRowWorst,
} from "./cardComparison";

const cardById = (id: string): Card => {
  const card = CARDS.find((item) => item.id === id);
  if (!card) {
    throw new Error(`Unknown card id in test: ${id}`);
  }
  return card;
};

const rowIndex = (label: string): number => {
  const index = COMPARISON_ROWS.findIndex((row) => row.label === label);
  if (index < 0) {
    throw new Error(`Unknown comparison row in test: ${label}`);
  }
  return index;
};

const cellFor = (label: string, id: string): ComparisonCell => {
  const row = COMPARISON_ROWS[rowIndex(label)];
  if (!row) {
    throw new Error(`Missing comparison row: ${label}`);
  }
  return row.value(cardById(id));
};

const extremeAt = (sets: Set<string>[], label: string): Set<string> => {
  const set = sets[rowIndex(label)];
  if (!set) {
    throw new Error(`Missing extreme set for row: ${label}`);
  }
  return set;
};

const winnersFor = (label: string, cards: Card[] = CARDS): Set<string> =>
  extremeAt(computeRowWinners(cards), label);

const worstFor = (label: string, cards: Card[] = CARDS): Set<string> =>
  extremeAt(computeRowWorst(cards), label);

describe("computeRowWinners / computeRowWorst", () => {
  it("returns one set per comparison row (parallel-array invariant)", () => {
    expect(computeRowWinners(CARDS)).toHaveLength(COMPARISON_ROWS.length);
    expect(computeRowWorst(CARDS)).toHaveLength(COMPARISON_ROWS.length);
  });

  it("treats a lower fee as the winner (lowerIsBetter), not the highest", () => {
    // Classic sign-flip guard.
    expect(winnersFor("Annual fee").has("rogers-world-elite")).toBe(true); // $0
    expect(winnersFor("Annual fee").has("triangle-mastercard")).toBe(true); // $0
    expect(winnersFor("Annual fee").has("amex-platinum-ca")).toBe(false); // $799
    expect(worstFor("Annual fee").has("amex-platinum-ca")).toBe(true); // $799 is worst
  });

  it("lets tied cards share the highlight", () => {
    // Three cards have a $0 annual fee.
    expect(winnersFor("Annual fee").size).toBeGreaterThanOrEqual(3);
  });

  it("does not rank descriptive rows (no numericValue → no highlight)", () => {
    expect(winnersFor("Network").size).toBe(0);
    expect(winnersFor("Reward currency").size).toBe(0);
    expect(winnersFor("Brand / partner perks").size).toBe(0);
  });

  it("ranks the no-FX-fee cards as the FX winners", () => {
    expect(winnersFor("FX fee").has("scotia-gold-amex")).toBe(true);
    expect(winnersFor("FX fee").has("scotia-passport-vi")).toBe(true);
    expect(winnersFor("FX fee").has("amex-platinum-ca")).toBe(false);
  });

  it("ranks Redemption by flexibility (cashable Costco best, store-locked CT Money worst)", () => {
    expect(winnersFor("Redemption").has("cibc-costco-mastercard")).toBe(true);
    expect(worstFor("Redemption").has("triangle-mastercard")).toBe(true);
  });

  it("recomputes best/worst over the given subset only", () => {
    const subset = [cardById("amex-platinum-ca"), cardById("td-aeroplan-vi")];
    // Within {Amex $799, TD $139}, TD is the cheaper → sole winner.
    expect(winnersFor("Annual fee", subset).has("td-aeroplan-vi")).toBe(true);
    expect(winnersFor("Annual fee", subset).has("amex-platinum-ca")).toBe(false);
  });
});

describe("category cells", () => {
  it("shows CT Money groceries at its real 1.5% (not devalued)", () => {
    expect(cellFor("Groceries", "triangle-mastercard").primary).toBe("1.5%");
  });

  it("shows Rogers USD at the boosted 4.5% value", () => {
    expect(cellFor("USD spend", "rogers-world-elite").primary).toMatch(/^4\.5%/);
  });

  it("picks the best rate within a category (Costco gas 3%, not 2%)", () => {
    expect(cellFor("Gas", "cibc-costco-mastercard").primary).toMatch(/^3%/);
  });

  it("does not claim a general-travel bonus for TD (Air Canada is airline-specific)", () => {
    // Regression guard for the TD overclaim fix.
    expect(cellFor("Travel", "td-aeroplan-vi").primary).toBe("1x");
  });

  it("surfaces Air Canada as a brand/partner perk instead", () => {
    const label = cellFor("Brand / partner perks", "td-aeroplan-vi").primary;
    expect(label).toContain("Air Canada");
    expect(label).toContain("1.5x");
  });

  it("marks capped accelerators and leaves uncapped ones unmarked", () => {
    expect(cellFor("Groceries", "scotia-gold-amex").capped).toBe(true); // $50k cap
    expect(cellFor("Dining", "amex-platinum-ca").capped).toBeFalsy(); // uncapped 2x
    expect(cellFor("Dining", "cibc-costco-mastercard").capped).toBeFalsy(); // restaurant uncapped
  });

  it("gives the Scene+ cards an Entertainment bonus and others the base rate", () => {
    expect(winnersFor("Entertainment").has("scotia-gold-amex")).toBe(true);
    // A card with no entertainment earn falls back to its base rate.
    expect(cellFor("Entertainment", "cibc-costco-mastercard").primary).toBe("1%");
  });
});
