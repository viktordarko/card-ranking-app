import { REWARD_VALUE_PROFILES } from "../data/rewardValuations";
import type { Card, EarnRate } from "../types/card";

const profileMap = new Map(
  REWARD_VALUE_PROFILES.map((profile) => [profile.id, profile]),
);

export const getCardValueUnit = (card: Card): number => {
  const profile = profileMap.get(card.rewardValueProfileId);
  return profile?.centsPerPointOrPercentUnit ?? 1;
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
