"use client";

import { useMemo, useState } from "react";
import CardTable from "../../components/CardTable";
import { CARDS } from "../../data/cards";
import type { Network, RewardType } from "../../types/card";
import styles from "./page.module.css";

export default function CardsPage() {
  const [selectedNetworks, setSelectedNetworks] = useState<Network[]>([]);
  const [selectedRewardType, setSelectedRewardType] = useState<
    RewardType | "ALL"
  >("ALL");
  const [requireNoFxFee, setRequireNoFxFee] = useState(false);
  const [requireLoungeAccess, setRequireLoungeAccess] = useState(false);

  const networks = useMemo(
    () => Array.from(new Set(CARDS.map((card) => card.network))) as Network[],
    [],
  );

  const filteredCards = useMemo(
    () =>
      CARDS.filter((card) => {
        if (
          selectedNetworks.length > 0 &&
          !selectedNetworks.includes(card.network)
        ) {
          return false;
        }
        if (
          selectedRewardType !== "ALL" &&
          card.rewardType !== selectedRewardType
        ) {
          return false;
        }
        if (requireNoFxFee && card.fxPolicy.hasFxFee) {
          return false;
        }
        if (requireLoungeAccess && !card.lounges?.length) {
          return false;
        }
        return true;
      }),
    [selectedNetworks, selectedRewardType, requireNoFxFee, requireLoungeAccess],
  );

  return (
    <main className={styles.main}>
      <h1>Cards</h1>
      <section className={styles.filters}>
        <fieldset className={styles.fieldset}>
          <legend>Network</legend>
          <div className={styles.multiSelectRow}>
            {networks.map((network) => (
              <label key={network} className={styles.filterLabel}>
                <input
                  type="checkbox"
                  checked={selectedNetworks.includes(network)}
                  onChange={(event) =>
                    setSelectedNetworks((current) =>
                      event.target.checked ?
                        [...current, network]
                      : current.filter((item) => item !== network),
                    )
                  }
                />
                {network}
              </label>
            ))}
          </div>
        </fieldset>

        <label className={styles.filterLabel}>
          Reward type
          <select
            value={selectedRewardType}
            onChange={(event) =>
              setSelectedRewardType(event.target.value as RewardType | "ALL")
            }
          >
            <option value="ALL">All</option>
            <option value="MR">MR</option>
            <option value="CASHBACK">Cashback</option>
            <option value="POINTS">Points</option>
          </select>
        </label>

        <label className={styles.filterLabel}>
          <input
            type="checkbox"
            checked={requireNoFxFee}
            onChange={(event) => setRequireNoFxFee(event.target.checked)}
          />
          Has no FX fee
        </label>

        <label className={styles.filterLabel}>
          <input
            type="checkbox"
            checked={requireLoungeAccess}
            onChange={(event) => setRequireLoungeAccess(event.target.checked)}
          />
          Has lounge access
        </label>
      </section>

      <CardTable cards={filteredCards} />
    </main>
  );
}
