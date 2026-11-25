import { ViewTransition } from "react";
import { formatNetwork } from "../lib/cardFormatting";
import type { Card, CardArtColors } from "../types/card";
import styles from "./CardArt.module.css";

const DEFAULT_ART: CardArtColors = { from: "#334155", to: "#1e293b", ink: "light" };

interface CardArtProps {
  card: Card;
  size?: "sm" | "md" | "lg";
  /** Grows into (or out of) the same card's art on the next page. Once per card per page. */
  morph?: boolean;
}

/**
 * A drawn card face in the card's own colours, so each one is recognisable at a
 * glance. Purely decorative: the name is always repeated as real text nearby.
 */
const CardArt = ({ card, size = "md", morph = false }: CardArtProps) => {
  const { from, to, ink } = card.art ?? DEFAULT_ART;

  const art = (
    <span
      className={`${styles.art} ${styles[size]} ${ink === "dark" ? styles.inkDark : ""}`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      aria-hidden="true"
    >
      <span className={styles.name}>{card.shortName ?? card.displayName}</span>
      <span className={styles.chip} />
      <span className={styles.network}>{formatNetwork(card.network)}</span>
    </span>
  );

  return morph ? (
    <ViewTransition name={`card-art-${card.id}`} share="card-art" default="none">
      {art}
    </ViewTransition>
  ) : (
    art
  );
};

export default CardArt;
