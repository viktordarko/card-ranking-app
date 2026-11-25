import { describe, expect, it } from "vitest";
import { CARDS } from "../data/cards";
import {
  type FilterAction,
  type FilterState,
  filterReducer,
  fromSearchParams,
  getVisibleCards,
  initFilterState,
  matchesFilters,
  toSearchParams,
} from "./comparisonFilters";

const firstCardId = CARDS[0]?.id ?? "";
const secondCardId = CARDS[1]?.id ?? "";

const idsIn = (state: FilterState): string[] =>
  getVisibleCards(CARDS, state).map((card) => card.id);

const reduce = (...actions: FilterAction[]): FilterState =>
  actions.reduce(filterReducer, initFilterState());

describe("filterReducer", () => {
  it("starts on the browse view with nothing picked and no filters", () => {
    const state = initFilterState();
    expect(state.view).toBe("browse");
    expect(state.sort).toBe("featured");
    expect(state.pickedIds.size).toBe(0);
    expect(CARDS.every((card) => matchesFilters(card, state))).toBe(true);
  });

  it("toggleCard adds then removes a card without mutating the previous state", () => {
    const initial = initFilterState();
    const added = filterReducer(initial, { type: "toggleCard", id: firstCardId });
    expect(added.pickedIds.has(firstCardId)).toBe(true);
    // The reducer must be pure — the previous state's Set is left untouched.
    expect(initial.pickedIds.has(firstCardId)).toBe(false);
    const removed = filterReducer(added, { type: "toggleCard", id: firstCardId });
    expect(removed.pickedIds.has(firstCardId)).toBe(false);
  });

  it("toggleNetwork adds and removes a network", () => {
    const added = reduce({ type: "toggleNetwork", network: "VISA", checked: true });
    expect(added.selectedNetworks).toContain("VISA");
    const removed = filterReducer(added, {
      type: "toggleNetwork",
      network: "VISA",
      checked: false,
    });
    expect(removed.selectedNetworks).not.toContain("VISA");
  });

  it("resetFilters clears every filter but keeps the view, sort, and picks", () => {
    const state = reduce(
      { type: "setView", view: "compare" },
      { type: "setSort", sort: "fee" },
      { type: "toggleCard", id: firstCardId },
      { type: "toggleNetwork", network: "AMEX", checked: true },
      { type: "setRewardType", value: "CASHBACK" },
      { type: "setNoAnnualFee", value: true },
      { type: "setNoFxFee", value: true },
      { type: "setLoungeAccess", value: true },
    );

    const reset = filterReducer(state, { type: "resetFilters" });
    expect(CARDS.some((card) => matchesFilters(card, state))).toBe(false);
    expect(CARDS.every((card) => matchesFilters(card, reset))).toBe(true);
    expect(reset.view).toBe("compare");
    expect(reset.sort).toBe("fee");
    expect(reset.pickedIds).toBe(state.pickedIds);
  });
});

describe("getVisibleCards", () => {
  it("compares every card until some are picked, then only those", () => {
    const comparing = reduce({ type: "setView", view: "compare" });
    expect(idsIn(comparing)).toHaveLength(CARDS.length);

    const picked = filterReducer(comparing, { type: "toggleCard", id: secondCardId });
    expect(idsIn(picked)).toEqual([secondCardId]);

    const cleared = filterReducer(picked, { type: "clearCards" });
    expect(idsIn(cleared)).toHaveLength(CARDS.length);
  });

  it("keeps showing every card while browsing, whatever is picked", () => {
    const state = reduce({ type: "toggleCard", id: firstCardId });
    expect(idsIn(state)).toHaveLength(CARDS.length);
  });

  it("never lets a filter empty a comparison of picked cards", () => {
    // Pick a Mastercard while browsing, filter to Visa, then press Compare.
    const state = reduce(
      { type: "toggleCard", id: "rogers-world-elite" },
      { type: "toggleNetwork", network: "VISA", checked: true },
    );
    expect(idsIn(state)).not.toContain("rogers-world-elite");
    expect(idsIn(filterReducer(state, { type: "setView", view: "compare" }))).toEqual([
      "rogers-world-elite",
    ]);
  });
});

describe("matchesFilters", () => {
  // [filter, a card it keeps, a card it drops]: both sides, so a filter that
  // lets everything through (or nothing) fails.
  const cases: [string, FilterAction, string, string][] = [
    [
      "network",
      { type: "toggleNetwork", network: "VISA", checked: true },
      "td-aeroplan-vi",
      "rogers-world-elite",
    ],
    ["reward type", { type: "setRewardType", value: "MR" }, "amex-platinum-ca", "scotia-gold-amex"],
    ["no annual fee", { type: "setNoAnnualFee", value: true }, "triangle-mastercard", "td-aeroplan-vi"],
    [
      "no FX fee",
      { type: "setNoFxFee", value: true },
      "capital-one-quicksilver-we",
      "rogers-world-elite",
    ],
    ["lounge access", { type: "setLoungeAccess", value: true }, "amex-platinum-ca", "td-aeroplan-vi"],
  ];

  it.each(cases)("filters by %s", (_name, action, kept, dropped) => {
    const ids = idsIn(reduce(action));
    expect(ids).toContain(kept);
    expect(ids).not.toContain(dropped);
  });

  it("can leave one facet out, so its own options keep meaningful counts", () => {
    const state = reduce({ type: "toggleNetwork", network: "AMEX", checked: true });
    const visa = CARDS.find((card) => card.network === "VISA");
    expect(visa && matchesFilters(visa, state)).toBe(false);
    expect(visa && matchesFilters(visa, state, "network")).toBe(true);
  });
});

describe("URL state", () => {
  it("keeps the default state out of the URL", () => {
    expect(toSearchParams(initFilterState())).toBe("");
  });

  it("round-trips the view, sort, picks, and every filter", () => {
    const state = reduce(
      { type: "setView", view: "compare" },
      { type: "setSort", sort: "earn:groceries" },
      { type: "toggleCard", id: firstCardId },
      { type: "toggleCard", id: secondCardId },
      { type: "toggleNetwork", network: "AMEX", checked: true },
      { type: "setRewardType", value: "POINTS" },
      { type: "setNoAnnualFee", value: true },
      { type: "setNoFxFee", value: true },
      { type: "setLoungeAccess", value: true },
    );

    expect(fromSearchParams(toSearchParams(state), CARDS)).toEqual({ ...state, hydrated: true });
  });

  it("drops anything it doesn't recognise, so an old link still works", () => {
    const state = fromSearchParams(
      `?view=grid&sort=nope&cards=retired-card,${firstCardId}&network=DINERS&reward=MILES`,
      CARDS,
    );
    expect(state).toEqual({
      ...initFilterState(),
      pickedIds: new Set([firstCardId]),
      hydrated: true,
    });
  });
});

describe("first-year match toggle", () => {
  it("round-trips through the URL and survives a filter reset", () => {
    const on = reduce({ type: "setFirstYear", value: true }, { type: "resetFilters" });
    expect(toSearchParams(on)).toBe("firstYear=1");
    expect(fromSearchParams("firstYear=1", CARDS).firstYear).toBe(true);
    expect(fromSearchParams("", CARDS).firstYear).toBe(false);
  });
});

describe("Rogers customer toggle", () => {
  it("is on by default and only writes the URL when off", () => {
    expect(initFilterState().rogersCustomer).toBe(true);
    expect(fromSearchParams("", CARDS).rogersCustomer).toBe(true);
    const off = reduce({ type: "setRogersCustomer", value: false }, { type: "resetFilters" });
    expect(toSearchParams(off)).toBe("rogers=0");
    expect(fromSearchParams("rogers=0", CARDS).rogersCustomer).toBe(false);
  });
});
