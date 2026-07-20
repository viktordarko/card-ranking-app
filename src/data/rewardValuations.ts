import type { RewardValueProfile } from "../types/rewardValue";

export const REWARD_VALUE_PROFILES: RewardValueProfile[] = [
  {
    id: "MR_AMEX",
    label: "Amex Membership Rewards",
    centsPerPointOrPercentUnit: 2.0,
    notes:
      "Valued at par with Aeroplan, never below it: MR transfers 1:1 to Aeroplan, so every Aeroplan redemption is reachable from MR — and MR keeps other transfer partners and non-travel options on top. Optimal transfers can push value well above 2¢ (up to ~10¢).",
  },
  {
    id: "AEROPLAN",
    label: "Aeroplan",
    centsPerPointOrPercentUnit: 2.0,
    notes:
      "Base valuation; flight redemptions (especially premium cabins) can push value well above 2¢ (up to ~10¢).",
  },
  {
    id: "SCENE_PLUS",
    label: "Scene+",
    centsPerPointOrPercentUnit: 1.0,
  },
  {
    id: "CASHBACK_ROGERS_BOOSTED",
    label: "Cashback with Rogers/Fido redemption boost",
    centsPerPointOrPercentUnit: 1.5,
    notes:
      "Optimistic: assumes you are a Rogers/Fido/Shaw customer and redeem toward those bills, which unlocks the 1.5x boost. Without it, the value is ~1.0.",
  },
  {
    id: "CASHBACK_STANDARD",
    label: "Standard cashback",
    centsPerPointOrPercentUnit: 1.0,
  },
  {
    id: "CASHBACK_CONDITIONAL",
    label: "Canadian Tire Money",
    centsPerPointOrPercentUnit: 1.0,
    notes:
      "CT Money is worth 1:1 (1.0), same as cash back. Its downside is redemption, not value: it can only be spent at Canadian Tire family stores. That limitation is modelled separately as redemption flexibility, not as a lower point value.",
  },
];
