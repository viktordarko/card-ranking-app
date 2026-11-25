import Link from "next/link";
import { Fragment } from "react";
import { COMPARISON_ROWS, type ComparisonRowDef } from "../lib/cardComparison";
import type { Card } from "../types/card";
import CardArt from "./CardArt";
import CategoryIcon from "./CategoryIcon";
import styles from "./MatrixTable.module.css";

interface MatrixTableProps {
  cards: Card[];
  /** Parallel to COMPARISON_ROWS: card ids that win / lose each numeric row. */
  rowWinners: Set<string>[];
  rowWorst: Set<string>[];
}

/** Category labels jump to their definition in the legend below the table. */
const RowLabel = ({ row }: { row: ComparisonRowDef }) => {
  if (!row.categoryId) {
    return <span title={row.tooltip}>{row.label}</span>;
  }

  return (
    <a
      href={`#category-${row.categoryId}`}
      className={styles.rowLabelHint}
      title={row.tooltip}
      onClick={() => {
        // The target lives inside the collapsed legend; not every browser
        // auto-opens a <details> on fragment navigation.
        document
          .querySelector<HTMLDetailsElement>("#category-legend")
          ?.setAttribute("open", "");
      }}
    >
      <CategoryIcon category={row.categoryId} className={styles.rowIcon} />
      {row.label}
    </a>
  );
};

/** The side-by-side comparison table for the currently visible cards. */
const MatrixTable = ({ cards, rowWinners, rowWorst }: MatrixTableProps) => {
  return (
    // The region scrolls on its own so the card names and row labels stay in
    // view; tabIndex makes that scrolling reachable from the keyboard.
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <section className={styles.tableWrap} aria-label="Card comparison" tabIndex={0}>
      <table className={styles.table} style={{ "--card-count": cards.length }}>
        <thead>
          <tr>
            <th className={styles.cornerCell}>
              <span className="srOnly">Attribute</span>
            </th>
            {cards.map((card) => (
              <th key={card.id} scope="col" className={styles.cardHead}>
                <Link href={`/${card.id}`} className={styles.cardLink}>
                  <CardArt card={card} size="sm" />
                  <span className={styles.cardName}>
                    {card.shortName ?? card.displayName}
                    <span className="srOnly"> details</span>
                  </span>
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row, rowIdx) => (
            <Fragment key={row.label}>
              {row.group !== COMPARISON_ROWS[rowIdx - 1]?.group && (
                <tr className={styles.groupRow}>
                  <th scope="rowgroup" colSpan={cards.length + 1}>
                    <span className={styles.groupLabel}>{row.group}</span>
                  </th>
                </tr>
              )}
              <tr className={styles.row}>
                <th scope="row" className={styles.rowLabel}>
                  <RowLabel row={row} />
                </th>
                {cards.map((card) => {
                  const cell = row.value(card);
                  const isWinner = rowWinners[rowIdx]?.has(card.id) ?? false;
                  const isWorst = rowWorst[rowIdx]?.has(card.id) ?? false;
                  const className = [
                    styles.cell,
                    cell.muted ? styles.cellMuted : "",
                    isWinner ? styles.cellBest : "",
                    isWorst ? styles.cellWorst : "",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <td key={card.id} className={className}>
                      <span className={cell.emphasizePrimary ? styles.primaryValue : undefined}>
                        {cell.primary}
                      </span>
                      {cell.estimate && <span className={styles.estimate}>{cell.estimate}</span>}
                      {cell.condition && <span className={styles.subValue}>{cell.condition}</span>}
                      {cell.detail && <span className={styles.subValue}>{cell.detail}</span>}
                      {cell.matchNote && (
                        <span className={styles.subValue}>{cell.matchNote}</span>
                      )}
                      {cell.capped && (
                        <span
                          className={styles.capped}
                          title="Accelerated rate stops at an annual spend limit"
                        >
                          Capped
                        </span>
                      )}
                      {isWinner && <span className="srOnly"> (best in row)</span>}
                      {isWorst && <span className="srOnly"> (weakest in row)</span>}
                    </td>
                  );
                })}
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default MatrixTable;
