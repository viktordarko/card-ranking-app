"use client";

import { useState } from "react";
import type {
  MerchantType,
  ScenarioCurrency,
  ScenarioInput,
  ScenarioLocation,
} from "../logic/selector";
import styles from "./ScenarioForm.module.css";

interface ScenarioFormProps {
  onSubmit: (scenario: ScenarioInput) => void;
}

export default function ScenarioForm({ onSubmit }: ScenarioFormProps) {
  const [merchantType, setMerchantType] = useState<MerchantType>("general");
  const [location, setLocation] = useState<ScenarioLocation>("CANADA");
  const [currency, setCurrency] = useState<ScenarioCurrency>("CAD");
  const [requireNoFxFee, setRequireNoFxFee] = useState(false);
  const [requireLoungeAccess, setRequireLoungeAccess] = useState(false);

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          merchantType,
          location,
          currency,
          requireNoFxFee,
          requireLoungeAccess,
          topN: 5,
        });
      }}
    >
      <label className={styles.label}>
        Merchant type
        <select
          value={merchantType}
          onChange={(event) =>
            setMerchantType(event.target.value as MerchantType)
          }
        >
          <option value="general">General</option>
          <option value="restaurant">Restaurant</option>
          <option value="travel">Travel</option>
          <option value="groceries">Groceries</option>
          <option value="gas">Gas</option>
          <option value="transit">Transit</option>
          <option value="pharmacy">Pharmacy</option>
        </select>
      </label>

      <label className={styles.label}>
        Location
        <select
          value={location}
          onChange={(event) =>
            setLocation(event.target.value as ScenarioLocation)
          }
        >
          <option value="CANADA">Canada</option>
          <option value="FOREIGN">Foreign</option>
        </select>
      </label>

      <label className={styles.label}>
        Currency
        <select
          value={currency}
          onChange={(event) =>
            setCurrency(event.target.value as ScenarioCurrency)
          }
        >
          <option value="CAD">CAD</option>
          <option value="USD">USD</option>
          <option value="OTHER">Other</option>
        </select>
      </label>

      <label className={styles.checkLabel}>
        <input
          type="checkbox"
          checked={requireNoFxFee}
          onChange={(event) => setRequireNoFxFee(event.target.checked)}
        />
        Require no FX fee
      </label>

      <label className={styles.checkLabel}>
        <input
          type="checkbox"
          checked={requireLoungeAccess}
          onChange={(event) => setRequireLoungeAccess(event.target.checked)}
        />
        Require lounge access
      </label>

      <button type="submit" className={styles.submitButton}>
        Rank cards
      </button>
    </form>
  );
}
