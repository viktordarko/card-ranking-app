import type { LocationScope, RewardType } from "../types/card";
import type { SpendingCategory } from "../types/category";

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

export const formatLoungeVisits = (
  freeVisitsPerYear: number | "UNLIMITED",
): string => {
  if (freeVisitsPerYear === "UNLIMITED") {
    return "Unlimited";
  }

  if (freeVisitsPerYear === 0) {
    return "Paid only";
  }

  return `${freeVisitsPerYear}/yr`;
};

export const formatCategoryTooltip = (category: SpendingCategory): string => {
  const parts = [category.description];

  if (category.includes?.length) {
    parts.push(`Typically: ${category.includes.join(", ")}.`);
  }

  if (category.watchOut) {
    parts.push(`Watch out: ${category.watchOut}`);
  }

  return parts.join(" ");
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
