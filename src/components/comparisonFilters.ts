import type { Card, Network, RewardType } from "../types/card";

/**
 * The comparison view's selection + filter state, modelled as one cohesive unit.
 * `ComparisonMatrix` drives this via `useReducer`, so every transition lives here
 * as a named intent (and stays a pure, testable function — no React imports).
 */
export interface FilterState {
  selectedIds: Set<string>;
  selectedNetworks: Network[];
  selectedRewardType: RewardType | "ALL";
  requireNoFxFee: boolean;
  requireLoungeAccess: boolean;
}

export type FilterAction =
  | { type: "toggleCard"; id: string }
  | { type: "selectAllCards"; ids: string[] }
  | { type: "clearCards" }
  | { type: "toggleNetwork"; network: Network; checked: boolean }
  | { type: "setRewardType"; value: RewardType | "ALL" }
  | { type: "setNoFxFee"; value: boolean }
  | { type: "setLoungeAccess"; value: boolean }
  | { type: "resetFilters" };

/** All cards selected, no filters — the initial (and post-"reset") baseline. */
export const initFilterState = (cards: Card[]): FilterState => ({
  selectedIds: new Set(cards.map((card) => card.id)),
  selectedNetworks: [],
  selectedRewardType: "ALL",
  requireNoFxFee: false,
  requireLoungeAccess: false,
});

export const filterReducer = (state: FilterState, action: FilterAction): FilterState => {
  switch (action.type) {
    case "toggleCard": {
      const selectedIds = new Set(state.selectedIds);
      if (selectedIds.has(action.id)) {
        selectedIds.delete(action.id);
      } else {
        selectedIds.add(action.id);
      }
      return { ...state, selectedIds };
    }
    case "selectAllCards":
      return { ...state, selectedIds: new Set(action.ids) };
    case "clearCards":
      return { ...state, selectedIds: new Set() };
    case "toggleNetwork":
      return {
        ...state,
        selectedNetworks: action.checked
          ? [...state.selectedNetworks, action.network]
          : state.selectedNetworks.filter((network) => network !== action.network),
      };
    case "setRewardType":
      return { ...state, selectedRewardType: action.value };
    case "setNoFxFee":
      return { ...state, requireNoFxFee: action.value };
    case "setLoungeAccess":
      return { ...state, requireLoungeAccess: action.value };
    case "resetFilters":
      return {
        ...state,
        selectedNetworks: [],
        selectedRewardType: "ALL",
        requireNoFxFee: false,
        requireLoungeAccess: false,
      };
  }
};
