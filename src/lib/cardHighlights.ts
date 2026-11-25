import { SPENDING_CATEGORIES } from "../data/categories";
import type { Card } from "../types/card";
import type { CategoryId } from "../types/category";
import {
  COMPARISON_ROWS,
  computeRowWinners,
  getCategoryCell,
  getEffectiveCategoryValue,
} from "./cardComparison";
import { formatPercent, formatSpecificBrandRate } from "./cardFormatting";
import { toEstimatedValuePercent } from "./rewardValuation";

/** An accelerated (or base) rate, ready for a tile's "earn rates" list. */
export interface EarnHighlight {
  id: string;
  /** Picks the icon; not unique (a brand row can share its category's). */
  categoryId: CategoryId;
  label: string;
  rate: string;
  condition?: string;
  estimate?: string;
  capped: boolean;
}

const earnsBonus = (card: Card, categoryId: CategoryId): boolean =>
  card.earnRates.some((rate) => rate.mccTags.includes(categoryId));

/** "Dining" → "dining", but acronyms stay: "USD spend" and names stay. */
const toSentenceCase = (label: string): string =>
  /^([A-Z]{2}|Costco)/.test(label) ? label : label.charAt(0).toLowerCase() + label.slice(1);

/** Waiving the FX fee is what a card does for US-dollar spend, bonus or not. */
const servesCategory = (card: Card, categoryId: CategoryId): boolean =>
  earnsBonus(card, categoryId) || (categoryId === "usd-spend" && !card.fxPolicy.hasFxFee);

/**
 * The categories each card leads among `cards`, strongest lead first. A card
 * that tops a category on its base rate alone doesn't count: "best for transit"
 * should mean the card does something for transit.
 */
export const getBestForCategories = (cards: Card[]): Map<string, string[]> => {
  const winners = computeRowWinners(cards);
  const leads = new Map<string, { label: string; value: number }[]>();

  COMPARISON_ROWS.forEach((row, index) => {
    const { categoryId } = row;
    // Base earn gets no badge: ties there come down to point valuations, and
    // "best for everyday spend" on a card with a large fee would be bad advice.
    if (!categoryId || categoryId === "general") {
      return;
    }
    for (const card of cards) {
      if (winners[index]?.has(card.id) && servesCategory(card, categoryId)) {
        const entry = {
          label: toSentenceCase(row.label),
          value: getEffectiveCategoryValue(card, categoryId),
        };
        leads.set(card.id, [...(leads.get(card.id) ?? []), entry]);
      }
    }
  });

  return new Map(
    Array.from(leads, ([id, entries]) => [
      id,
      entries.toSorted((a, b) => b.value - a.value).map((entry) => entry.label),
    ]),
  );
};

/**
 * The first brand rate that says something the category rows don't already:
 * "Costco gas 3%" is noise under "Gas 3%, at Costco gas stations".
 */
const getBrandHighlight = (card: Card): EarnHighlight | undefined => {
  const rate = card.specificBrands?.find(
    (brand) =>
      !card.earnRates.some(
        (earn) =>
          earn.rateMultiplier === brand.rateMultiplier &&
          earn.mccTags.some((tag) => brand.mccTags.includes(tag)),
      ),
  );

  if (!rate) {
    return undefined;
  }

  return {
    id: rate.id,
    categoryId: rate.mccTags[0] ?? "general",
    label: rate.id,
    rate: formatSpecificBrandRate(card.rewardType, rate.rateMultiplier, rate.description),
    estimate:
      card.rewardType === "CASHBACK"
        ? undefined
        : `≈ ${formatPercent(toEstimatedValuePercent(card, rate))}`,
    capped: Boolean(rate.capped),
  };
};

/**
 * A card's accelerated categories by estimated return (at most `maxCategories`),
 * then its headline brand rate, then its base rate.
 */
export const getEarnHighlights = (card: Card, maxCategories: number): EarnHighlight[] => {
  const toHighlight = (categoryId: CategoryId, label: string): EarnHighlight => {
    const cell = getCategoryCell(card, categoryId);
    return {
      id: categoryId,
      categoryId,
      label,
      rate: cell.primary,
      condition: cell.condition,
      estimate: cell.estimate,
      capped: Boolean(cell.capped),
    };
  };

  const bonus = SPENDING_CATEGORIES.filter(
    (category) => category.kind === "bonus" && earnsBonus(card, category.id),
  )
    .toSorted(
      (a, b) =>
        getEffectiveCategoryValue(card, b.id) - getEffectiveCategoryValue(card, a.id),
    )
    .slice(0, maxCategories)
    .map((category) => toHighlight(category.id, category.label));

  const brand = getBrandHighlight(card);

  return [...bonus, ...(brand ? [brand] : []), toHighlight("general", "Everything else")];
};
