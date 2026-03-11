import Link from "next/link";
import { CARDS } from "../data/cards";
import type { Card } from "../types/card";
import styles from "./page.module.css";

// ── helpers ──────────────────────────────────────────────────────────────────

/** Best earn rate for a category; falls back to the general base rate so no cell is ever empty. */
function getNumericRate(card: Card, tag: string): number {
  const catRates = card.earnRates.filter((r) => r.mccTags.includes(tag));
  if (catRates.length > 0)
    return Math.max(...catRates.map((r) => r.rateMultiplier));
  const baseRates = card.earnRates.filter((r) => r.mccTags.includes("general"));
  return baseRates.length > 0 ?
      Math.max(...baseRates.map((r) => r.rateMultiplier))
    : 0;
}

function fmtRate(card: Card, tag: string): string {
  const rate = getNumericRate(card, tag);
  if (rate === 0) return "—";
  const suffix = card.rewardType === "CASHBACK" ? "%" : "×";
  return `${rate}${suffix}`;
}

function getNumericBase(card: Card): number {
  const baseRates = card.earnRates.filter((r) => r.mccTags.includes("general"));
  return baseRates.length > 0 ?
      Math.max(...baseRates.map((r) => r.rateMultiplier))
    : 0;
}

function fmtBase(card: Card): string {
  const rate = getNumericBase(card);
  if (rate === 0) return "—";
  const suffix = card.rewardType === "CASHBACK" ? "%" : "×";
  return `${rate}${suffix}`;
}

function getLoungeScore(card: Card): number {
  if (!card.lounges?.length) return -1;
  return Math.max(
    ...card.lounges.map((l) =>
      l.freeVisitsPerYear === "UNLIMITED" ?
        999
      : (l.freeVisitsPerYear as number),
    ),
  );
}

function fmtLounge(card: Card): string {
  if (!card.lounges?.length) return "None";
  return card.lounges
    .map((l) => {
      if (l.freeVisitsPerYear === "UNLIMITED") return "Unlimited";
      if (l.freeVisitsPerYear === 0) return "Paid only";
      return `${l.freeVisitsPerYear}/yr`;
    })
    .join(", ");
}

const SHORT_NAMES: Record<string, string> = {
  "amex-platinum-ca": "Amex Platinum",
  "scotia-gold-amex": "Scotia Gold Amex",
  "rogers-world-elite": "Rogers World Elite",
  "triangle-mastercard": "Triangle MC",
  "cibc-costco-mastercard": "CIBC Costco",
  "td-aeroplan-vi": "TD Aeroplan VI",
  "scotia-passport-vi": "Scotia Passport VI",
  "cibc-dividend-vi": "CIBC Dividend VI",
};

interface RowDef {
  label: string;
  value: (c: Card) => string;
  highlight?: boolean;
  /** When present, the cell(s) with the extreme value are highlighted green. */
  numericValue?: (c: Card) => number;
  lowerIsBetter?: boolean;
}

const ROWS: RowDef[] = [
  { label: "Issuer", value: (c) => c.issuer },
  { label: "Network", value: (c) => c.network },
  { label: "Reward type", value: (c) => c.rewardType },
  { label: "Reward currency", value: (c) => c.rewardCurrency ?? "—" },
  {
    label: "Annual fee",
    value: (c) => `$${c.annualFee}`,
    highlight: true,
    numericValue: (c) => c.annualFee,
    lowerIsBetter: true,
  },
  {
    label: "Auth card fee",
    value: (c) =>
      typeof c.additionalCardFee === "number" && c.additionalCardFee > 0 ?
        `$${c.additionalCardFee}`
      : "N/A",
  },
  {
    label: "FX fee",
    value: (c) =>
      c.fxPolicy.hasFxFee ? `${c.fxPolicy.fxFeePercent ?? 2.5}%` : "None",
    highlight: true,
    numericValue: (c) =>
      c.fxPolicy.hasFxFee ? (c.fxPolicy.fxFeePercent ?? 2.5) : 0,
    lowerIsBetter: true,
  },
  {
    label: "Dining",
    value: (c) => fmtRate(c, "restaurant"),
    highlight: true,
    numericValue: (c) => getNumericRate(c, "restaurant"),
  },
  {
    label: "Groceries",
    value: (c) => fmtRate(c, "groceries"),
    highlight: true,
    numericValue: (c) => getNumericRate(c, "groceries"),
  },
  {
    label: "Gas",
    value: (c) => fmtRate(c, "gas"),
    highlight: true,
    numericValue: (c) => getNumericRate(c, "gas"),
  },
  {
    label: "Travel",
    value: (c) => fmtRate(c, "travel"),
    highlight: true,
    numericValue: (c) => getNumericRate(c, "travel"),
  },
  {
    label: "Transit",
    value: (c) => fmtRate(c, "transit"),
    highlight: true,
    numericValue: (c) => getNumericRate(c, "transit"),
  },
  {
    label: "Base earn",
    value: (c) => fmtBase(c),
    numericValue: (c) => getNumericBase(c),
  },
  {
    label: "Lounge",
    value: (c) => fmtLounge(c),
    highlight: true,
    numericValue: (c) => getLoungeScore(c),
  },
];

// ── page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  // Pre-compute which card IDs win each row (ties are both highlighted).
  const rowWinners: Set<string>[] = ROWS.map((row) => {
    if (!row.numericValue) return new Set<string>();
    const values = CARDS.map((c) => ({ id: c.id, val: row.numericValue!(c) }));
    const extreme =
      row.lowerIsBetter ?
        Math.min(...values.map((v) => v.val))
      : Math.max(...values.map((v) => v.val));
    return new Set(values.filter((v) => v.val === extreme).map((v) => v.id));
  });

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
                    {SHORT_NAMES[card.id] ?? card.displayName}
                  </Link>
                  <span className={styles.cardIssuer}>{card.issuer}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, rowIdx) => (
              <tr
                key={row.label}
                className={row.highlight ? styles.rowHighlight : undefined}
              >
                <td className={styles.rowLabel}>{row.label}</td>
                {CARDS.map((card) => {
                  const isWinner = rowWinners[rowIdx].has(card.id);
                  return (
                    <td
                      key={card.id}
                      className={
                        isWinner ?
                          `${styles.cell} ${styles.cellBest}`
                        : styles.cell
                      }
                    >
                      {row.value(card)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={styles.footnote}>
        Rates shown are the best available multiplier for each category. Cards
        without a category-specific rate show their base earn rate instead.
        Green cells indicate the best value in that row (ties share the
        highlight). Rates may be subject to caps or Canadian-merchant
        restrictions — see card detail for full terms. Points/miles rates are
        multipliers, not cash-equivalent values.
      </p>
    </main>
  );
}
