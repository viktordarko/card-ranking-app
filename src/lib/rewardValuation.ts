import { REWARD_VALUE_PROFILES } from "../data/rewardValuations";
import type { Card, EarnRate } from "../types/card";

const profileMap = new Map(
  REWARD_VALUE_PROFILES.map((profile) => [profile.id, profile]),
);

export const getCardValueUnit = (card: Card): number => {
  const profile = profileMap.get(card.rewardValueProfileId);
  return profile?.centsPerPointOrPercentUnit ?? 1;
};

export const getCardValueNotes = (card: Card): string | undefined => {
  return profileMap.get(card.rewardValueProfileId)?.notes;
};

export const toEstimatedValuePercent = (card: Card, rate: EarnRate): number => {
  return rate.rateMultiplier * getCardValueUnit(card);
};

export const toEstimatedBaseValuePercent = (card: Card): number => {
  const baseRates = card.earnRates.filter((rate) =>
    rate.mccTags.includes("general"),
  );

  if (baseRates.length === 0) {
    return 0;
  }

  const bestBaseRate = Math.max(
    ...baseRates.map((rate) => rate.rateMultiplier),
  );
  return bestBaseRate * getCardValueUnit(card);
};

/** The foreign-transaction fee as a percentage; 0 when the card waives it. */
export const getFxFeePercent = (card: Card): number => {
  return card.fxPolicy.hasFxFee ? (card.fxPolicy.fxFeePercent ?? 2.5) : 0;
};
