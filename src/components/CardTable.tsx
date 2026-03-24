import Link from "next/link";
import type { Card } from "../types/card";
import styles from "./CardTable.module.css";

interface CardTableProps {
  cards: Card[];
}

const formatLoungeSummary = (card: Card): string => {
  if (!card.lounges?.length) {
    return "None";
  }

  return card.lounges
    .map((lounge) => `${lounge.program} (${lounge.freeVisitsPerYear})`)
    .join(", ");
};

const CardTable = ({ cards }: CardTableProps) => {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Name</th>
          <th>Network</th>
          <th>Reward type</th>
          <th>Annual fee</th>
          <th>FX fee</th>
          <th>Lounge summary</th>
        </tr>
      </thead>
      <tbody>
        {cards.map((card) => (
          <tr key={card.id}>
            <td>
              <Link href={`/cards/${card.id}`}>{card.displayName}</Link>
            </td>
            <td>{card.network}</td>
            <td>{card.rewardType}</td>
            <td>${card.annualFee}</td>
            <td>
              {card.fxPolicy.hasFxFee ?
                `${card.fxPolicy.fxFeePercent ?? 0}%`
              : "No FX fee"}
            </td>
            <td>{formatLoungeSummary(card)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CardTable;
