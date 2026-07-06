import type { Network, RewardType } from "../types/card";
import FilterPill from "./FilterPill";
import styles from "./FilterBar.module.css";

export interface RewardOption {
  value: RewardType | "ALL";
  label: string;
}

interface FilterBarProps {
  networks: Network[];
  networkCounts: Map<Network, number>;
  selectedNetworks: Network[];
  onToggleNetwork: (network: Network, checked: boolean) => void;

  rewardOptions: RewardOption[];
  rewardCounts: Record<RewardType | "ALL", number>;
  selectedRewardType: RewardType | "ALL";
  onRewardChange: (value: RewardType | "ALL") => void;

  noFxCount: number;
  requireNoFxFee: boolean;
  onNoFxChange: (checked: boolean) => void;

  loungeCount: number;
  requireLoungeAccess: boolean;
  onLoungeChange: (checked: boolean) => void;
}

/** Tier 2 of the controls: narrow the picked cards by network, reward, and perks. */
const FilterBar = ({
  networks,
  networkCounts,
  selectedNetworks,
  onToggleNetwork,
  rewardOptions,
  rewardCounts,
  selectedRewardType,
  onRewardChange,
  noFxCount,
  requireNoFxFee,
  onNoFxChange,
  loungeCount,
  requireLoungeAccess,
  onLoungeChange,
}: FilterBarProps) => {
  return (
    <div className={styles.filterBar}>
      <fieldset className={styles.filterGroup}>
        <legend className={styles.filterGroupLabel}>Network</legend>
        <div className={styles.pillRow}>
          {networks.map((network) => {
            const isOn = selectedNetworks.includes(network);
            const count = networkCounts.get(network) ?? 0;
            return (
              <FilterPill
                key={network}
                label={network}
                count={count}
                checked={isOn}
                disabled={count === 0 && !isOn}
                onChange={(checked) => onToggleNetwork(network, checked)}
              />
            );
          })}
        </div>
      </fieldset>

      <div className={styles.filterGroup}>
        <label className={styles.filterGroupLabel} htmlFor="reward-type">
          Reward
        </label>
        <select
          id="reward-type"
          className={styles.select}
          value={selectedRewardType}
          onChange={(event) => onRewardChange(event.target.value as RewardType | "ALL")}
        >
          {rewardOptions.map((option) => {
            const count = rewardCounts[option.value];
            return (
              <option
                key={option.value}
                value={option.value}
                disabled={count === 0 && option.value !== selectedRewardType}
              >
                {option.label} ({count})
              </option>
            );
          })}
        </select>
      </div>

      <fieldset className={styles.filterGroup}>
        <legend className={styles.filterGroupLabel}>Perks</legend>
        <div className={styles.pillRow}>
          <FilterPill
            label="No FX fee"
            count={noFxCount}
            checked={requireNoFxFee}
            disabled={noFxCount === 0 && !requireNoFxFee}
            onChange={onNoFxChange}
          />
          <FilterPill
            label="Lounge access"
            count={loungeCount}
            checked={requireLoungeAccess}
            disabled={loungeCount === 0 && !requireLoungeAccess}
            onChange={onLoungeChange}
          />
        </div>
      </fieldset>
    </div>
  );
};

export default FilterBar;
