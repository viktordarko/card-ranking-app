export type RewardValueProfileId =
  | "MR_AMEX"
  | "AEROPLAN"
  | "SCENE_PLUS"
  | "CASHBACK_STANDARD"
  | "CASHBACK_CONDITIONAL";

export interface RewardValueProfile {
  id: RewardValueProfileId;
  label: string;
  centsPerPointOrPercentUnit: number;
  notes?: string;
}
