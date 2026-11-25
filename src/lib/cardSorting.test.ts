import { describe, expect, it } from "vitest";
import { CARDS } from "../data/cards";
import { isSortKey, type SortKey, sortCards } from "./cardSorting";
import { getWelcomeOfferValue, withCurrentOffer } from "./welcomeOffer";

const valueOf = (id: string): number | undefined => {
  const card = CARDS.find((item) => item.id === id);
  return card && getWelcomeOfferValue(card);
};

const idsBy = (key: SortKey): string[] => sortCards(CARDS, key).map((card) => card.id);

describe("sortCards", () => {
  it("leaves the portfolio order alone by default, without mutating the input", () => {
    const before = CARDS.map((card) => card.id);
    expect(idsBy("featured")).toEqual(before);
    idsBy("fee");
    expect(CARDS.map((card) => card.id)).toEqual(before);
  });

  it("sorts by annual fee, cheapest first", () => {
    const fees = sortCards(CARDS, "fee").map((card) => card.annualFee);
    expect(fees).toEqual(fees.toSorted((a, b) => a - b));
  });

  it("sorts by welcome offer: priced, then unpriced, then none", () => {
    const ids = idsBy("welcome");
    expect(ids[0]).toBe("amex-platinum-ca");
    expect(ids.at(-2)).toBe("capital-one-quicksilver-we"); // a match has no fixed value
    expect(ids.at(-1)).toBe("rogers-world-elite"); // no public offer
  });

  it("sorts by return on a category, breaking ties like the matrix does", () => {
    expect(idsBy("earn:groceries")[0]).toBe("scotia-gold-amex");
    expect(idsBy("earn:gas")[0]).toBe("capital-one-quicksilver-we");
    expect(idsBy("earn:usd-spend")[0]).toBe("capital-one-quicksilver-we");
  });

  it("recognises only real sort keys (they arrive from the URL)", () => {
    expect(isSortKey("earn:dining")).toBe(false);
    expect(isSortKey("earn:restaurant")).toBe(true);
    expect(isSortKey("fee")).toBe(true);
  });
});

describe("getWelcomeOfferValue", () => {
  it("prices points through the card's reward profile and adds cash at face value", () => {
    expect(valueOf("amex-platinum-ca")).toBe(2000); // 100,000 × 2¢
    expect(valueOf("scotia-gold-amex")).toBe(650); // 65,000 × 1¢
    expect(valueOf("td-aeroplan-vi")).toBe(1139); // 50,000 × 2¢ + $139 fee rebate
  });

  it("stays undefined rather than $0 when there is nothing to price", () => {
    expect(valueOf("capital-one-quicksilver-we")).toBeUndefined();
    expect(valueOf("rogers-world-elite")).toBeUndefined();
  });
});

describe("withCurrentOffer", () => {
  const costco = CARDS.find((card) => card.id === "cibc-costco-mastercard");

  it("keeps an offer through its last day and drops it the day after", () => {
    expect(costco && withCurrentOffer(costco, "2026-12-20").welcomeOffer).toBeDefined();
    expect(costco && withCurrentOffer(costco, "2026-12-21").welcomeOffer).toBeUndefined();
  });

  it("keeps an offer with no published end date", () => {
    const amex = CARDS.find((card) => card.id === "amex-platinum-ca");
    expect(amex && withCurrentOffer(amex, "2030-01-01").welcomeOffer).toBeDefined();
  });
});
