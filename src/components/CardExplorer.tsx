"use client";

import { Suspense, useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { COMPARISON_ROWS, computeRowWinners, computeRowWorst } from "../lib/cardComparison";
import { formatNetwork, formatRewardType } from "../lib/cardFormatting";
import { getBestForCategories } from "../lib/cardHighlights";
import { EARN_SORT_OPTIONS, GENERAL_SORT_OPTIONS, isSortKey, sortCards } from "../lib/cardSorting";
import { hasCustomerRates, withRogersCustomer } from "../lib/rogersCustomer";
import { withCurrentOffer, withFirstYearMatch } from "../lib/welcomeOffer";
import type { Card, Network, RewardType } from "../types/card";
import ActiveFilters, { type ActiveFilter } from "./ActiveFilters";
import CardPicker from "./CardPicker";
import CardTile from "./CardTile";
import CompareTray from "./CompareTray";
import {
  type ExplorerView,
  type Facet,
  filterReducer,
  getVisibleCards,
  initFilterState,
  isComparingPicks,
  matchesFilters,
  toSearchParams,
} from "./comparisonFilters";
import { rememberExplorerSearch } from "./explorerMemory";
import FilterBar, { type RewardOption } from "./FilterBar";
import MatrixTable from "./MatrixTable";
import UrlWatcher from "./UrlWatcher";
import { useToday } from "./useToday";
import styles from "./CardExplorer.module.css";

interface CardExplorerProps {
  cards: Card[];
}

// Parallel to COMPARISON_ROWS; used when there is nothing to rank against.
const EMPTY_ROW_SETS: Set<string>[] = COMPARISON_ROWS.map(() => new Set<string>());

const REWARD_TYPES: RewardType[] = ["MR", "CASHBACK", "POINTS"];

const REWARD_OPTIONS: RewardOption[] = [
  { value: "ALL", label: "All reward types" },
  ...REWARD_TYPES.map((value) => ({ value, label: formatRewardType(value) })),
];

const VIEWS: { value: ExplorerView; label: string }[] = [
  { value: "browse", label: "Browse cards" },
  { value: "compare", label: "Compare side by side" },
];

const CardExplorer = ({ cards: allCards }: CardExplorerProps) => {
  const [state, dispatch] = useReducer(filterReducer, undefined, initFilterState);
  const isComparing = state.view === "compare";
  const comparingPicks = isComparingPicks(state);
  const resultsRef = useRef<HTMLParagraphElement>(null);

  // The page can be older than an offer's end date; drop the ones that are over.
  const today = useToday();
  const currentCards = useMemo(
    () => (today ? allCards.map((card) => withCurrentOffer(card, today)) : allCards),
    [allCards, today],
  );

  // Applied before anything ranks, so cells, highlights, sorting, and badges agree.
  const cards = useMemo(
    () =>
      currentCards.map((card) => {
        const own = withRogersCustomer(card, state.rogersCustomer);
        return state.firstYear ? withFirstYearMatch(own) : own;
      }),
    [currentCards, state.firstYear, state.rogersCustomer],
  );
  const hasCustomerOption = currentCards.some(hasCustomerRates);
  const hasMatch = currentCards.some((card) => card.welcomeOffer?.firstYearMatch);

  // The view, picks, and filters live in the URL, so a comparison can be shared
  // and survives a trip to a detail page and back. The page itself is static: it
  // prerenders the default view, then adopts the URL's state once mounted — and
  // again whenever something else changes the URL (Back, the header logo). The
  // last query string read or written tells those apart from our own writes.
  const lastSearch = useRef<string | null>(null);

  const adoptUrl = useCallback(() => {
    const search = window.location.search.slice(1);
    if (search !== lastSearch.current) {
      lastSearch.current = search;
      dispatch({ type: "hydrate", search, cards: allCards });
    }
  }, [allCards]);

  useEffect(() => {
    if (!state.hydrated) {
      return;
    }
    const search = toSearchParams(state);
    rememberExplorerSearch(search);
    if (search !== lastSearch.current) {
      lastSearch.current = search;
      const { pathname, hash } = window.location;
      window.history.replaceState(null, "", `${pathname}${search && `?${search}`}${hash}`);
    }
  }, [state]);

  // Removing a control that has focus would drop focus to the top of the page.
  const focusResults = () => resultsRef.current?.focus({ preventScroll: true });

  const networks = useMemo(() => Array.from(new Set(cards.map((card) => card.network))), [cards]);

  // Among the whole portfolio, so a badge never changes meaning with a filter.
  const bestFor = useMemo(() => getBestForCategories(cards), [cards]);

  const visibleCards = useMemo(
    () => sortCards(getVisibleCards(cards, state), state.sort),
    [cards, state],
  );

  // Faceted availability: an option that would leave zero cards is disabled, so
  // a filter can never empty the list.
  const facet = useMemo(() => {
    const countWhere = (except: Facet, test: (card: Card) => boolean) =>
      cards.filter((card) => test(card) && matchesFilters(card, state, except)).length;

    return {
      networkCounts: new Map<Network, number>(
        networks.map((network) => [
          network,
          countWhere("network", (card) => card.network === network),
        ]),
      ),
      rewardCounts: new Map<RewardType | "ALL", number>(
        REWARD_OPTIONS.map(({ value }) => [
          value,
          countWhere("reward", (card) => value === "ALL" || card.rewardType === value),
        ]),
      ),
      noFeeCount: countWhere("noAnnualFee", (card) => card.annualFee === 0),
      noFxCount: countWhere("noFxFee", (card) => !card.fxPolicy.hasFxFee),
      loungeCount: countWhere("lounge", (card) => Boolean(card.lounges?.length)),
    };
  }, [cards, networks, state]);

  // The applied filters, as removable summary tags (the picker is excluded — it
  // has its own "Compare all").
  const activeFilters: ActiveFilter[] = [
    ...state.selectedNetworks.map((network) => ({
      key: `network-${network}`,
      label: formatNetwork(network),
      onRemove: () => dispatch({ type: "toggleNetwork", network, checked: false }),
    })),
    ...(state.selectedRewardType === "ALL"
      ? []
      : [
          {
            key: "reward",
            label: formatRewardType(state.selectedRewardType),
            onRemove: () => dispatch({ type: "setRewardType", value: "ALL" }),
          },
        ]),
    ...(state.requireNoAnnualFee
      ? [
          {
            key: "no-fee",
            label: "No annual fee",
            onRemove: () => dispatch({ type: "setNoAnnualFee", value: false }),
          },
        ]
      : []),
    ...(state.requireNoFxFee
      ? [
          {
            key: "no-fx",
            label: "No FX fee",
            onRemove: () => dispatch({ type: "setNoFxFee", value: false }),
          },
        ]
      : []),
    ...(state.requireLoungeAccess
      ? [
          {
            key: "lounge",
            label: "Lounge access",
            onRemove: () => dispatch({ type: "setLoungeAccess", value: false }),
          },
        ]
      : []),
  ];

  // A best needs two cards; with only two, the other is plainly the weaker one
  // and marking it too would just colour every row twice.
  const rankedCount = isComparing ? visibleCards.length : 0;
  const rowWinners = useMemo(
    () => (rankedCount > 1 ? computeRowWinners(visibleCards) : EMPTY_ROW_SETS),
    [rankedCount, visibleCards],
  );
  const rowWorst = useMemo(
    () => (rankedCount > 2 ? computeRowWorst(visibleCards) : EMPTY_ROW_SETS),
    [rankedCount, visibleCards],
  );

  return (
    <div data-pending={state.hydrated ? undefined : ""}>
      <Suspense fallback={null}>
        <UrlWatcher onChange={adoptUrl} />
      </Suspense>

      <div className={styles.toolbar}>
        <fieldset className={styles.viewToggle}>
          <legend className="srOnly">View</legend>
          {VIEWS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={styles.viewButton}
              aria-pressed={state.view === value}
              onClick={() => dispatch({ type: "setView", view: value })}
            >
              {label}
            </button>
          ))}
        </fieldset>

        <div className={styles.options}>
          {hasCustomerOption && (
            <label className={styles.option}>
              <input
                type="checkbox"
                checked={state.rogersCustomer}
                onChange={(event) =>
                  dispatch({ type: "setRogersCustomer", value: event.target.checked })
                }
              />
              Rogers customer
            </label>
          )}
          {hasMatch && (
            <label
              className={styles.option}
              title="Includes offers that match what a card earns in its first year. Other welcome bonuses stay in their own row."
            >
              <input
                type="checkbox"
                checked={state.firstYear}
                onChange={(event) => dispatch({ type: "setFirstYear", value: event.target.checked })}
              />
              First-year match
            </label>
          )}
        </div>

        <label className={styles.sort}>
          <span>Sort by</span>
          <select
            value={state.sort}
            onChange={(event) => {
              if (isSortKey(event.target.value)) {
                dispatch({ type: "setSort", sort: event.target.value });
              }
            }}
          >
            {GENERAL_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            <optgroup label="Best return on">
              {EARN_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
      </div>

      <section className={styles.controls} aria-label="Choose and filter cards">
        {isComparing && (
          <CardPicker
            cards={cards}
            pickedIds={state.pickedIds}
            onToggle={(id) => dispatch({ type: "toggleCard", id })}
            onClear={() => {
              dispatch({ type: "clearCards" });
              focusResults();
            }}
          />
        )}
        {!comparingPicks && (
          <FilterBar
            networks={networks}
            networkCounts={facet.networkCounts}
            selectedNetworks={state.selectedNetworks}
            onToggleNetwork={(network, checked) =>
              dispatch({ type: "toggleNetwork", network, checked })
            }
            rewardOptions={REWARD_OPTIONS}
            rewardCounts={facet.rewardCounts}
            selectedRewardType={state.selectedRewardType}
            onRewardChange={(value) => dispatch({ type: "setRewardType", value })}
            noFeeCount={facet.noFeeCount}
            requireNoAnnualFee={state.requireNoAnnualFee}
            onNoFeeChange={(value) => dispatch({ type: "setNoAnnualFee", value })}
            noFxCount={facet.noFxCount}
            requireNoFxFee={state.requireNoFxFee}
            onNoFxChange={(value) => dispatch({ type: "setNoFxFee", value })}
            loungeCount={facet.loungeCount}
            requireLoungeAccess={state.requireLoungeAccess}
            onLoungeChange={(value) => dispatch({ type: "setLoungeAccess", value })}
          />
        )}
      </section>

      <p className={styles.resultCount} aria-live="polite" ref={resultsRef} tabIndex={-1}>
        {comparingPicks
          ? `Comparing ${visibleCards.length} picked ${visibleCards.length === 1 ? "card" : "cards"}`
          : `Showing ${visibleCards.length} of ${cards.length} cards`}
        {!isComparing && state.pickedIds.size > 0 && (
          <span className="srOnly">, {state.pickedIds.size} picked to compare</span>
        )}
      </p>

      {!comparingPicks && (
        <ActiveFilters
          filters={activeFilters.map((filter) => ({
            ...filter,
            onRemove: () => {
              filter.onRemove();
              focusResults();
            },
          }))}
          onReset={() => {
            dispatch({ type: "resetFilters" });
            focusResults();
          }}
        />
      )}

      {visibleCards.length === 0 && (
        <p className={styles.emptyState}>No cards match the current filters.</p>
      )}

      {visibleCards.length > 0 && !isComparing && (
        <div className={styles.grid}>
          {visibleCards.map((card) => (
            <CardTile
              key={card.id}
              card={card}
              bestFor={bestFor.get(card.id) ?? []}
              picked={state.pickedIds.has(card.id)}
              onTogglePick={() => dispatch({ type: "toggleCard", id: card.id })}
            />
          ))}
        </div>
      )}

      {visibleCards.length > 0 && isComparing && (
        <MatrixTable cards={visibleCards} rowWinners={rowWinners} rowWorst={rowWorst} />
      )}

      {!isComparing && state.pickedIds.size > 0 && (
        <CompareTray
          cards={cards.filter((card) => state.pickedIds.has(card.id))}
          onRemove={(id) => dispatch({ type: "toggleCard", id })}
          onClear={() => {
            dispatch({ type: "clearCards" });
            focusResults();
          }}
          onCompare={() => {
            dispatch({ type: "setView", view: "compare" });
            focusResults();
            window.scrollTo({ top: 0 });
          }}
        />
      )}

      <p className={styles.footnote}>
        Rates are in each card&apos;s own units (&times; for points, % for cash back), and
        &ldquo;&asymp;&rdquo; is the estimated cash return: Amex MR and Aeroplan at 2&cent; a point,
        Scene+ at 1&cent;, cash back at face value. US-dollar returns are net of the FX fee. The Costco row covers warehouse purchases, which only
        take Mastercard credit cards; Walmart usually pays the base rate. &ldquo;Rogers customer&rdquo; also covers Fido and Shaw
        customers. Green
        marks the best in a row and red the weakest among the cards shown; when two cards return the
        same, a rate that covers the whole category wins, then rewards that are easier to redeem. &ldquo;Best for&rdquo; badges compare
        the {cards.length} cards on this site.
        {state.firstYear &&
          " Rates marked “First-year match” include the issuer’s match, which lasts one year and is paid out at the end of it; other cards show their usual rates."}
      </p>
    </div>
  );
};

export default CardExplorer;
