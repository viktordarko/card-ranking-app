import { SPENDING_CATEGORIES } from "../data/categories";
import type { Card } from "../types/card";
import type { CategoryId } from "../types/category";
import { getCategoryTiebreak, getEffectiveCategoryValue } from "./cardComparison";
import { getWelcomeOfferValue } from "./welcomeOffer";

export type SortKey = "featured" | "fee" | "welcome" | `earn:${CategoryId}`;

export interface SortOption {
  value: SortKey;
  label: string;
}

export const GENERAL_SORT_OPTIONS: SortOption[] = [
  { value: "featured", label: "Featured" },
  { value: "fee", label: "Lowest annual fee" },
  { value: "welcome", label: "Biggest welcome offer" },
];

/** "Best earn on …" options, one per rankable category in the registry. */
export const EARN_SORT_OPTIONS: SortOption[] = SPENDING_CATEGORIES.filter(
  (category) => category.kind !== "brand",
).map((category) => ({
  value: `earn:${category.id}`,
  label: category.kind === "base" ? "Everything else" : category.label,
}));

const SORT_KEYS = new Set<string>(
  [...GENERAL_SORT_OPTIONS, ...EARN_SORT_OPTIONS].map((option) => option.value),
);

export const isSortKey = (value: string): value is SortKey => SORT_KEYS.has(value);

const getSortCategory = (key: SortKey): CategoryId | undefined =>
  SPENDING_CATEGORIES.find((category) => key === `earn:${category.id}`)?.id;

/** Higher is better for every key, so one comparator covers them all. */
const getSortScore = (card: Card, key: SortKey): number => {
  const category = getSortCategory(key);

  if (category) {
    return getEffectiveCategoryValue(card, category);
  }

  if (key === "fee") {
    return -card.annualFee;
  }

  // An offer with no fixed value (e.g. a first-year match) still beats none.
  return getWelcomeOfferValue(card) ?? (card.welcomeOffer ? 0 : -1);
};

/**
 * Sorted copy of `cards`. Ties on an earn sort follow the matrix's tiebreak;
 * anything still tied keeps the portfolio order.
 */
export const sortCards = (cards: Card[], key: SortKey): Card[] => {
  if (key === "featured") {
    return [...cards];
  }

  const category = getSortCategory(key);

  return cards.toSorted((a, b) => {
    const byScore = getSortScore(b, key) - getSortScore(a, key);

    return byScore === 0 && category
      ? getCategoryTiebreak(b, category) - getCategoryTiebreak(a, category)
      : byScore;
  });
};
