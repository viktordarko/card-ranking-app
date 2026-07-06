import { describe, expect, it } from "vitest";
import { CARDS } from "../data/cards";
import { filterReducer, initFilterState } from "./comparisonFilters";

const firstCardId = CARDS[0]?.id ?? "";

describe("filterReducer", () => {
  it("starts with every card selected and no filters", () => {
    const state = initFilterState(CARDS);
    expect(state.selectedIds.size).toBe(CARDS.length);
    expect(state.selectedNetworks).toEqual([]);
    expect(state.selectedRewardType).toBe("ALL");
    expect(state.requireNoFxFee).toBe(false);
    expect(state.requireLoungeAccess).toBe(false);
  });

  it("toggleCard removes then re-adds a card without mutating the previous state", () => {
    const initial = initFilterState(CARDS);
    const removed = filterReducer(initial, { type: "toggleCard", id: firstCardId });
    expect(removed.selectedIds.has(firstCardId)).toBe(false);
    // The reducer must be pure — the previous state's Set is left untouched.
    expect(initial.selectedIds.has(firstCardId)).toBe(true);
    const readded = filterReducer(removed, { type: "toggleCard", id: firstCardId });
    expect(readded.selectedIds.has(firstCardId)).toBe(true);
  });

  it("toggleNetwork adds and removes a network", () => {
    const added = filterReducer(initFilterState(CARDS), {
      type: "toggleNetwork",
      network: "VISA",
      checked: true,
    });
    expect(added.selectedNetworks).toContain("VISA");
    const removed = filterReducer(added, {
      type: "toggleNetwork",
      network: "VISA",
      checked: false,
    });
    expect(removed.selectedNetworks).not.toContain("VISA");
  });

  it("resetFilters clears every filter but keeps the card selection", () => {
    let state = initFilterState(CARDS);
    state = filterReducer(state, { type: "toggleCard", id: firstCardId }); // deselect one card
    state = filterReducer(state, { type: "toggleNetwork", network: "AMEX", checked: true });
    state = filterReducer(state, { type: "setRewardType", value: "CASHBACK" });
    state = filterReducer(state, { type: "setNoFxFee", value: true });
    state = filterReducer(state, { type: "setLoungeAccess", value: true });

    const reset = filterReducer(state, { type: "resetFilters" });
    expect(reset.selectedNetworks).toEqual([]);
    expect(reset.selectedRewardType).toBe("ALL");
    expect(reset.requireNoFxFee).toBe(false);
    expect(reset.requireLoungeAccess).toBe(false);
    // Reset is a *filter* action — the picker's selection is deliberately left alone.
    expect(reset.selectedIds).toBe(state.selectedIds);
    expect(reset.selectedIds.size).toBe(CARDS.length - 1);
  });

  it("clearCards empties the selection; selectAllCards restores it", () => {
    const cleared = filterReducer(initFilterState(CARDS), { type: "clearCards" });
    expect(cleared.selectedIds.size).toBe(0);
    const all = filterReducer(cleared, {
      type: "selectAllCards",
      ids: CARDS.map((card) => card.id),
    });
    expect(all.selectedIds.size).toBe(CARDS.length);
  });
});
