import type { Card } from "../types/card";
import styles from "./CardPicker.module.css";

interface CardPickerProps {
  cards: Card[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}

/** Tier 1 of the controls: choose exactly which cards to line up. */
const CardPicker = ({ cards, selectedIds, onToggle, onSelectAll, onClear }: CardPickerProps) => {
  const allSelected = selectedIds.size === cards.length;
  const noneSelected = selectedIds.size === 0;

  return (
    <div className={styles.picker}>
      <div className={styles.pickerHeader}>
        <span className={styles.pickerTitle}>Cards to compare</span>
        <span className={styles.pickerMeta}>
          <span>
            {selectedIds.size} of {cards.length} selected
          </span>
          <button
            type="button"
            className={styles.linkButton}
            onClick={onSelectAll}
            disabled={allSelected}
          >
            Select all
          </button>
          <button
            type="button"
            className={styles.linkButton}
            onClick={onClear}
            disabled={noneSelected}
          >
            Clear
          </button>
        </span>
      </div>
      <div className={styles.cardPickerRow}>
        {cards.map((card) => {
          const isOn = selectedIds.has(card.id);
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
