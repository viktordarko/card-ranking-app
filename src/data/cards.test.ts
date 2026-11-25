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
      const urls = (card.sources ?? []).map((source) => source.url);
      for (const url of card.sourceUrl ? [card.sourceUrl, ...urls] : urls) {
        expect(new URL(url).protocol, card.id).toBe("https:");
      }
    }
  });

  it("writes every date as a real ISO calendar day", () => {
    // formatDate would print "Invalid Date" for anything else.
    for (const card of CARDS) {
      const dates = [
        card.verifiedOn,
        card.welcomeOffer?.expires,
        ...(card.upcomingChanges ?? []).map((change) => change.effective),
      ];
      for (const date of dates) {
        if (date !== undefined) {
          expect(new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10), card.id).toBe(date);
        }
      }
    }
  });

  it("only lists changes that were still ahead when the card was checked", () => {
    // A change that has taken effect belongs in the card's own fields.
    for (const card of CARDS) {
      for (const change of card.upcomingChanges ?? []) {
        expect(change.effective > card.verifiedOn, `${card.id}: ${change.effective}`).toBe(true);
      }
    }
  });

  it("only lists welcome offers that were open when the card was checked", () => {
    for (const card of CARDS) {
      const expires = card.welcomeOffer?.expires;
      if (expires) {
        expect(expires >= card.verifiedOn, `${card.id}: ${expires}`).toBe(true);
      }
    }
  });

  it("lists each kind of insurance at most once per card", () => {
    for (const card of CARDS) {
      const kinds = (card.insurance ?? []).map((item) => item.kind);
      expect(new Set(kinds).size, card.id).toBe(kinds.length);
    }
  });

  it("gives every card both sides of the argument", () => {
    for (const card of CARDS) {
      expect(card.pros.length, card.id).toBeGreaterThan(0);
      expect(card.cons.length, card.id).toBeGreaterThan(0);
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
