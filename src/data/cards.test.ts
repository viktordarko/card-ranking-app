import { describe, expect, it } from "vitest";
import { CARDS } from "./cards";
import { REWARD_VALUE_PROFILES } from "./rewardValuations";

const profileIds = new Set(REWARD_VALUE_PROFILES.map((profile) => profile.id));

describe("card data integrity", () => {
  it("has a unique id per card", () => {
    const ids = CARDS.map((card) => card.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("references a real reward-value profile", () => {
    // A typo'd profile id would otherwise silently fall back to a 1¢ valuation.
    for (const card of CARDS) {
      expect(
        profileIds.has(card.rewardValueProfileId),
        `${card.id} → ${card.rewardValueProfileId}`,
      ).toBe(true);
    }
  });

  it("gives every card a base (general) earn rate so 'Base earn' is never blank", () => {
    for (const card of CARDS) {
      const hasGeneral = card.earnRates.some((rate) => rate.mccTags.includes("general"));
      expect(hasGeneral, `${card.id} is missing a general rate`).toBe(true);
    }
  });

  it("never leaves an earn rate without a category tag", () => {
    for (const card of CARDS) {
      for (const rate of card.earnRates) {
        expect(rate.mccTags.length, `${card.id} / ${rate.id}`).toBeGreaterThan(0);
      }
    }
  });

  it("keeps fee and FX data internally consistent", () => {
    for (const card of CARDS) {
      expect(card.annualFee, card.id).toBeGreaterThanOrEqual(0);
      if (card.fxPolicy.hasFxFee) {
        // A card that charges FX must state the percentage, not lean on a default.
        expect(card.fxPolicy.fxFeePercent, `${card.id} FX %`).toBeTypeOf("number");
      }
    }
  });

  it("only flags a rate as capped when the card documents the cap", () => {
    for (const card of CARDS) {
      const hasCappedRate = card.earnRates.some((rate) => rate.capped);
      if (hasCappedRate) {
        expect(
          card.caps?.length ?? 0,
          `${card.id} has a capped rate but no caps text`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("scores redemption flexibility within 1–5", () => {
    for (const card of CARDS) {
      if (card.redemption) {
        expect(card.redemption.flexibility, card.id).toBeGreaterThanOrEqual(1);
        expect(card.redemption.flexibility, card.id).toBeLessThanOrEqual(5);
      }
    }
  });

  it("uses valid https source URLs", () => {
    for (const card of CARDS) {
      if (card.sourceUrl) {
        expect(new URL(card.sourceUrl).protocol, card.id).toBe("https:");
      }
    }
  });
});

describe("reward-value profiles", () => {
  it("has a unique id per profile", () => {
    const ids = REWARD_VALUE_PROFILES.map((profile) => profile.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses positive cent values", () => {
    for (const profile of REWARD_VALUE_PROFILES) {
      expect(profile.centsPerPointOrPercentUnit, profile.id).toBeGreaterThan(0);
    }
  });
});
