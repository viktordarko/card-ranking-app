"use client";

import { useState } from "react";
import styles from "./page.module.css";
import ScenarioForm from "../components/ScenarioForm";
import ScenarioResults from "../components/ScenarioResults";
import { CARDS } from "../data/cards";
import { rankCardsForScenario, type ScenarioInput, type ScoredCard } from "../logic/selector";

export default function HomePage() {
  const [results, setResults] = useState<ScoredCard[]>([]);

  const onSubmit = (scenario: ScenarioInput) => {
    const ranked = rankCardsForScenario(CARDS, scenario);
    setResults(ranked);
  };

  return (
    <main className={styles.main}>
      <h1>Credit Card Benefits Recommender</h1>
      <p className={styles.description}>
        Simulate where you spend and rank cards by effective earn multiplier after policy constraints.
      </p>
      <ScenarioForm onSubmit={onSubmit} />
      <ScenarioResults results={results} />
    </main>
  );
}