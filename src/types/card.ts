import type { RewardValueProfileId } from "./rewardValue";

export type Network = "AMEX" | "VISA" | "MASTERCARD";
export type RewardType = "MR" | "CASHBACK" | "POINTS";
export type LocationScope = "CA_ONLY" | "WORLDWIDE" | "NETWORK_USD";

export interface FxPolicy {
  hasFxFee: boolean;
  fxFeePercent?: number;
}

export interface EarnRate {
  id: string;
  rewardType: RewardType;
  rateMultiplier: number;
  description: string;
  appliesTo?: string;
  mccTags: string[];
  locationScope: LocationScope;
  /** True when this accelerated rate reverts to the base rate past an annual
   * spend cap (the exact threshold lives in the card's `caps`). */
  capped?: boolean;
}

export interface LoungeBenefit {
  program: string;
  freeVisitsPerYear: number | "UNLIMITED";
}

/**
 * How easily the card's rewards can be turned into value. This is kept separate
 * from the point value (cents per unit): a reward can be worth a full 1.0¢ but
 * still be hard to redeem (e.g. store-locked). `flexibility` is a 1–5 tiebreaker,
 * ranked by where you can direct the value — not by how much it is worth:
 *
 *   5 = cash, or freely spendable anywhere (incl. a certificate you can cash out)
 *   4 = statement credit, or points transferable to partners (near-cash)
 *   3 = program points redeemable within a rewards program (travel, groceries…)
 *   2 = conditional — full value only in a narrow way (e.g. toward one biller)
 *   1 = a single specific retailer only, non-cashable
 */
export interface RedemptionFlexibility {
  label: string;
  flexibility: 1 | 2 | 3 | 4 | 5;
}

export interface Card {
  id: string;
  displayName: string;
  shortName?: string;
  rewardValueProfileId: RewardValueProfileId;
  network: Network;
  issuer: string;
  rewardCurrency?: string;
  minimumIncome?: string;
  rewardType: RewardType;
  annualFee: number;
  additionalCardFee?: number;
  fxPolicy: FxPolicy;
  redemption?: RedemptionFlexibility;
  earnRates: EarnRate[];
  lounges?: LoungeBenefit[];
  caps?: string[];
  specificBrands?: EarnRate[];
  keyBenefits?: string[];
  notes?: string;
  /** Official issuer page the data was fact-checked against. */
  sourceUrl?: string;
}
