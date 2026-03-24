import type { RewardValueProfile } from "../types/rewardValue";

export const REWARD_VALUE_PROFILES: RewardValueProfile[] = [
  {
    id: "MR_AMEX",
    label: "Amex Membership Rewards",
    centsPerPointOrPercentUnit: 2.0,
    notes: "Base valuation, could be up to 10; flexible transfer options.",
  },
  {
    id: "AEROPLAN",
    label: "Aeroplan",
    centsPerPointOrPercentUnit: 2.0,
    notes: "Base valuation, could be up to 10.",
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
    notes: "Optimistic mode assumes redemption boost can be realized.",
  },
  {
    id: "CASHBACK_STANDARD",
    label: "Standard cashback",
    centsPerPointOrPercentUnit: 1.0,
  },
  {
    id: "CASHBACK_CONDITIONAL",
    label: "Conditional cashback",
    centsPerPointOrPercentUnit: 1.0,
    notes: "Discounted for constrained redemption utility.",
  },
];
