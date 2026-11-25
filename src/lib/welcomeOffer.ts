import type { Card, EarnRate } from "../types/card";
import { formatDollars } from "./cardFormatting";
import { getCardValueUnit } from "./rewardValuation";

/**
 * Estimated cash value of a card's welcome offer, in dollars: points go through
 * the card's reward profile, cash counts at face value. Undefined when the card
 * has no offer (or none that can be priced), so callers never show a made-up $0.
 */
export const getWelcomeOfferValue = (card: Card): number | undefined => {
  const offer = card.welcomeOffer;

  if (!offer || (offer.bonusPoints === undefined && offer.bonusCash === undefined)) {
    return undefined;
  }

  const pointsValue = ((offer.bonusPoints ?? 0) * getCardValueUnit(card)) / 100;
  return Math.round(pointsValue + (offer.bonusCash ?? 0));
};

/** Both are ISO calendar days, so text order is date order. The last day counts. */
export const isOfferOver = (card: Card, today: string): boolean => {
  const expires = card.welcomeOffer?.expires;
  return expires !== undefined && expires < today;
};

/** The card without its welcome offer once that offer has ended. */
export const withCurrentOffer = (card: Card, today: string): Card =>
  isOfferOver(card, today) ? { ...card, welcomeOffer: undefined } : card;

/**
 * The card as it earns in its first year: every rate (the post-cap rate and brand
 * rates too) times the match. Cards without one come back unchanged. Spend caps
 * on accelerated rates still apply, and a limit on the match itself is shown
 * rather than modelled, since when it runs out depends on spending.
 */
export const withFirstYearMatch = (card: Card): Card => {
  const match = card.welcomeOffer?.firstYearMatch;

  if (!match || card.appliedMatch) {
    return card;
  }

  // Trims float noise such as 1.1 * 3.
  const multiply = (value: number): number => Number((value * match.multiplier).toFixed(4));
  const apply = (rate: EarnRate): EarnRate => ({
    ...rate,
    rateMultiplier: multiply(rate.rateMultiplier),
    rateAfterCap: rate.rateAfterCap === undefined ? undefined : multiply(rate.rateAfterCap),
  });

  return {
    ...card,
    earnRates: card.earnRates.map(apply),
    specificBrands: card.specificBrands?.map(apply),
    appliedMatch: match,
  };
};

/** Shown beside matched rates; undefined when the card's rates are its usual ones. */
export const getMatchNote = ({ appliedMatch }: Card): string | undefined =>
  appliedMatch &&
  `First-year match, ${
    appliedMatch.maxBonus === undefined
      ? "no limit"
      : `up to ${formatDollars(appliedMatch.maxBonus)} extra`
  }`;
