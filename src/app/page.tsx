import Link from "next/link";
import { CARDS } from "../data/cards";
import {
  COMPARISON_ROWS,
  computeRowWinners,
  computeRowWorst,
} from "../lib/cardComparison";
import styles from "./page.module.css";

// ── page ─────────────────────────────────────────────────────────────────────

const HomePage = () => {
  const rowWinners = computeRowWinners(CARDS);
  const rowWorst = computeRowWorst(CARDS);

  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>
        Canadian Personal Credit Card Comparison
      </h1>
      <p className={styles.subheading}>
        8 cards side-by-side — click any card name to view full details.
      </p>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.cornerCell}></th>
              {CARDS.map((card) => (
                <th key={card.id} className={styles.cardHead}>
                  <Link href={`/cards/${card.id}`} className={styles.cardLink}>
                    {card.shortName ?? card.displayName}
                  </Link>
                  <span className={styles.cardIssuer}>{card.issuer}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row, rowIdx) => (
              <tr
                key={row.label}
                className={row.highlight ? styles.rowHighlight : undefined}
              >
                <td className={styles.rowLabel}>{row.label}</td>
                {CARDS.map((card) => {
                  const cell = row.value(card);
                  const isWinner = rowWinners[rowIdx].has(card.id);
                  const isWorst = rowWorst[rowIdx].has(card.id);
                  const statusClass =
                    isWinner ? styles.cellBest
                    : isWorst ? styles.cellWorst
                    : "";
                  return (
                    <td
                      key={card.id}
                      className={`${styles.cell} ${statusClass}`}
                    >
                      {cell.emphasizePrimary ?
                        <span className={styles.primaryValue}>
                          {cell.primary}
                        </span>
                      : cell.primary}
                      {cell.detail && (
                        <span className={styles.subValue}>{cell.detail}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={styles.footnote}>
        Green cells mark the highest headline value in each numeric row (ties
        share highlight). Conditional rates are shown with their eligibility
        text and fallback behavior.
      </p>
    </main>
  );
};

export default HomePage;
