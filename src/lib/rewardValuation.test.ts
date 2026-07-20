import { describe, expect, it } from "vitest";
import { CARDS } from "../data/cards";
import type { Card, EarnRate } from "../types/card";
import {
  getCardValueUnit,
  toEstimatedBaseValuePercent,
  toEstimatedValuePercent,
} from "./rewardValuation";

const cardById = (id: string): Card => {
  const card = CARDS.find((item) => item.id === id);
  if (!card) {
    throw new Error(`Unknown card id in test: ${id}`);
  }
  return card;
};

const rateById = (card: Card, rateId: string): EarnRate => {
  const rate = card.earnRates.find((item) => item.id === rateId);
  if (!rate) {
    throw new Error(`Unknown rate id in test: ${rateId}`);
  }
  return rate;
};

describe("getCardValueUnit", () => {
  it("resolves each card's reward-value profile", () => {
    expect(getCardValueUnit(cardById("amex-platinum-ca"))).toBe(2); // MR
    expect(getCardValueUnit(cardById("td-aeroplan-vi"))).toBe(2); // Aeroplan
    expect(getCardValueUnit(cardById("scotia-gold-amex"))).toBe(1); // Scene+
    expect(getCardValueUnit(cardById("cibc-dividend-vi"))).toBe(1); // cash back
  });

  it("values flexible points above plain cash back (core design principle)", () => {
    expect(getCardValueUnit(cardById("amex-platinum-ca"))).toBeGreaterThan(
      getCardValueUnit(cardById("cibc-dividend-vi")),
    );
    expect(getCardValueUnit(cardById("td-aeroplan-vi"))).toBeGreaterThan(
      getCardValueUnit(cardById("cibc-costco-mastercard")),
    );
  });

  it("keeps store-locked CT Money at full 1:1 value (its downside is redemption, not value)", () => {
    expect(getCardValueUnit(cardById("triangle-mastercard"))).toBe(
      getCardValueUnit(cardById("cibc-dividend-vi")),
    );
  });

  it("gives Rogers cash back its conditional redemption boost", () => {
    expect(getCardValueUnit(cardById("rogers-world-elite"))).toBeGreaterThan(
      getCardValueUnit(cardById("cibc-dividend-vi")),
    );
  });
});

describe("toEstimatedValuePercent", () => {
  it("multiplies the earn rate by the card's point value", () => {
    const amex = cardById("amex-platinum-ca");
    expect(toEstimatedValuePercent(amex, rateById(amex, "amex-plat-dining"))).toBe(4); // 2x × 2¢

    const rogers = cardById("rogers-world-elite");
    expect(toEstimatedValuePercent(rogers, rateById(rogers, "rogers-usd"))).toBe(4.5); // 3% × 1.5
  });

  it("ranks a 2x MR earn above a 2% cash-back earn", () => {
    const amex = cardById("amex-platinum-ca");
    const dividend = cardById("cibc-dividend-vi");
    expect(toEstimatedValuePercent(amex, rateById(amex, "amex-plat-dining"))).toBeGreaterThan(
      toEstimatedValuePercent(dividend, rateById(dividend, "dividend-transit-dining-recurring")),
    );
  });
});

describe("toEstimatedBaseValuePercent", () => {
  it("uses the best general (non-bonus) rate", () => {
    expect(toEstimatedBaseValuePercent(cardById("amex-platinum-ca"))).toBe(2); // 1x × 2¢
    expect(toEstimatedBaseValuePercent(cardById("triangle-mastercard"))).toBe(0.5); // 0.5% × 1¢
  });
});
