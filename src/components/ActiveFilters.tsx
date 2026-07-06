import styles from "./ActiveFilters.module.css";

export interface ActiveFilter {
  key: string;
  label: string;
  onRemove: () => void;
}

interface ActiveFiltersProps {
  filters: ActiveFilter[];
  onReset: () => void;
}

/**
 * Summarises the filters currently narrowing the table. Each tag can be removed
 * on its own, and "Reset filters" clears them all at once — the picker keeps its
 * separate "Clear". Renders nothing when no filter is applied.
 */
const ActiveFilters = ({ filters, onReset }: ActiveFiltersProps) => {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div className={styles.activeFilters}>
      <span className={styles.label}>Active filters</span>
      <ul className={styles.tagList}>
        {filters.map((filter) => (
          <li key={filter.key}>
            <button
              type="button"
              className={styles.tag}
              onClick={filter.onRemove}
              aria-label={`Remove ${filter.label} filter`}
            >
              <span>{filter.label}</span>
              <span aria-hidden="true" className={styles.tagRemove}>
                ×
              </span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className={styles.reset} onClick={onReset}>
        Reset filters
      </button>
    </div>
  );
};

export default ActiveFilters;
