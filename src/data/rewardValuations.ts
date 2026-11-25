import type { RewardValueProfile } from "../types/rewardValue";

export const REWARD_VALUE_PROFILES: RewardValueProfile[] = [
  {
    id: "MR_AMEX",
    label: "Amex Membership Rewards",
    centsPerPointOrPercentUnit: 2.0,
    notes:
      "Valued at par with Aeroplan, never below it: MR transfers 1:1 to Aeroplan, so every Aeroplan redemption is reachable from MR, and MR can also move to other airlines' programs or be used outside travel. That extra choice counts as redemption flexibility, not as a higher point value.",
  },
  {
    id: "AEROPLAN",
    label: "Aeroplan",
    centsPerPointOrPercentUnit: 2.0,
    notes:
      "A target, not an average: 2¢ is the least worth accepting when redeeming for flights, and it isn't hard to find. Rare premium-cabin awards (such as ANA first class) have reached about 10¢. Some guides value Aeroplan lower, around 1.6¢, by averaging economy redemptions.",
  },
  {
    id: "SCENE_PLUS",
    label: "Scene+",
    centsPerPointOrPercentUnit: 1.0,
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
