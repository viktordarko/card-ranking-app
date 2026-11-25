import type { Card } from "../types/card";
import styles from "./CardPicker.module.css";

interface CardPickerProps {
  cards: Card[];
  pickedIds: Set<string>;
  onToggle: (id: string) => void;
  onClear: () => void;
}

/** Choose exactly which cards to line up; with none picked, all are compared. */
const CardPicker = ({ cards, pickedIds, onToggle, onClear }: CardPickerProps) => {
  const nonePicked = pickedIds.size === 0;

  return (
    <div className={styles.picker}>
      <div className={styles.pickerHeader}>
        <span className={styles.pickerTitle}>Cards to compare</span>
        <span className={styles.pickerMeta}>
          <span>
            {nonePicked
              ? "Comparing every card below. Pick cards to narrow it down."
              : pickedIds.size === 1
                ? "1 picked. Pick another to compare it with."
                : `${pickedIds.size} of ${cards.length} picked`}
          </span>
          {!nonePicked && (
            <button type="button" className={styles.linkButton} onClick={onClear}>
              Compare all
            </button>
          )}
        </span>
      </div>
      <div className={styles.cardPickerRow}>
        {cards.map((card) => {
          const isOn = pickedIds.has(card.id);
          return (
            <label
              key={card.id}
              className={`${styles.cardChip} ${isOn ? styles.cardChipOn : ""}`}
            >
              <input
                type="checkbox"
                className="srOnly"
                checked={isOn}
                onChange={() => onToggle(card.id)}
              />
              {card.shortName ?? card.displayName}
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default CardPicker;
