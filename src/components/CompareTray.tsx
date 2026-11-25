import { useRef } from "react";
import type { Card } from "../types/card";
import CardArt from "./CardArt";
import styles from "./CompareTray.module.css";

interface CompareTrayProps {
  cards: Card[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onCompare: () => void;
}

/** Follows you down the browse view, holding the cards picked so far. */
const CompareTray = ({ cards, onRemove, onClear, onCompare }: CompareTrayProps) => {
  const trayRef = useRef<HTMLElement>(null);

  return (
    <section className={styles.tray} aria-label="Cards to compare" ref={trayRef} tabIndex={-1}>
      <ul className={styles.picks}>
        {cards.map((card) => {
          const name = card.shortName ?? card.displayName;
          return (
            <li key={card.id}>
              <button
                type="button"
                className={styles.pick}
                onClick={() => {
                  // The button is about to go; the last one takes the tray with it.
                  if (cards.length > 1) {
                    onRemove(card.id);
                    trayRef.current?.focus({ preventScroll: true });
                  } else {
                    onClear();
                  }
                }}
                aria-label={`Remove ${name} from comparison`}
              >
                <CardArt card={card} size="sm" />
                <span>{name}</span>
                <span aria-hidden="true">×</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className={styles.actions}>
        <button type="button" className={styles.clear} onClick={onClear}>
          Clear
        </button>
        <button
          type="button"
          className={styles.compare}
          onClick={onCompare}
          disabled={cards.length < 2}
        >
          {cards.length < 2 ? "Pick one more" : `Compare ${cards.length} cards`}
        </button>
      </div>
    </section>
  );
};

export default CompareTray;
