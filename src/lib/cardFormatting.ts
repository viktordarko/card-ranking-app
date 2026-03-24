import type { LocationScope, RewardType } from "../types/card";

export const getRewardSuffix = (rewardType: RewardType): string => {
  return rewardType === "CASHBACK" ? "%" : "x";
};

export const formatRewardRate = (
  rewardType: RewardType,
  rateMultiplier: number,
): string => {
  if (rateMultiplier === 0) {
    return "-";
  }

  return `${rateMultiplier}${getRewardSuffix(rewardType)}`;
};

export const formatSpecificBrandRate = (
  rewardType: RewardType,
  rateMultiplier: number,
  description: string,
): string => {
  const isPerLitre = /litre|per\s*l|\/l/i.test(description);

  if (isPerLitre) {
    return `+$${rateMultiplier.toFixed(2)}/L`;
  }

  return formatRewardRate(rewardType, rateMultiplier);
};

export const formatScopeLabel = (scope: LocationScope): string => {
  if (scope === "CA_ONLY") {
    return "Canada only";
  }

  if (scope === "NETWORK_USD") {
    return "USD transactions";
  }

  return "Worldwide";
};
