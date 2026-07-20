import Link from "next/link";
import { COMPARISON_ROWS } from "../lib/cardComparison";
import type { Card } from "../types/card";
import styles from "./MatrixTable.module.css";

interface MatrixTableProps {
  cards: Card[];
  /** Parallel to COMPARISON_ROWS: card ids that win / lose each numeric row. */
  rowWinners: Set<string>[];
  rowWorst: Set<string>[];
}

/** The side-by-side comparison table for the currently visible cards. */
const MatrixTable = ({ cards, rowWinners, rowWorst }: MatrixTableProps) => {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.cornerCell}>
              <span className="srOnly">Attribute</span>
            </th>
            {cards.map((card) => (
              <th key={card.id} scope="col" className={styles.cardHead}>
                <Link
                  href={`/${card.id}`}
                  className={styles.cardLink}
                  aria-label={`View details for ${card.displayName}`}
                >
                  <span className={styles.cardName}>{card.shortName ?? card.displayName}</span>
                  <span className={styles.cardIssuer}>{card.issuer}</span>
                  <span className={styles.cardDetails}>Details →</span>
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row, rowIdx) => (
            <tr key={row.label} className={row.numericValue ? styles.rowHighlight : undefined}>
              <th scope="row" className={styles.rowLabel}>
                {row.categoryId ? (
                  <a
                    href={`#category-${row.categoryId}`}
                    className={styles.rowLabelHint}
                    title={row.tooltip}
                    onClick={() => {
                      // The target lives inside the collapsed legend; not every
                      // browser auto-opens a <details> on fragment navigation.
                      document
                        .querySelector<HTMLDetailsElement>("#category-legend")
                        ?.setAttribute("open", "");
                    }}
                  >
                    {row.label}
                  </a>
                ) : (
                  row.label
                )}
              </th>
              {cards.map((card) => {
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
                      <span
                        className={styles.capped}
                        title="Accelerated rate is capped at an annual spend limit"
                      >
                        capped
                      </span>
                    )}
                    {isWinner && <span className="srOnly"> (best in row)</span>}
                    {isWorst && <span className="srOnly"> (weakest in row)</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MatrixTable;
