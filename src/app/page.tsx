import ComparisonMatrix from "../components/ComparisonMatrix";
import { CARDS } from "../data/cards";
import styles from "./page.module.css";

const HomePage = () => {
  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>
        Canadian Personal Credit Card Comparison
      </h1>
      <p className={styles.subheading}>
        Compare {CARDS.length} Canadian personal credit cards side-by-side —
        filter by network, reward type, and perks, then click any card name for
        full details.
      </p>

      <ComparisonMatrix cards={CARDS} />
    </main>
  );
};

export default HomePage;
