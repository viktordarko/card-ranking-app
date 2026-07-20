import { describe, expect, it } from "vitest";
import { CARDS } from "../data/cards";
import { SPENDING_CATEGORIES } from "../data/categories";
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

describe("category rows derive from the registry", () => {
  const bonusCategories = SPENDING_CATEGORIES.filter(
    (category) => category.kind === "bonus",
  );

  it("renders one row per bonus category, as a contiguous block in registry order", () => {
    const bonusLabels = bonusCategories.map((category) => category.label);
    const rowLabels = COMPARISON_ROWS.map((row) => row.label);
    const start = rowLabels.indexOf(bonusLabels[0] ?? "");
    expect(start).toBeGreaterThanOrEqual(0);
    expect(rowLabels.slice(start, start + bonusLabels.length)).toEqual(bonusLabels);
  });

  it("gives every category row (and Base earn) a tooltip and a legend link target", () => {
    for (const category of bonusCategories) {
      const row = COMPARISON_ROWS.find((item) => item.label === category.label);
      expect(row?.tooltip, category.id).toContain(category.description);
      expect(row?.categoryId, category.id).toBe(category.id);
    }
    const baseRow = COMPARISON_ROWS.find((row) => row.label === "Base earn");
    expect(baseRow?.tooltip).toBeTruthy();
    expect(baseRow?.categoryId).toBe("general");
  });
});

describe("category winners and the redemption tiebreak", () => {
  it("makes Groceries a no-brainer: Scotia Gold alone (6x partners, 5x fallback)", () => {
    expect(winnersFor("Groceries")).toEqual(new Set(["scotia-gold-amex"]));
  });

  it("makes Gas unambiguous: CIBC Dividend alone at 4%", () => {
    expect(winnersFor("Gas")).toEqual(new Set(["cibc-dividend-vi"]));
  });

  it("breaks the Travel value tie by redemption flexibility (Amex 4 beats Passport 3)", () => {
    // Both return an estimated 4% on travel; transferable MR is easier to use
    // than Scene+, so Amex Platinum alone should read as the winner.
    expect(winnersFor("Travel")).toEqual(new Set(["amex-platinum-ca"]));
  });

  it("does not let a base rate share Transit gold with a true accelerator", () => {
    // Rogers' boosted base rate ties Scotia Gold's 3x transit at 3% estimated
    // value, but bill-locked Rogers redemption (2) loses to Scene+ (3).
    expect(winnersFor("Transit")).toEqual(new Set(["scotia-gold-amex"]));
  });

  it("still shares the highlight when the tiebreaker also ties", () => {
    // Dining within {Passport, TD}: both 2% estimated value, both flexibility 3.
    const subset = [cardById("scotia-passport-vi"), cardById("td-aeroplan-vi")];
    expect(winnersFor("Dining", subset)).toEqual(
      new Set(["scotia-passport-vi", "td-aeroplan-vi"]),
    );
  });

  it("applies the tiebreak to 'worst' too (lowest flexibility is the clearest loser)", () => {
    // Dining within {Scotia Gold 5%, TD 2% f3, Dividend 2% f4}: the tied-worst
    // pair resolves to TD, whose rewards are the harder of the two to use.
    const subset = [
      cardById("scotia-gold-amex"),
      cardById("td-aeroplan-vi"),
      cardById("cibc-dividend-vi"),
    ];
    expect(worstFor("Dining", subset)).toEqual(new Set(["td-aeroplan-vi"]));
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
    expect(cellFor("Travel", "td-aeroplan-vi").primary).toBe("1x");
  });

  it("surfaces Air Canada as a brand/partner perk instead", () => {
    const label = cellFor("Brand / partner perks", "td-aeroplan-vi").primary;
    expect(label).toContain("Air Canada");
    expect(label).toContain("1.5x");
  });

  it("surfaces Triangle's 4% at Canadian Tire as a brand perk, not a category rate", () => {
    // CT stores are a retailer family, not a merchant category — the 4% belongs
    // in Brand / partner perks, where the matrix can actually show it.
    const label = cellFor("Brand / partner perks", "triangle-mastercard").primary;
    expect(label).toContain("Canadian Tire stores 4%");
    expect(label).toContain("Petro-Canada");
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
