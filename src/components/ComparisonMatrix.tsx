"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { COMPARISON_ROWS, computeRowWinners, computeRowWorst } from "../lib/cardComparison";
import type { Card, Network, RewardType } from "../types/card";
import styles from "./ComparisonMatrix.module.css";

interface ComparisonMatrixProps {
  cards: Card[];
}

// Parallel to COMPARISON_ROWS; used when there is nothing to rank against.
const EMPTY_ROW_SETS: Set<string>[] = COMPARISON_ROWS.map(() => new Set<string>());

const ComparisonMatrix = ({ cards }: ComparisonMatrixProps) => {
  const [selectedNetworks, setSelectedNetworks] = useState<Network[]>([]);
  const [selectedRewardType, setSelectedRewardType] = useState<RewardType | "ALL">("ALL");
  const [requireNoFxFee, setRequireNoFxFee] = useState(false);
  const [requireLoungeAccess, setRequireLoungeAccess] = useState(false);

  const networks = useMemo(() => Array.from(new Set(cards.map((card) => card.network))), [cards]);

  const filteredCards = useMemo(
    () =>
      cards.filter((card) => {
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
    [cards, selectedNetworks, selectedRewardType, requireNoFxFee, requireLoungeAccess],
  );

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
      <section className={styles.filters} aria-label="Filter cards">
        <fieldset className={styles.fieldset}>
          <legend>Network</legend>
          <div className={styles.multiSelectRow}>
            {networks.map((network) => (
              <label key={network} className={styles.filterLabel}>
                <input
                  type="checkbox"
                  checked={selectedNetworks.includes(network)}
                  onChange={(event) =>
                    setSelectedNetworks((current) =>
                      event.target.checked
                        ? [...current, network]
                        : current.filter((item) => item !== network),
                    )
                  }
                />
                {network}
              </label>
            ))}
          </div>
        </fieldset>

        <label className={styles.filterLabel}>
          Reward type
          <select
            value={selectedRewardType}
            onChange={(event) => setSelectedRewardType(event.target.value as RewardType | "ALL")}
          >
            <option value="ALL">All</option>
            <option value="MR">Membership Rewards</option>
            <option value="CASHBACK">Cashback</option>
            <option value="POINTS">Points</option>
          </select>
        </label>

        <label className={styles.filterLabel}>
          <input
            type="checkbox"
            checked={requireNoFxFee}
            onChange={(event) => setRequireNoFxFee(event.target.checked)}
          />
          No FX fee
        </label>

        <label className={styles.filterLabel}>
          <input
            type="checkbox"
            checked={requireLoungeAccess}
            onChange={(event) => setRequireLoungeAccess(event.target.checked)}
          />
          Lounge access
        </label>
      </section>

      <p className={styles.resultCount}>
        Showing {filteredCards.length} of {cards.length} cards
      </p>

      {filteredCards.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.cornerCell}>
                  <span className={styles.srOnly}>Attribute</span>
                </th>
                {filteredCards.map((card) => (
                  <th key={card.id} scope="col" className={styles.cardHead}>
                    <Link
                      href={`/${card.id}`}
                      className={styles.cardLink}
                      aria-label={`View details for ${card.displayName}`}
                    >
                      <span className={styles.cardName}>
                        {card.shortName ?? card.displayName}
                      </span>
                      <span className={styles.cardIssuer}>{card.issuer}</span>
                      <span className={styles.cardDetails}>Details →</span>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, rowIdx) => (
                <tr
                  key={row.label}
                  className={row.numericValue ? styles.rowHighlight : undefined}
                >
                  <th scope="row" className={styles.rowLabel}>
                    {row.label}
                  </th>
                  {filteredCards.map((card) => {
                    const cell = row.value(card);
                    const isWinner = rowWinners[rowIdx]?.has(card.id) ?? false;
                    const isWorst = rowWorst[rowIdx]?.has(card.id) ?? false;
                    const statusClass = isWinner
                      ? styles.cellBest
                      : isWorst
                        ? styles.cellWorst
                        : "";
                    return (
                      <td key={card.id} className={`${styles.cell} ${statusClass}`}>
                        {cell.emphasizePrimary ? (
                          <span className={styles.primaryValue}>{cell.primary}</span>
                        ) : (
                          cell.primary
                        )}
                        {cell.detail && <span className={styles.subValue}>{cell.detail}</span>}
                        {cell.capped && (
                          <span className={styles.capped} title="Accelerated rate is capped at an annual spend limit">
                            capped
                          </span>
                        )}
                        {isWinner && <span className={styles.srOnly}> (best in row)</span>}
                        {isWorst && <span className={styles.srOnly}> (weakest in row)</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.emptyState}>No cards match the selected filters.</p>
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
