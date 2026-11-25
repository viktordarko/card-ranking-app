import { describe, expect, it } from "vitest";
import { CARDS } from "../data/cards";
import { SPENDING_CATEGORIES } from "../data/categories";
import type { Card } from "../types/card";
import {
  type ComparisonCell,
  COMPARISON_ROWS,
  computeRowWinners,
  computeRowWorst,
  getEffectiveCategoryValue,
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

describe("Costco row", () => {
  it("shows the warehouse rate, with Costco.ca beside it", () => {
    expect(cellFor("Costco", "cibc-costco-mastercard")).toMatchObject({
      primary: "1%",
      detail: "2% on Costco.ca, up to a cap",
      emphasizePrimary: false,
    });
    expect(cellFor("Costco", "rogers-world-elite").primary).toBe("2%");
  });

  it("never ranks a card whose network isn't accepted", () => {
    for (const id of ["amex-platinum-ca", "scotia-gold-amex", "td-aeroplan-vi"]) {
      expect(cellFor("Costco", id).primary).toBe("Not accepted");
      expect(getEffectiveCategoryValue(cardById(id), "costco")).toBe(0);
    }
    expect([...winnersFor("Costco")]).toEqual(["rogers-world-elite"]);
    expect(worstFor("Costco").size).toBe(3);
  });
});

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
    expect(winnersFor("FX fee").has("capital-one-quicksilver-we")).toBe(true);
    expect(winnersFor("FX fee").has("amex-platinum-ca")).toBe(false);
  });

  it("ranks Redemption by flexibility (cashable Costco best, store-locked CT Money worst)", () => {
    expect(winnersFor("Redemption").has("cibc-costco-mastercard")).toBe(true);
    expect(worstFor("Redemption").has("triangle-mastercard")).toBe(true);
  });

  it("marks nothing when every card ties (a highlight must single something out)", () => {
    const subset = [cardById("amex-platinum-ca"), cardById("td-aeroplan-vi")];
    expect(winnersFor("FX fee", subset).size).toBe(0); // both 2.5%
    expect(worstFor("FX fee", subset).size).toBe(0);
  });

  it("names a best on a pure tiebreak, but no weakest", () => {
    // Both return 3% on gas; Quicksilver's is easier to redeem, Scotia's isn't bad.
    const subset = [cardById("scotia-gold-amex"), cardById("capital-one-quicksilver-we")];
    expect(winnersFor("Gas", subset)).toEqual(new Set(["capital-one-quicksilver-we"]));
    expect(worstFor("Gas", subset).size).toBe(0);
  });

  it("doesn't call most of a row the weakest", () => {
    // Five of the seven cards charge 2.5%: worth no red at all.
    expect(worstFor("FX fee").size).toBe(0);
  });

  it("never marks an unpriced welcome offer as the weakest", () => {
    // Quicksilver's first-year match has no fixed value, so $0 isn't its rank.
    expect(worstFor("Welcome offer").size).toBe(0);
    expect(winnersFor("Welcome offer")).toEqual(new Set(["amex-platinum-ca"]));
  });

  it("keeps each group's rows together, so every group gets one heading", () => {
    const groups = COMPARISON_ROWS.map((row) => row.group);
    const headings = groups.filter((group, index) => group !== groups[index - 1]);
    expect(new Set(headings).size).toBe(headings.length);
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

describe("category winners and the tiebreak", () => {
  it("makes Groceries a no-brainer: Scotia Gold alone (6x partners, 5x elsewhere)", () => {
    expect(winnersFor("Groceries")).toEqual(new Set(["scotia-gold-amex"]));
  });

  it("gives Gas to the 3% that works everywhere and redeems most freely", () => {
    // Four cards return 3% on gas. Costco's needs a Costco pump, so its cash-like
    // redemption (5) doesn't count; Quicksilver (4) beats Scene+ and Aeroplan (3).
    expect(winnersFor("Gas")).toEqual(new Set(["capital-one-quicksilver-we"]));
  });

  it("ranks USD spend net of the FX fee, not on the headline rate", () => {
    // Rogers' 3% behind a 2.5% fee loses to a plain 1% without one.
    expect(getEffectiveCategoryValue(cardById("rogers-world-elite"), "usd-spend")).toBe(0.5);
    expect(getEffectiveCategoryValue(cardById("scotia-gold-amex"), "usd-spend")).toBe(1);
    expect(winnersFor("USD spend")).toEqual(new Set(["capital-one-quicksilver-we"]));
  });

  it("does not let a base rate share Transit gold with a true accelerator", () => {
    expect(winnersFor("Transit")).toEqual(new Set(["scotia-gold-amex"]));
  });

  it("prefers a base rate open to everyone over one for certain customers", () => {
    // Amex, TD, and Rogers all return 2%, but Rogers' is for its own customers.
    const subset = [
      cardById("rogers-world-elite"),
      cardById("td-aeroplan-vi"),
      cardById("triangle-mastercard"),
    ];
    expect(winnersFor("Base earn", subset)).toEqual(new Set(["td-aeroplan-vi"]));
  });

  it("still shares the highlight when the tiebreaker also ties", () => {
    // TD and Scotia both return 3% on any gas station, both flexibility 3.
    const subset = [
      cardById("scotia-gold-amex"),
      cardById("td-aeroplan-vi"),
      cardById("triangle-mastercard"),
    ];
    expect(winnersFor("Gas", subset)).toEqual(new Set(["scotia-gold-amex", "td-aeroplan-vi"]));
  });

  it("applies the tiebreak to 'worst' too (lowest flexibility is the clearest loser)", () => {
    // TD and Rogers both return 2% on dining (their base rate), but Rogers' is
    // limited to its own customers.
    const subset = [
      cardById("scotia-gold-amex"),
      cardById("td-aeroplan-vi"),
      cardById("rogers-world-elite"),
    ];
    expect(worstFor("Dining", subset)).toEqual(new Set(["rogers-world-elite"]));
  });
});

describe("category cells", () => {
  it("shows CT Money groceries at its real 1.5% (not devalued)", () => {
    expect(cellFor("Groceries", "triangle-mastercard").primary).toBe("1.5%");
  });

  it("shows Rogers USD at 3%, with what is left after the FX fee", () => {
    const cell = cellFor("USD spend", "rogers-world-elite");
    expect(cell.primary).toBe("3%");
    expect(cell.estimate).toContain("0.5% after FX fee");
  });

  it("says what a capped rate drops to, even when that isn't the base rate", () => {
    // Past the cap Rogers pays everyone 1.5%, not its customers' 2% base.
    expect(cellFor("USD spend", "rogers-world-elite").detail).toBe("1.5% past the cap");
    expect(cellFor("Groceries", "triangle-mastercard").detail).toBe("1% past the cap");
    expect(cellFor("Groceries", "td-aeroplan-vi").detail).toBe("1x past the cap");
  });

  it("says where a restricted rate stops, when nothing else covers the category", () => {
    expect(cellFor("Travel", "scotia-gold-amex").detail).toBe("1x elsewhere");
  });

  it("labels the US-dollar estimate by whether the card charges an FX fee", () => {
    expect(cellFor("USD spend", "scotia-gold-amex").estimate).toBe("≈ 1%, no FX fee");
    expect(cellFor("USD spend", "amex-platinum-ca").estimate).toBe("≈ -0.5% after FX fee");
  });

  it("leaves out the estimate for cash back, where the rate already is one", () => {
    expect(cellFor("Groceries", "capital-one-quicksilver-we").estimate).toBeUndefined();
  });

  it("keeps a base rate's cap and lower tier where it stands in for a bonus", () => {
    const cell = cellFor("Dining", "rogers-world-elite");
    expect(cell.capped).toBe(true);
    expect(cell.detail).toBe("Base rate; 1.5% for everyone else");
  });

  it("prices and dates the welcome offer, and says when there is none", () => {
    const offer = cellFor("Welcome offer", "scotia-gold-amex");
    expect(offer.estimate).toBe("≈ $650");
    expect(offer.detail).toBe("Ends Jan 3, 2027");
    expect(cellFor("Welcome offer", "rogers-world-elite").primary).toBe("No public offer");
  });

  it("shows insurance limits, and plainly when a card has no cover", () => {
    expect(cellFor("Mobile device", "cibc-costco-mastercard").primary).toContain("$1,000");
    expect(cellFor("Mobile device", "rogers-world-elite").primary).toBe("Not covered");
  });

  it("ranks lounge access", () => {
    expect(winnersFor("Lounge")).toEqual(new Set(["amex-platinum-ca"]));
  });

  it("states who a rate is for, and what everyone else gets", () => {
    const base = cellFor("Base earn", "rogers-world-elite");
    expect(base.primary).toBe("2%");
    expect(base.condition).toContain("customers");
    expect(base.detail).toBe("1.5% for everyone else");
  });

  it("puts the rate alone in the headline, with its condition beside it", () => {
    const cell = cellFor("Groceries", "scotia-gold-amex");
    expect(cell.primary).toBe("6x");
    expect(cell.condition).toBe("at Scene+ partner grocers");
    expect(cell.detail).toBe("5x elsewhere");
    expect(cell.estimate).toBe("≈ 6%");
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

  it("gives Scotia Gold an Entertainment bonus and others the base rate", () => {
    expect(winnersFor("Entertainment").has("scotia-gold-amex")).toBe(true);
    // A card with no entertainment earn falls back to its base rate.
    expect(cellFor("Entertainment", "cibc-costco-mastercard").primary).toBe("1%");
  });
});
