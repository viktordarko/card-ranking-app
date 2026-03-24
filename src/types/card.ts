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
}

export interface LoungeBenefit {
  program: string;
  freeVisitsPerYear: number | "UNLIMITED";
}

export interface Card {
  id: string;
  displayName: string;
  shortName?: string;
  rewardValueProfileId: RewardValueProfileId;
  network: Network;
  issuer: string;
  rewardCurrency?: string;
  cardType?: string;
  minimumIncome?: string;
  rewardType: RewardType;
  annualFee: number;
  additionalCardFee?: number;
  fxPolicy: FxPolicy;
  earnRates: EarnRate[];
  lounges?: LoungeBenefit[];
  caps?: string[];
  specificBrands?: EarnRate[];
  keyBenefits?: string[];
  notes?: string;
}
