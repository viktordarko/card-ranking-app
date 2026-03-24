import type { Card, EarnRate } from "../types/card";
import { formatRewardRate, formatSpecificBrandRate } from "./cardFormatting";
import {
  getCardValueUnit,
  toEstimatedBaseValuePercent,
  toEstimatedValuePercent,
} from "./rewardValuation";

export interface ComparisonCell {
  primary: string;
  detail?: string;
  emphasizePrimary?: boolean;
}

export interface ComparisonRowDef {
  label: string;
  value: (card: Card) => ComparisonCell;
  highlight?: boolean;
  numericValue?: (card: Card) => number;
  lowerIsBetter?: boolean;
}

const toCell = (
  primary: string,
  options?: { detail?: string; emphasizePrimary?: boolean },
): ComparisonCell => {
  return {
    primary,
    detail: options?.detail,
    emphasizePrimary: options?.emphasizePrimary,
  };
};

const getNumericRate = (card: Card, tag: string): number => {
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

const getSortedCategoryRates = (card: Card, tag: string): EarnRate[] => {
  return [...card.earnRates]
    .filter((rate) => rate.mccTags.includes(tag))
    .sort((a, b) => b.rateMultiplier - a.rateMultiplier);
};

const getCategoryCell = (card: Card, tag: string): ComparisonCell => {
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
      });
    }

    if (bestBaseRate > 0 && bestBaseRate < bestDisplayedRate) {
      return toCell(primary, {
        detail: `Falls back to ${formatRewardRate(card.rewardType, bestBaseRate)} on non-bonus spend`,
        emphasizePrimary: true,
      });
    }

    return toCell(primary, { emphasizePrimary: true });
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
    .map((lounge) => {
      if (lounge.freeVisitsPerYear === "UNLIMITED") {
        return "Unlimited";
      }

      if (lounge.freeVisitsPerYear === 0) {
        return "Paid only";
      }

      return `${lounge.freeVisitsPerYear}/yr`;
    })
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
    highlight: true,
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
    highlight: true,
    numericValue: (card) =>
      card.fxPolicy.hasFxFee ? (card.fxPolicy.fxFeePercent ?? 2.5) : 0,
    lowerIsBetter: true,
  },
  {
    label: "USD spend",
    value: (card) => getCategoryCell(card, "usd-spend"),
    highlight: true,
    numericValue: (card) => getNumericRate(card, "usd-spend"),
  },
  {
    label: "Dining",
    value: (card) => getCategoryCell(card, "restaurant"),
    highlight: true,
    numericValue: (card) => getNumericRate(card, "restaurant"),
  },
  {
    label: "Groceries",
    value: (card) => getCategoryCell(card, "groceries"),
    highlight: true,
    numericValue: (card) => getNumericRate(card, "groceries"),
  },
  {
    label: "Gas",
    value: (card) => getCategoryCell(card, "gas"),
    highlight: true,
    numericValue: (card) => getNumericRate(card, "gas"),
  },
  {
    label: "Travel",
    value: (card) => getCategoryCell(card, "travel"),
    highlight: true,
    numericValue: (card) => getNumericRate(card, "travel"),
  },
  {
    label: "Transit",
    value: (card) => getCategoryCell(card, "transit"),
    highlight: true,
    numericValue: (card) => getNumericRate(card, "transit"),
  },
  {
    label: "Base earn",
    value: (card) =>
      toCell(formatRewardRate(card.rewardType, getDisplayedBaseRate(card))),
    numericValue: (card) => getNumericBase(card),
  },
  {
    label: "Lounge",
    value: (card) => toCell(getLoungeLabel(card)),
    highlight: true,
    numericValue: (card) => getLoungeScore(card),
  },
  {
    label: "Brand / partner perks",
    value: (card) => toCell(getSpecificBrandsLabel(card)),
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
      id: card.id,
      value: row.numericValue?.(card) ?? 0,
    }));

    const extreme =
      mode === "best" ?
        row.lowerIsBetter ?
          Math.min(...values.map((entry) => entry.value))
        : Math.max(...values.map((entry) => entry.value))
      : row.lowerIsBetter ? Math.max(...values.map((entry) => entry.value))
      : Math.min(...values.map((entry) => entry.value));

    return new Set(
      values
        .filter((entry) => entry.value === extreme)
        .map((entry) => entry.id),
    );
  });
};

export const computeRowWinners = (cards: Card[]): Set<string>[] =>
  computeRowExtremes(cards, "best");

export const computeRowWorst = (cards: Card[]): Set<string>[] =>
  computeRowExtremes(cards, "worst");
