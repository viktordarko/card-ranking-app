import { SPENDING_CATEGORIES } from "../data/categories";
import type { Card, EarnRate, InsuranceKind } from "../types/card";
import type { CategoryId } from "../types/category";
import {
  formatAnnualFee,
  formatCategoryTooltip,
  formatDate,
  formatDollars,
  formatExtraCardFee,
  formatIncome,
  formatLoungeVisits,
  formatNetwork,
  formatPercent,
  formatRewardRate,
  formatSpecificBrandRate,
  INSURANCE_LABELS,
} from "./cardFormatting";
import {
  getCardValueUnit,
  getFxFeePercent,
  toEstimatedBaseValuePercent,
  toEstimatedValuePercent,
} from "./rewardValuation";
import { getMatchNote, getWelcomeOfferValue } from "./welcomeOffer";

export type RowGroup = "Costs" | "Welcome offer" | "Earn rates" | "Travel & protection" | "Rewards";

export interface ComparisonCell {
  primary: string;
  /** What narrows the headline value, e.g. "at Scene+ grocery partners". */
  condition?: string;
  /** What you get instead once the headline value doesn't apply. */
  detail?: string;
  /** Estimated cash return, when the headline isn't already one. */
  estimate?: string;
  /** Says the rate includes a first-year match, and the match's limit. */
  matchNote?: string;
  /** The headline is an accelerated rate rather than the card's base rate. */
  emphasizePrimary?: boolean;
  capped?: boolean;
  /** Nothing to see here (base rate, not covered, no offer): render quietly. */
  muted?: boolean;
}

export interface ComparisonRowDef {
  label: string;
  group: RowGroup;
  /** Set on earn rows: links the row label to this category's legend entry. */
  categoryId?: CategoryId;
  /** Hover explanation of the row (what counts, common miscoding gotcha). */
  tooltip?: string;
  value: (card: Card) => ComparisonCell;
  numericValue?: (card: Card) => number;
  lowerIsBetter?: boolean;
  /** Mark only the best: the low end isn't comparable (e.g. unpriced offers). */
  bestOnly?: boolean;
  /** Breaks `numericValue` ties (higher wins); see `getCategoryTiebreak`. */
  tiebreak?: (card: Card) => number;
}

const NONE_CELL: ComparisonCell = { primary: "None", muted: true };
const NOT_COVERED_CELL: ComparisonCell = { primary: "Not covered", muted: true };

const isAcceptedIn = (card: Card, tag: CategoryId): boolean =>
  SPENDING_CATEGORIES.find((category) => category.id === tag)?.acceptedNetworks?.includes(
    card.network,
  ) ?? true;

const getSortedCategoryRates = (card: Card, tag: CategoryId): EarnRate[] => {
  return card.earnRates
    .filter((rate) => rate.mccTags.includes(tag))
    .toSorted((a, b) => b.rateMultiplier - a.rateMultiplier);
};

const getGrossCategoryValue = (card: Card, tag: CategoryId): number => {
  const bestRate = getSortedCategoryRates(card, tag)[0];
  return bestRate ? toEstimatedValuePercent(card, bestRate) : toEstimatedBaseValuePercent(card);
};

/**
 * What a purchase in `tag` really returns, as an estimated percentage. US-dollar
 * spend is net of the card's FX fee — a 3% rate behind a 2.5% fee returns 0.5%,
 * which is less than a plain 1% on a card that waives the fee.
 */
export const getEffectiveCategoryValue = (card: Card, tag: CategoryId): number => {
  if (!isAcceptedIn(card, tag)) {
    return 0;
  }

  const gross = getGrossCategoryValue(card, tag);
  return tag === "usd-spend" ? gross - getFxFeePercent(card) : gross;
};

const getRedemptionFlexibility = (card: Card): number => {
  return card.redemption?.flexibility ?? 0;
};

/**
 * Between two cards returning the same estimated value, a rate that covers the
 * whole category beats one limited to certain stores or customers; after that,
 * the card whose rewards are easier to redeem is genuinely better.
 */
export const getCategoryTiebreak = (card: Card, tag: CategoryId): number => {
  if (!isAcceptedIn(card, tag)) {
    return 0;
  }

  const rate = getSortedCategoryRates(card, tag)[0] ?? getSortedCategoryRates(card, "general")[0];
  const coversCategory = rate !== undefined && rate.appliesTo === undefined;
  return (coversCategory ? 10 : 0) + getRedemptionFlexibility(card);
};

/** Cash back is shown at its redeemed value; points keep their own unit. */
const formatDisplayedRate = (card: Card, rate: EarnRate): string => {
  const multiplier =
    card.rewardType === "CASHBACK"
      ? Number((rate.rateMultiplier * getCardValueUnit(card)).toFixed(3))
      : rate.rateMultiplier;
  return formatRewardRate(card.rewardType, multiplier);
};

const getEstimateLabel = (card: Card, tag: CategoryId): string | undefined => {
  const value = formatPercent(getEffectiveCategoryValue(card, tag));

  if (tag === "usd-spend") {
    return card.fxPolicy.hasFxFee ? `≈ ${value} after FX fee` : `≈ ${value}, no FX fee`;
  }

  // A cash-back rate already is its estimated return.
  return card.rewardType === "CASHBACK" ? undefined : `≈ ${value}`;
};

/** Costco.ca pays differently from the warehouses, so it sits under their rate. */
const getCostcoOnlineDetail = (card: Card): string | undefined => {
  const online = card.specificBrands?.find((brand) => brand.mccTags.includes("costco"));
  return online && `${formatDisplayedRate(card, online)} on ${online.id}${online.capped ? ", up to a cap" : ""}`;
};

/** Names a base rate and says what follows it: "Customer rate; 1.5% past the cap". */
const getBaseDetail = (card: Card, baseRate: EarnRate, lowerBase?: EarnRate): string => {
  const isCustomerRate = baseRate.audience === "rogers-customer" && !baseRate.appliesTo;
  const name = isCustomerRate ? "Customer rate" : "Base rate";

  if (lowerBase) {
    return `${name}; ${formatDisplayedRate(card, lowerBase)} ${lowerBase.appliesTo ?? "elsewhere"}`;
  }
  if (baseRate.capped && baseRate.rateAfterCap !== undefined) {
    const afterCap = { ...baseRate, rateMultiplier: baseRate.rateAfterCap };
    return `${name}; ${formatDisplayedRate(card, afterCap)} past the cap`;
  }
  return name;
};

const getRateCell = (card: Card, tag: CategoryId): ComparisonCell => {
  const baseRates = getSortedCategoryRates(card, "general");
  const baseRate = baseRates[0];
  const categoryRates = getSortedCategoryRates(card, tag);
  const bestRate = categoryRates[0];
  const estimate = getEstimateLabel(card, tag);

  if (!bestRate) {
    if (!baseRate) {
      return { primary: "-", muted: true };
    }

    const lowerBase = baseRates.find((rate) => rate.rateMultiplier < baseRate.rateMultiplier);
    return {
      primary: formatDisplayedRate(card, baseRate),
      condition: baseRate.appliesTo,
      detail: getBaseDetail(card, baseRate, lowerBase),
      estimate,
      capped: baseRate.capped,
      muted: true,
    };
  }

  const cell: ComparisonCell = {
    primary: formatDisplayedRate(card, bestRate),
    condition: bestRate.appliesTo,
    estimate,
    emphasizePrimary: tag !== "general" && bestRate.rateMultiplier > (baseRate?.rateMultiplier ?? 0),
    capped: bestRate.capped,
  };

  if (tag === "costco") {
    cell.detail = getCostcoOnlineDetail(card);
  }

  const nextRate = categoryRates.find((rate) => rate.rateMultiplier < bestRate.rateMultiplier);
  if (nextRate) {
    cell.detail = `${formatDisplayedRate(card, nextRate)} ${nextRate.appliesTo ?? "elsewhere"}`;
    return cell;
  }

  if (tag === "general" && bestRate.audience && bestRate.rateAfterCap !== undefined) {
    cell.detail = getBaseDetail(card, bestRate);
  }

  const belowBest = baseRate && baseRate.rateMultiplier < bestRate.rateMultiplier;
  if (belowBest && bestRate.appliesTo) {
    cell.detail = `${formatDisplayedRate(card, baseRate)} elsewhere`;
  } else if (belowBest && bestRate.capped) {
    const rateMultiplier = bestRate.rateAfterCap ?? baseRate.rateMultiplier;
    cell.detail = `${formatDisplayedRate(card, { ...bestRate, rateMultiplier })} past the cap`;
  }

  return cell;
};

export const getCategoryCell = (card: Card, tag: CategoryId): ComparisonCell =>
  isAcceptedIn(card, tag)
    ? { ...getRateCell(card, tag), matchNote: getMatchNote(card) }
    : { primary: "Not accepted", condition: `${formatNetwork(card.network)} not taken`, muted: true };

const getLoungeScore = (card: Card): number => {
  if (!card.lounges?.length) {
    return -1;
  }

  return Math.max(
    ...card.lounges.map((lounge) =>
      lounge.freeVisitsPerYear === "UNLIMITED" ? 999 : lounge.freeVisitsPerYear,
    ),
  );
};

const getLoungeCell = (card: Card): ComparisonCell => {
  if (!card.lounges?.length) {
    return NONE_CELL;
  }

  return {
    primary: card.lounges.map((lounge) => formatLoungeVisits(lounge.freeVisitsPerYear)).join(", "),
    condition: card.lounges.map((lounge) => lounge.program).join(", "),
    detail: card.lounges.find((lounge) => lounge.note)?.note,
  };
};

const getSpecificBrandsCell = (card: Card): ComparisonCell => {
  if (!card.specificBrands?.length) {
    return NONE_CELL;
  }

  return {
    primary: card.specificBrands
      .map(
        (rate) =>
          `${rate.id} ${formatSpecificBrandRate(card.rewardType, rate.rateMultiplier, rate.description)}`,
      )
      .join("; "),
    matchNote: getMatchNote(card),
  };
};

const getWelcomeCell = (card: Card): ComparisonCell => {
  const offer = card.welcomeOffer;

  if (!offer) {
    return { primary: "No public offer", muted: true };
  }

  const value = getWelcomeOfferValue(card);
  return {
    primary: offer.headline,
    estimate: value === undefined ? undefined : `≈ ${formatDollars(value)}`,
    detail: offer.expires && `Ends ${formatDate(offer.expires)}`,
  };
};

const getInsuranceCell = (card: Card, kind: InsuranceKind): ComparisonCell => {
  const match = card.insurance?.find((item) => item.kind === kind);
  return match ? { primary: match.coverage } : NOT_COVERED_CELL;
};

/** The coverages worth comparing side by side; detail pages list them all. */
const COMPARED_INSURANCE: InsuranceKind[] = [
  "emergency-medical",
  "trip-cancellation",
  "flight-delay",
  "rental-car",
  "mobile-device",
  "purchase-protection",
];

/**
 * One matrix row per bonus category, in registry order — so adding a category
 * to `SPENDING_CATEGORIES` adds its row (and hover definition) automatically.
 */
const CATEGORY_ROWS: ComparisonRowDef[] = SPENDING_CATEGORIES.filter(
  (category) => category.kind === "bonus",
).map((category) => ({
  label: category.label,
  group: "Earn rates",
  categoryId: category.id,
  tooltip: formatCategoryTooltip(category),
  value: (card: Card) => getCategoryCell(card, category.id),
  numericValue: (card: Card) => getEffectiveCategoryValue(card, category.id),
  tiebreak: (card: Card) => getCategoryTiebreak(card, category.id),
}));

const BASE_CATEGORY = SPENDING_CATEGORIES.find(
  (category) => category.kind === "base",
);

/** Rows of the same group are contiguous; the table prints a heading per group. */
export const COMPARISON_ROWS: ComparisonRowDef[] = [
  {
    label: "Annual fee",
    group: "Costs",
    value: (card) => ({ primary: formatAnnualFee(card.annualFee) }),
    numericValue: (card) => card.annualFee,
    lowerIsBetter: true,
  },
  {
    label: "Extra card fee",
    group: "Costs",
    tooltip: "Yearly cost of adding a supplementary (authorized user) card.",
    value: (card) => ({
      primary: formatExtraCardFee(card),
      muted: card.additionalCardFee === undefined,
    }),
  },
  {
    label: "FX fee",
    group: "Costs",
    tooltip: "Added to every purchase that isn't in Canadian dollars.",
    value: (card) => ({
      primary: card.fxPolicy.hasFxFee ? formatPercent(getFxFeePercent(card)) : "None",
    }),
    numericValue: getFxFeePercent,
    lowerIsBetter: true,
  },
  {
    label: "Minimum income",
    group: "Costs",
    value: (card) => ({ primary: formatIncome(card.income), muted: !card.income }),
  },
  {
    label: "Welcome offer",
    group: "Welcome offer",
    tooltip: "Public offer for new cardholders. Points are priced at this site's estimates.",
    value: getWelcomeCell,
    numericValue: (card) => getWelcomeOfferValue(card) ?? 0,
    bestOnly: true,
  },
  ...CATEGORY_ROWS,
  {
    label: "Base earn",
    group: "Earn rates",
    categoryId: BASE_CATEGORY?.id,
    tooltip: BASE_CATEGORY && formatCategoryTooltip(BASE_CATEGORY),
    value: (card) => getCategoryCell(card, "general"),
    numericValue: toEstimatedBaseValuePercent,
    tiebreak: (card) => getCategoryTiebreak(card, "general"),
  },
  {
    label: "Brand / partner perks",
    group: "Earn rates",
    value: getSpecificBrandsCell,
  },
  {
    label: "Lounge",
    group: "Travel & protection",
    tooltip: "Complimentary airport lounge visits per year.",
    value: getLoungeCell,
    numericValue: getLoungeScore,
  },
  ...COMPARED_INSURANCE.map(
    (kind): ComparisonRowDef => ({
      label: INSURANCE_LABELS[kind],
      group: "Travel & protection",
      value: (card) => getInsuranceCell(card, kind),
    }),
  ),
  {
    label: "Network",
    group: "Rewards",
    value: (card) => ({ primary: formatNetwork(card.network) }),
  },
  {
    label: "Reward currency",
    group: "Rewards",
    value: (card) => ({ primary: card.rewardCurrency ?? "-" }),
  },
  {
    label: "Redemption",
    group: "Rewards",
    tooltip: "How freely the rewards can be used — separate from how much they are worth.",
    value: (card) => ({ primary: card.redemption?.label ?? "-" }),
    numericValue: getRedemptionFlexibility,
  },
];

const computeRowExtremes = (
  cards: Card[],
  mode: "best" | "worst",
): Set<string>[] => {
  return COMPARISON_ROWS.map((row) => {
    const { numericValue, tiebreak } = row;

    if (!numericValue || (mode === "worst" && row.bestOnly)) {
      return new Set<string>();
    }

    const values = cards.map((card) => ({ card, value: numericValue(card) }));
    const numbers = values.map((entry) => entry.value);
    const wantsLowest = (mode === "best") === Boolean(row.lowerIsBetter);
    const extreme = wantsLowest ? Math.min(...numbers) : Math.max(...numbers);

    // Every card returns the same: a tiebreak may still name a best, but none of
    // them is weak.
    if (mode === "worst" && numbers.every((value) => value === extreme)) {
      return new Set<string>();
    }

    let tied = values.filter((entry) => entry.value === extreme);

    // Same estimated value ≠ same card: when the row has a tiebreak, keep only
    // the genuinely best (or, for "worst", most limited) of the tied cards.
    if (tiebreak && tied.length > 1) {
      const scores = tied.map((entry) => tiebreak(entry.card));
      const target =
        mode === "best" ? Math.max(...scores) : Math.min(...scores);
      tied = tied.filter((_, index) => scores[index] === target);
    }

    // A highlight has to single something out: nothing is best when every card
    // ties, and "weakest" on most of the row is just noise.
    const tooMany = mode === "best" ? tied.length === cards.length : tied.length > cards.length / 2;

    return new Set(tooMany ? [] : tied.map((entry) => entry.card.id));
  });
};

export const computeRowWinners = (cards: Card[]): Set<string>[] =>
  computeRowExtremes(cards, "best");

export const computeRowWorst = (cards: Card[]): Set<string>[] =>
  computeRowExtremes(cards, "worst");
