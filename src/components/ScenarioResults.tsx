import type { ScoredCard } from "../logic/selector";
import styles from "./ScenarioResults.module.css";

interface ScenarioResultsProps {
  results: ScoredCard[];
}

const ScenarioResults = ({ results }: ScenarioResultsProps) => {
  if (results.length === 0) {
    return null;
  }

  return (
    <section className={styles.resultsSection}>
      <h2>Top recommendations</h2>
      <ul className={styles.resultList}>
        {results.map((result) => (
          <li key={result.cardId} className={styles.resultItem}>
            <h3>{result.cardName}</h3>
            <p>Estimated net value: {result.effectiveValuePercent}%</p>
            <p>Matched multiplier: {result.effectiveMultiplier}x</p>
            <p>Matched rate: {result.matchedRateDescription}</p>
            <p>FX policy: {result.fxPolicySummary}</p>
            <p>Lounge: {result.loungeSummary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ScenarioResults;
