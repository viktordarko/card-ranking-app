import type { Card } from "../types/card";

/** Whether the "Rogers customer" option changes anything for this card. */
export const hasCustomerRates = (card: Card): boolean =>
  card.earnRates.some((rate) => rate.audience !== undefined);

/**
 * The card as it earns for someone who is (or isn't) a Rogers, Fido, or Shaw
 * customer. The other group's rates go, and the remaining ones lose their
 * condition: it is settled, so it shouldn't cost the card a tie.
 */
export const withRogersCustomer = (card: Card, isCustomer: boolean): Card => {
  if (!hasCustomerRates(card)) {
    return card;
  }

  const audience = isCustomer ? "rogers-customer" : "rogers-non-customer";

  return {
    ...card,
    earnRates: card.earnRates
      .filter((rate) => rate.audience === undefined || rate.audience === audience)
      .map((rate) => (rate.audience ? { ...rate, appliesTo: undefined } : rate)),
  };
};
