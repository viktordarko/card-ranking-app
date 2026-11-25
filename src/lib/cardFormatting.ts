import type {
  Card,
  IncomeRequirement,
  InsuranceKind,
  LocationScope,
  Network,
  RewardType,
} from "../types/card";
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

/** An estimated return, e.g. `4%` or `-1.5%`; at most two decimals. */
export const formatPercent = (value: number): string => {
  return `${Number(value.toFixed(2))}%`;
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

const NETWORK_LABELS: Record<Network, string> = {
  AMEX: "Amex",
  VISA: "Visa",
  MASTERCARD: "Mastercard",
};

export const formatNetwork = (network: Network): string => NETWORK_LABELS[network];

const REWARD_TYPE_LABELS: Record<RewardType, string> = {
  MR: "Membership Rewards",
  CASHBACK: "Cash back",
  POINTS: "Points",
};

export const formatRewardType = (rewardType: RewardType): string =>
  REWARD_TYPE_LABELS[rewardType];

/** Whole dollars with thousands separators, e.g. `$1,400`. */
export const formatDollars = (amount: number): string =>
  `$${Math.round(amount).toLocaleString("en-US")}`;

export const formatAnnualFee = (annualFee: number): string =>
  annualFee === 0 ? "No fee" : formatDollars(annualFee);

/**
 * A card with no annual fee and no stated extra-card fee reads "N/A": a second
 * person can simply get their own.
 */
export const formatExtraCardFee = (
  card: Pick<Card, "annualFee" | "additionalCardFee">,
): string => {
  if (card.additionalCardFee === undefined) {
    return card.annualFee === 0 ? "N/A" : "Not published";
  }

  return card.additionalCardFee === 0 ? "Free" : formatDollars(card.additionalCardFee);
};

// Records hold plain calendar days. Formatting in UTC keeps `2026-12-31` from
// slipping to Dec 30 for anyone west of Greenwich (i.e. all of Canada).
const CALENDAR_DATE = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** An ISO calendar date as e.g. `Dec 31, 2026`. */
export const formatDate = (isoDate: string): string =>
  CALENDAR_DATE.format(new Date(`${isoDate}T00:00:00Z`));

export const formatIncome = (income: IncomeRequirement | undefined): string => {
  const amounts: string[] = [];

  if (income?.personal !== undefined) {
    amounts.push(`${formatDollars(income.personal)} personal`);
  }
  if (income?.household !== undefined) {
    amounts.push(`${formatDollars(income.household)} household`);
  }

  return amounts.length > 0 ? amounts.join(" or ") : (income?.note ?? "Not published");
};

/** Every kind of coverage, in the order pages list them. */
export const INSURANCE_LABELS: Record<InsuranceKind, string> = {
  "emergency-medical": "Emergency medical",
  "trip-cancellation": "Trip cancellation",
  "trip-interruption": "Trip interruption",
  "travel-accident": "Travel accident",
  "flight-delay": "Flight delay",
  baggage: "Baggage",
  "rental-car": "Rental car",
  "hotel-burglary": "Hotel burglary",
  "mobile-device": "Mobile device",
  "purchase-protection": "Purchase protection",
  "extended-warranty": "Extended warranty",
};
