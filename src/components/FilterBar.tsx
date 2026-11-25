import { formatNetwork } from "../lib/cardFormatting";
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
  rewardCounts: Map<RewardType | "ALL", number>;
  selectedRewardType: RewardType | "ALL";
  onRewardChange: (value: RewardType | "ALL") => void;

  noFeeCount: number;
  requireNoAnnualFee: boolean;
  onNoFeeChange: (checked: boolean) => void;

  noFxCount: number;
  requireNoFxFee: boolean;
  onNoFxChange: (checked: boolean) => void;

  loungeCount: number;
  requireLoungeAccess: boolean;
  onLoungeChange: (checked: boolean) => void;
}

/** Narrow the visible cards by network, reward, fees, and perks. */
const FilterBar = ({
  networks,
  networkCounts,
  selectedNetworks,
  onToggleNetwork,
  rewardOptions,
  rewardCounts,
  selectedRewardType,
  onRewardChange,
  noFeeCount,
  requireNoAnnualFee,
  onNoFeeChange,
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
                label={formatNetwork(network)}
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
          onChange={(event) => {
            const option = rewardOptions.find(({ value }) => value === event.target.value);
            if (option) {
              onRewardChange(option.value);
            }
          }}
        >
          {rewardOptions.map((option) => {
            const count = rewardCounts.get(option.value) ?? 0;
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
        <legend className={styles.filterGroupLabel}>Fees and perks</legend>
        <div className={styles.pillRow}>
          <FilterPill
            label="No annual fee"
            count={noFeeCount}
            checked={requireNoAnnualFee}
            disabled={noFeeCount === 0 && !requireNoAnnualFee}
            onChange={onNoFeeChange}
          />
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
