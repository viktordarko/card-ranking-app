import type { CategoryId } from "./category";
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
  /**
   * Set only when the rate covers *less* than its tagged categories (e.g. one
   * grocery banner, or one customer group). Shown right after the rate, so
   * write it as a short phrase: "at Costco gas stations", "for customers".
   */
  appliesTo?: string;
  /** Categories the rate targets — see `SPENDING_CATEGORIES` for definitions. */
  mccTags: CategoryId[];
  locationScope: LocationScope;
  /** True when this accelerated rate reverts to the base rate past an annual
   * spend cap (the exact threshold lives in the card's `caps`). */
  capped?: boolean;
  /** Who gets the rate, when that depends on being the issuer's customer. */
  audience?: "rogers-customer" | "rogers-non-customer";
  /** What the rate drops to past its cap, when that isn't the base rate. */
  rateAfterCap?: number;
}

export interface LoungeBenefit {
  program: string;
  freeVisitsPerYear: number | "UNLIMITED";
  /** A limit or announced change worth showing next to the visit count. */
  note?: string;
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

/** A first-year offer that multiplies everything the card earns. */
export interface FirstYearMatch {
  /** 2 when the issuer doubles the rewards. */
  multiplier: number;
  /** The most the match can add, in dollars. Leave out when there is no limit. */
  maxBonus?: number;
}

/**
 * The public new-cardholder offer. Offers rotate every few weeks, so `expires`
 * is stated whenever the issuer publishes it and shown next to the headline.
 */
export interface WelcomeOffer {
  headline: string;
  details?: string[];
  /** Total bonus in the card's own points, valued through its reward profile. */
  bonusPoints?: number;
  /** Total bonus in dollars (cash back, or a first-year fee rebate). */
  bonusCash?: number;
  /** Not priced in dollars: it depends on spending, so it changes earn rates. */
  firstYearMatch?: FirstYearMatch;
  /** ISO date (YYYY-MM-DD) the offer ends, when published. */
  expires?: string;
}

export interface IncomeRequirement {
  /** Minimum personal annual income, in dollars. */
  personal?: number;
  /** Minimum household annual income, in dollars. */
  household?: number;
  /** Anything that replaces or qualifies the numbers above. */
  note?: string;
}

export type InsuranceKind =
  | "emergency-medical"
  | "trip-cancellation"
  | "trip-interruption"
  | "travel-accident"
  | "flight-delay"
  | "baggage"
  | "rental-car"
  | "hotel-burglary"
  | "mobile-device"
  | "purchase-protection"
  | "extended-warranty";

export interface InsuranceCoverage {
  kind: InsuranceKind;
  /** The limit in a few words, e.g. "$2M, 15 days (under 65)". */
  coverage: string;
}

/** A change the issuer has announced that has not taken effect yet. */
export interface UpcomingChange {
  /** ISO date (YYYY-MM-DD) the change takes effect. */
  effective: string;
  description: string;
}

export interface CardSource {
  label: string;
  url: string;
}

/** Colours for the drawn card face. */
export interface CardArtColors {
  from: string;
  to: string;
  ink: "light" | "dark";
}

export interface Card {
  id: string;
  displayName: string;
  shortName?: string;
  rewardValueProfileId: RewardValueProfileId;
  network: Network;
  issuer: string;
  rewardCurrency?: string;
  income?: IncomeRequirement;
  rewardType: RewardType;
  annualFee: number;
  /** Leave out when the issuer states none (on a free card it hardly matters). */
  additionalCardFee?: number;
  fxPolicy: FxPolicy;
  redemption?: RedemptionFlexibility;
  welcomeOffer?: WelcomeOffer;
  earnRates: EarnRate[];
  /**
   * Set by `withFirstYearMatch` on a copy whose rates already include the match.
   * Never set it in the data.
   */
  appliedMatch?: FirstYearMatch;
  lounges?: LoungeBenefit[];
  caps?: string[];
  specificBrands?: EarnRate[];
  keyBenefits?: string[];
  insurance?: InsuranceCoverage[];
  /** One-sentence answer to "who is this card for?" */
  summary: string;
  pros: string[];
  cons: string[];
  upcomingChanges?: UpcomingChange[];
  notes?: string;
  art?: CardArtColors;
  /** Official issuer page the data was fact-checked against. */
  sourceUrl?: string;
  /** Other pages used to check the data (guides, program terms, threads). */
  sources?: CardSource[];
  /** ISO date (YYYY-MM-DD) the record was last checked against its sources. */
  verifiedOn: string;
}
