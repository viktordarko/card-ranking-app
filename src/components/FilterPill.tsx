import styles from "./FilterPill.module.css";

interface FilterPillProps {
  label: string;
  count: number;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * A single toggle filter, rendered as a pill wrapping a visually-hidden
 * checkbox (so it stays keyboard- and screen-reader-accessible). Shows how many
 * cards the option would match and mutes itself when that count is zero.
 */
const FilterPill = ({ label, count, checked, disabled, onChange }: FilterPillProps) => {
  const className = [styles.pill, checked ? styles.pillOn : "", disabled ? styles.pillDisabled : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <label className={className}>
      <input
        type="checkbox"
        className="srOnly"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
      <span className={styles.pillCount}>{count}</span>
    </label>
  );
};

export default FilterPill;
