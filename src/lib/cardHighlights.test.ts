import { describe, expect, it } from "vitest";
import { CARDS } from "../data/cards";
import type { Card } from "../types/card";
import { getBestForCategories, getEarnHighlights } from "./cardHighlights";

const cardById = (id: string): Card => {
  const card = CARDS.find((item) => item.id === id);
  if (!card) {
    throw new Error(`Unknown card id in test: ${id}`);
  }
  return card;
};

const labelsOf = (id: string): string[] =>
  getEarnHighlights(cardById(id), 3).map((earn) => earn.label);

const cappedLabelsOf = (id: string): string[] =>
  getEarnHighlights(cardById(id), 3)
    .filter((row) => row.capped)
    .map((row) => row.label);

describe("getBestForCategories", () => {
  const bestFor = getBestForCategories(CARDS);

  it("lists a card's leads strongest first, in running-text case", () => {
    expect(bestFor.get("scotia-gold-amex")?.[0]).toBe("groceries");
    expect(bestFor.get("capital-one-quicksilver-we")).toContain("USD spend");
  });

  it("never badges base earn, where a tie would crown a $799 card", () => {
    for (const labels of bestFor.values()) {
      expect(labels).not.toContain("base earn");
    }
  });

  it("requires a bonus in the category, not just a high base rate", () => {
    const subset = [cardById("td-aeroplan-vi"), cardById("triangle-mastercard")];
    // TD tops Dining here on its 1x base alone.
    expect(getBestForCategories(subset).get("td-aeroplan-vi")).not.toContain("dining");
  });
});

describe("getEarnHighlights", () => {
  it("ends on the base rate and never repeats a row id", () => {
    for (const card of CARDS) {
      const rows = getEarnHighlights(card, 3);
      expect(rows.at(-1)?.categoryId, card.id).toBe("general");
      expect(new Set(rows.map((row) => row.id)).size, card.id).toBe(rows.length);
    }
  });

  it("keeps the strongest categories when there are too many", () => {
    const rows = getEarnHighlights(cardById("scotia-gold-amex"), 2);
    expect(rows.map((row) => row.label)).toEqual(["Groceries", "Dining", "Everything else"]);
  });

  it("marks capped rates, brand rates included", () => {
    expect(cappedLabelsOf("rogers-world-elite")).toContain("Rogers, Fido, Shaw");
    expect(cappedLabelsOf("capital-one-quicksilver-we")).toEqual([]);
  });

  it("surfaces the brand rate a card is really about", () => {
    expect(labelsOf("rogers-world-elite")).toContain("Rogers, Fido, Shaw");
    expect(labelsOf("triangle-mastercard")).toContain("Canadian Tire stores");
    expect(labelsOf("td-aeroplan-vi")).toContain("Air Canada");
  });

  it("skips a brand rate its category row already states", () => {
    expect(labelsOf("cibc-costco-mastercard")).not.toContain("Costco gas");
    expect(labelsOf("scotia-gold-amex")).not.toContain("Sobeys, IGA, Safeway, FreshCo");
  });
});
