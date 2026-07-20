import { SPENDING_CATEGORIES } from "../data/categories";
import type { Card, EarnRate } from "../types/card";
import type { CategoryId } from "../types/category";
import {
  formatCategoryTooltip,
  formatLoungeVisits,
  formatRewardRate,
  formatSpecificBrandRate,
} from "./cardFormatting";
import {
  getCardValueUnit,
  toEstimatedBaseValuePercent,
  toEstimatedValuePercent,
} from "./rewardValuation";

export interface ComparisonCell {
  primary: string;
  detail?: string;
  emphasizePrimary?: boolean;
  capped?: boolean;
}

export interface ComparisonRowDef {
  label: string;
  /** Set on earn rows: links the row label to this category's legend entry. */
  categoryId?: CategoryId;
  /** Hover explanation of the row (what counts, common miscoding gotcha). */
  tooltip?: string;
  value: (card: Card) => ComparisonCell;
  numericValue?: (card: Card) => number;
  lowerIsBetter?: boolean;
  /** Breaks `numericValue` ties (higher wins). Earn rows use redemption
   * flexibility: between two cards returning the same estimated value, the one
   * whose rewards are easier to use is genuinely better. */
  tiebreak?: (card: Card) => number;
}

const toCell = (
  primary: string,
  options?: { detail?: string; emphasizePrimary?: boolean; capped?: boolean },
): ComparisonCell => {
  return {
    primary,
    detail: options?.detail,
    emphasizePrimary: options?.emphasizePrimary,
    capped: options?.capped,
  };
};

const getNumericRate = (card: Card, tag: CategoryId): number => {
  const categoryRates = card.earnRates.filter((rate) =>
    rate.mccTags.includes(tag),
  );

  if (categoryRates.length > 0) {
    return Math.max(
      ...categoryRates.map((rate) => toEstimatedValuePercent(card, rate)),
    );
  }

  return toEstimatedBaseValuePercent(card);
};

const getNumericBase = (card: Card): number => {
  return toEstimatedBaseValuePercent(card);
};

const getRedemptionFlexibility = (card: Card): number => {
  return card.redemption?.flexibility ?? 0;
};

const getDisplayedRateMultiplier = (
  card: Card,
  rateMultiplier: number,
): number => {
  if (card.rewardType === "CASHBACK") {
    return Number((rateMultiplier * getCardValueUnit(card)).toFixed(3));
  }

  return rateMultiplier;
};

const getDisplayedBaseRate = (card: Card): number => {
  const baseRates = card.earnRates.filter((rate) =>
    rate.mccTags.includes("general"),
  );

  if (baseRates.length === 0) {
    return 0;
  }

  const rawBase = Math.max(...baseRates.map((rate) => rate.rateMultiplier));
  return getDisplayedRateMultiplier(card, rawBase);
};

const getSortedCategoryRates = (card: Card, tag: CategoryId): EarnRate[] => {
  return card.earnRates
    .filter((rate) => rate.mccTags.includes(tag))
    .toSorted((a, b) => b.rateMultiplier - a.rateMultiplier);
};

const getCategoryCell = (card: Card, tag: CategoryId): ComparisonCell => {
  const categoryRates = getSortedCategoryRates(card, tag);
  const bestCategoryRate = categoryRates[0];
  const bestBaseRate = getDisplayedBaseRate(card);

  if (bestCategoryRate) {
    const fallbackCategoryRate = categoryRates.find(
      (rate) => rate.rateMultiplier < bestCategoryRate.rateMultiplier,
    );
    const bestDisplayedRate = getDisplayedRateMultiplier(
      card,
      bestCategoryRate.rateMultiplier,
    );

    const primary = `${formatRewardRate(card.rewardType, bestDisplayedRate)}${bestCategoryRate.appliesTo ? ` at ${bestCategoryRate.appliesTo}` : ""}`;

    if (fallbackCategoryRate) {
      const fallbackDisplayedRate = getDisplayedRateMultiplier(
        card,
        fallbackCategoryRate.rateMultiplier,
      );

      return toCell(primary, {
        detail: `Falls back to ${formatRewardRate(card.rewardType, fallbackDisplayedRate)} on ${fallbackCategoryRate.appliesTo ?? "eligible spend"}`,
        emphasizePrimary: true,
        capped: bestCategoryRate.capped,
      });
    }

    if (bestBaseRate > 0 && bestBaseRate < bestDisplayedRate) {
      return toCell(primary, {
        detail: `Falls back to ${formatRewardRate(card.rewardType, bestBaseRate)} on non-bonus spend`,
        emphasizePrimary: true,
        capped: bestCategoryRate.capped,
      });
    }

    return toCell(primary, {
      emphasizePrimary: true,
      capped: bestCategoryRate.capped,
    });
  }

  if (bestBaseRate > 0) {
    return toCell(formatRewardRate(card.rewardType, bestBaseRate), {
      detail: "Base rate",
    });
  }

  return toCell("-");
};

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

const getLoungeLabel = (card: Card): string => {
  if (!card.lounges?.length) {
    return "None";
  }

  return card.lounges
    .map((lounge) => formatLoungeVisits(lounge.freeVisitsPerYear))
    .join(", ");
};

const getSpecificBrandsLabel = (card: Card): string => {
  if (!card.specificBrands?.length) {
    return "-";
  }

  return card.specificBrands
    .map(
      (rate) =>
        `${rate.id} ${formatSpecificBrandRate(card.rewardType, rate.rateMultiplier, rate.description)}`,
    )
    .join("; ");
};

/**
 * One matrix row per bonus category, in registry order — so adding a category
 * to `SPENDING_CATEGORIES` adds its row (and hover definition) automatically.
 */
const CATEGORY_ROWS: ComparisonRowDef[] = SPENDING_CATEGORIES.filter(
  (category) => category.kind === "bonus",
).map((category) => ({
  label: category.label,
  categoryId: category.id,
  tooltip: formatCategoryTooltip(category),
  value: (card: Card) => getCategoryCell(card, category.id),
  numericValue: (card: Card) => getNumericRate(card, category.id),
  tiebreak: getRedemptionFlexibility,
}));

const BASE_CATEGORY = SPENDING_CATEGORIES.find(
  (category) => category.kind === "base",
);

export const COMPARISON_ROWS: ComparisonRowDef[] = [
  {
    label: "Network",
    value: (card) => toCell(card.network),
  },
  {
    label: "Reward currency",
    value: (card) => toCell(card.rewardCurrency ?? "-"),
  },
  {
    label: "Annual fee",
    value: (card) => toCell(`$${card.annualFee}`),
    numericValue: (card) => card.annualFee,
    lowerIsBetter: true,
  },
  {
    label: "Auth card fee",
    value: (card) =>
      toCell(
        (
          typeof card.additionalCardFee === "number" &&
            card.additionalCardFee > 0
        ) ?
          `$${card.additionalCardFee}`
        : "N/A",
      ),
  },
  {
    label: "FX fee",
    value: (card) =>
      toCell(
        card.fxPolicy.hasFxFee ?
          `${card.fxPolicy.fxFeePercent ?? 2.5}%`
        : "None",
      ),
    numericValue: (card) =>
      card.fxPolicy.hasFxFee ? (card.fxPolicy.fxFeePercent ?? 2.5) : 0,
    lowerIsBetter: true,
  },
  ...CATEGORY_ROWS,
  {
    label: "Base earn",
    categoryId: BASE_CATEGORY?.id,
    tooltip: BASE_CATEGORY && formatCategoryTooltip(BASE_CATEGORY),
    value: (card) =>
      toCell(formatRewardRate(card.rewardType, getDisplayedBaseRate(card))),
    numericValue: (card) => getNumericBase(card),
    tiebreak: getRedemptionFlexibility,
  },
  {
    label: "Lounge",
    value: (card) => toCell(getLoungeLabel(card)),
    numericValue: (card) => getLoungeScore(card),
  },
  {
    label: "Brand / partner perks",
    value: (card) => toCell(getSpecificBrandsLabel(card)),
  },
  {
    label: "Redemption",
    value: (card) => toCell(card.redemption?.label ?? "-"),
    numericValue: (card) => card.redemption?.flexibility ?? 0,
  },
];

const computeRowExtremes = (
  cards: Card[],
  mode: "best" | "worst",
): Set<string>[] => {
  return COMPARISON_ROWS.map((row) => {
    if (!row.numericValue) {
      return new Set<string>();
    }

    const values = cards.map((card) => ({
      card,
      value: row.numericValue?.(card) ?? 0,
    }));

    const extreme =
      mode === "best" ?
        row.lowerIsBetter ?
          Math.min(...values.map((entry) => entry.value))
        : Math.max(...values.map((entry) => entry.value))
      : row.lowerIsBetter ? Math.max(...values.map((entry) => entry.value))
      : Math.min(...values.map((entry) => entry.value));

    let tied = values.filter((entry) => entry.value === extreme);

    // Same estimated value ≠ same card: when the row has a tiebreak, keep only
    // the genuinely best (or, for "worst", most limited) of the tied cards.
    if (row.tiebreak && tied.length > 1) {
      const scores = tied.map((entry) => row.tiebreak?.(entry.card) ?? 0);
      const target =
        mode === "best" ? Math.max(...scores) : Math.min(...scores);
      tied = tied.filter((_, index) => scores[index] === target);
    }

    return new Set(tied.map((entry) => entry.card.id));
  });
};

export const computeRowWinners = (cards: Card[]): Set<string>[] =>
  computeRowExtremes(cards, "best");

export const computeRowWorst = (cards: Card[]): Set<string>[] =>
  computeRowExtremes(cards, "worst");
