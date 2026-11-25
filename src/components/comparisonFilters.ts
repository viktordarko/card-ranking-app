import { isSortKey, type SortKey } from "../lib/cardSorting";
import type { Card, Network, RewardType } from "../types/card";

export type ExplorerView = "browse" | "compare";

/** The independent ways to narrow the list; each one is a facet with counts. */
const FACETS = ["network", "reward", "noAnnualFee", "noFxFee", "lounge"] as const;
export type Facet = (typeof FACETS)[number];

/**
 * The explorer's view, selection, and filters, modelled as one cohesive unit.
 * `CardExplorer` drives this via `useReducer`, so every transition lives here as
 * a named intent (and stays a pure, testable function — no React imports).
 */
export interface FilterState {
  view: ExplorerView;
  sort: SortKey;
  /** Show and rank earn rates with any first-year match included. */
  firstYear: boolean;
  /** Rank Rogers at its Rogers, Fido, and Shaw customer rate. */
  rogersCustomer: boolean;
  /** Cards picked for the comparison. Empty means "no pick": compare them all. */
  pickedIds: Set<string>;
  selectedNetworks: Network[];
  selectedRewardType: RewardType | "ALL";
  requireNoAnnualFee: boolean;
  requireNoFxFee: boolean;
  requireLoungeAccess: boolean;
  /** False until the URL has been read, so it is never overwritten first. */
  hydrated: boolean;
}

export type FilterAction =
  | { type: "hydrate"; search: string; cards: Card[] }
  | { type: "setView"; view: ExplorerView }
  | { type: "setSort"; sort: SortKey }
  | { type: "setFirstYear"; value: boolean }
  | { type: "setRogersCustomer"; value: boolean }
  | { type: "toggleCard"; id: string }
  | { type: "clearCards" }
  | { type: "toggleNetwork"; network: Network; checked: boolean }
  | { type: "setRewardType"; value: RewardType | "ALL" }
  | { type: "setNoAnnualFee"; value: boolean }
  | { type: "setNoFxFee"; value: boolean }
  | { type: "setLoungeAccess"; value: boolean }
  | { type: "resetFilters" };

const NO_FILTERS = {
  selectedNetworks: [] as Network[],
  selectedRewardType: "ALL" as const,
  requireNoAnnualFee: false,
  requireNoFxFee: false,
  requireLoungeAccess: false,
};

export const initFilterState = (): FilterState => ({
  view: "browse",
  sort: "featured",
  firstYear: false,
  rogersCustomer: true,
  pickedIds: new Set(),
  ...NO_FILTERS,
  hydrated: false,
});

/** Serializes everything worth sharing or restoring; defaults are left out. */
export const toSearchParams = (state: FilterState): string => {
  const params = new URLSearchParams();

  if (state.view !== "browse") params.set("view", state.view);
  if (state.sort !== "featured") params.set("sort", state.sort);
  if (state.firstYear) params.set("firstYear", "1");
  if (!state.rogersCustomer) params.set("rogers", "0");
  if (state.pickedIds.size > 0) params.set("cards", [...state.pickedIds].join(","));
  if (state.selectedNetworks.length > 0) params.set("network", state.selectedNetworks.join(","));
  if (state.selectedRewardType !== "ALL") params.set("reward", state.selectedRewardType);
  if (state.requireNoAnnualFee) params.set("noFee", "1");
  if (state.requireNoFxFee) params.set("noFx", "1");
  if (state.requireLoungeAccess) params.set("lounge", "1");

  // Commas are legal in a query string; keep shared links readable.
  return params.toString().replaceAll("%2C", ",").replaceAll("%3A", ":");
};

/**
 * Reads a query string back into state. Anything unknown (a removed card, a
 * typo'd network) is dropped, so an old link degrades instead of breaking.
 */
export const fromSearchParams = (search: string, cards: Card[]): FilterState => {
  const params = new URLSearchParams(search);
  const list = (key: string): string[] => params.get(key)?.split(",") ?? [];
  const cardIds = new Set(cards.map((card) => card.id));
  const sort = params.get("sort") ?? "";
  const reward = params.get("reward");

  return {
    view: params.get("view") === "compare" ? "compare" : "browse",
    sort: isSortKey(sort) ? sort : "featured",
    firstYear: params.get("firstYear") === "1",
    rogersCustomer: params.get("rogers") !== "0",
    pickedIds: new Set(list("cards").filter((id) => cardIds.has(id))),
    selectedNetworks: Array.from(new Set(cards.map((card) => card.network))).filter((network) =>
      list("network").includes(network),
    ),
    selectedRewardType: cards.find((card) => card.rewardType === reward)?.rewardType ?? "ALL",
    requireNoAnnualFee: params.get("noFee") === "1",
    requireNoFxFee: params.get("noFx") === "1",
    requireLoungeAccess: params.get("lounge") === "1",
    hydrated: true,
  };
};

/**
 * Whether a card passes the active filters. `except` leaves one facet out, which
 * is how an option's live count is computed: "how many cards would remain if
 * this were applied on top of every *other* filter".
 */
export const matchesFilters = (card: Card, state: FilterState, except?: Facet): boolean => {
  const passes: Record<Facet, boolean> = {
    network: state.selectedNetworks.length === 0 || state.selectedNetworks.includes(card.network),
    reward: state.selectedRewardType === "ALL" || state.selectedRewardType === card.rewardType,
    noAnnualFee: !state.requireNoAnnualFee || card.annualFee === 0,
    noFxFee: !state.requireNoFxFee || !card.fxPolicy.hasFxFee,
    lounge: !state.requireLoungeAccess || Boolean(card.lounges?.length),
  };

  return FACETS.every((facet) => facet === except || passes[facet]);
};

/** Comparing hand-picked cards, as opposed to whatever the filters leave. */
export const isComparingPicks = (state: FilterState): boolean =>
  state.view === "compare" && state.pickedIds.size > 0;

/**
 * The cards on screen. A pick is explicit, so it wins over the filters: a filter
 * set while browsing must never empty a comparison someone put together by hand.
 */
export const getVisibleCards = (cards: Card[], state: FilterState): Card[] =>
  cards.filter((card) =>
    isComparingPicks(state) ? state.pickedIds.has(card.id) : matchesFilters(card, state),
  );

export const filterReducer = (state: FilterState, action: FilterAction): FilterState => {
  switch (action.type) {
    case "hydrate":
      return fromSearchParams(action.search, action.cards);
    case "setView":
      return { ...state, view: action.view };
    case "setSort":
      return { ...state, sort: action.sort };
    case "setFirstYear":
      return { ...state, firstYear: action.value };
    case "setRogersCustomer":
      return { ...state, rogersCustomer: action.value };
    case "toggleCard": {
      const pickedIds = new Set(state.pickedIds);
      if (pickedIds.has(action.id)) {
        pickedIds.delete(action.id);
      } else {
        pickedIds.add(action.id);
      }
      return { ...state, pickedIds };
    }
    case "clearCards":
      return { ...state, pickedIds: new Set() };
    case "toggleNetwork":
      return {
        ...state,
        selectedNetworks: action.checked
          ? [...state.selectedNetworks, action.network]
          : state.selectedNetworks.filter((network) => network !== action.network),
      };
    case "setRewardType":
      return { ...state, selectedRewardType: action.value };
    case "setNoAnnualFee":
      return { ...state, requireNoAnnualFee: action.value };
    case "setNoFxFee":
      return { ...state, requireNoFxFee: action.value };
    case "setLoungeAccess":
      return { ...state, requireLoungeAccess: action.value };
    case "resetFilters":
      return { ...state, ...NO_FILTERS };
  }
};
