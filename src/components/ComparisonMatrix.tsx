"use client";

import { useMemo, useReducer } from "react";
import { COMPARISON_ROWS, computeRowWinners, computeRowWorst } from "../lib/cardComparison";
import type { Card, Network, RewardType } from "../types/card";
import ActiveFilters, { type ActiveFilter } from "./ActiveFilters";
import CardPicker from "./CardPicker";
import { filterReducer, initFilterState } from "./comparisonFilters";
import FilterBar, { type RewardOption } from "./FilterBar";
import MatrixTable from "./MatrixTable";
import styles from "./ComparisonMatrix.module.css";

interface ComparisonMatrixProps {
  cards: Card[];
}

// Parallel to COMPARISON_ROWS; used when there is nothing to rank against.
const EMPTY_ROW_SETS: Set<string>[] = COMPARISON_ROWS.map(() => new Set<string>());

const REWARD_OPTIONS: RewardOption[] = [
  { value: "ALL", label: "All reward types" },
  { value: "MR", label: "Membership Rewards" },
  { value: "CASHBACK", label: "Cashback" },
  { value: "POINTS", label: "Points" },
];

const ComparisonMatrix = ({ cards }: ComparisonMatrixProps) => {
  const [filters, dispatch] = useReducer(filterReducer, cards, initFilterState);
  const { selectedIds, selectedNetworks, selectedRewardType, requireNoFxFee, requireLoungeAccess } =
    filters;

  const networks = useMemo(() => Array.from(new Set(cards.map((card) => card.network))), [cards]);

  const toggleNetwork = (network: Network, checked: boolean) =>
    dispatch({ type: "toggleNetwork", network, checked });

  const noneSelected = selectedIds.size === 0;

  const filteredCards = useMemo(
    () =>
      cards.filter((card) => {
        if (!selectedIds.has(card.id)) {
          return false;
        }
        if (selectedNetworks.length > 0 && !selectedNetworks.includes(card.network)) {
          return false;
        }
        if (selectedRewardType !== "ALL" && card.rewardType !== selectedRewardType) {
          return false;
        }
        if (requireNoFxFee && card.fxPolicy.hasFxFee) {
          return false;
        }
        if (requireLoungeAccess && !card.lounges?.length) {
          return false;
        }
        return true;
      }),
    [cards, selectedIds, selectedNetworks, selectedRewardType, requireNoFxFee, requireLoungeAccess],
  );

  // Faceted availability: for each filter option, how many *picked* cards would
  // remain if it were applied on top of every OTHER active filter (the option's
  // own facet is excluded so you can still switch within it). An option that
  // would leave zero cards is disabled, so a filter can never empty the table.
  const facet = useMemo(() => {
    const picked = cards.filter((card) => selectedIds.has(card.id));
    const byNetwork = (card: Card) =>
      selectedNetworks.length === 0 || selectedNetworks.includes(card.network);
    const byReward = (card: Card) =>
      selectedRewardType === "ALL" || card.rewardType === selectedRewardType;
    const byNoFx = (card: Card) => !requireNoFxFee || !card.fxPolicy.hasFxFee;
    const byLounge = (card: Card) => !requireLoungeAccess || Boolean(card.lounges?.length);

    const networkCounts = new Map<Network, number>();
    for (const network of networks) {
      networkCounts.set(
        network,
        picked.filter(
          (card) => card.network === network && byReward(card) && byNoFx(card) && byLounge(card),
        ).length,
      );
    }

    const rewardCounts = {} as Record<RewardType | "ALL", number>;
    for (const option of REWARD_OPTIONS) {
      rewardCounts[option.value] = picked.filter(
        (card) =>
          (option.value === "ALL" || card.rewardType === option.value) &&
          byNetwork(card) &&
          byNoFx(card) &&
          byLounge(card),
      ).length;
    }

    const noFxCount = picked.filter(
      (card) => !card.fxPolicy.hasFxFee && byNetwork(card) && byReward(card) && byLounge(card),
    ).length;
    const loungeCount = picked.filter(
      (card) => Boolean(card.lounges?.length) && byNetwork(card) && byReward(card) && byNoFx(card),
    ).length;

    return { networkCounts, rewardCounts, noFxCount, loungeCount };
  }, [
    cards,
    networks,
    selectedIds,
    selectedNetworks,
    selectedRewardType,
    requireNoFxFee,
    requireLoungeAccess,
  ]);

  // The applied filters, as removable summary tags (the picker is excluded — it
  // has its own "Clear").
  const activeFilters: ActiveFilter[] = [
    ...selectedNetworks.map((network) => ({
      key: `network-${network}`,
      label: network,
      onRemove: () => toggleNetwork(network, false),
    })),
    ...(selectedRewardType !== "ALL"
      ? [
          {
            key: "reward",
            label:
              REWARD_OPTIONS.find((option) => option.value === selectedRewardType)?.label ??
              "Reward",
            onRemove: () => dispatch({ type: "setRewardType", value: "ALL" }),
          },
        ]
      : []),
    ...(requireNoFxFee
      ? [
          {
            key: "no-fx",
            label: "No FX fee",
            onRemove: () => dispatch({ type: "setNoFxFee", value: false }),
          },
        ]
      : []),
    ...(requireLoungeAccess
      ? [
          {
            key: "lounge",
            label: "Lounge access",
            onRemove: () => dispatch({ type: "setLoungeAccess", value: false }),
          },
        ]
      : []),
  ];

  // Best/worst is only meaningful when comparing two or more cards.
  const rowWinners = useMemo(
    () => (filteredCards.length > 1 ? computeRowWinners(filteredCards) : EMPTY_ROW_SETS),
    [filteredCards],
  );
  const rowWorst = useMemo(
    () => (filteredCards.length > 1 ? computeRowWorst(filteredCards) : EMPTY_ROW_SETS),
    [filteredCards],
  );

  return (
    <>
      <section className={styles.controls} aria-label="Choose and filter cards">
        <CardPicker
          cards={cards}
          selectedIds={selectedIds}
          onToggle={(id) => dispatch({ type: "toggleCard", id })}
          onSelectAll={() =>
            dispatch({ type: "selectAllCards", ids: cards.map((card) => card.id) })
          }
          onClear={() => dispatch({ type: "clearCards" })}
        />
        <FilterBar
          networks={networks}
          networkCounts={facet.networkCounts}
          selectedNetworks={selectedNetworks}
          onToggleNetwork={toggleNetwork}
          rewardOptions={REWARD_OPTIONS}
          rewardCounts={facet.rewardCounts}
          selectedRewardType={selectedRewardType}
          onRewardChange={(value) => dispatch({ type: "setRewardType", value })}
          noFxCount={facet.noFxCount}
          requireNoFxFee={requireNoFxFee}
          onNoFxChange={(value) => dispatch({ type: "setNoFxFee", value })}
          loungeCount={facet.loungeCount}
          requireLoungeAccess={requireLoungeAccess}
          onLoungeChange={(value) => dispatch({ type: "setLoungeAccess", value })}
        />
      </section>

      {selectedIds.size > 0 && (
        <p className={styles.resultCount}>
          Showing {filteredCards.length} of {selectedIds.size} selected
        </p>
      )}

      <ActiveFilters filters={activeFilters} onReset={() => dispatch({ type: "resetFilters" })} />

      {filteredCards.length > 0 ? (
        <MatrixTable cards={filteredCards} rowWinners={rowWinners} rowWorst={rowWorst} />
      ) : (
        <p className={styles.emptyState}>
          {noneSelected
            ? "Pick at least one card above to start comparing."
            : "No selected cards match the current filters."}
        </p>
      )}

      <p className={styles.footnote}>
        Cells show each card&apos;s actual earn rate (&times; for points, % for cash back). Green
        marks the best value in each numeric row and red the weakest; ties share the highlight, and
        for fees lower is better. Ranking is by estimated cash value — Amex MR and Aeroplan at
        2&cent;/point, Scene+ at 1&cent;, cash back at 1&cent; (Rogers 1.5&cent; when redeemed
        toward Rogers/Fido/Shaw bills). The Redemption row rates how flexibly each reward can be
        used — a tiebreaker that is separate from how much it is worth.
      </p>
    </>
  );
};

export default ComparisonMatrix;
