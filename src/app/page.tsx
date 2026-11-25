import CardExplorer from "../components/CardExplorer";
import CategoryLegend from "../components/CategoryLegend";
import { CARDS } from "../data/cards";
import { formatDate } from "../lib/cardFormatting";
import styles from "./page.module.css";

// The page is only as fresh as its stalest card, so that is the date it shows.
const lastChecked = CARDS.map((card) => card.verifiedOn).toSorted()[0];

const HomePage = () => {
  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>Compare Canadian credit cards</h1>
      <p className={styles.subheading}>
        {CARDS.length} personal cards with their fees, offers, and earn rates converted to one
        estimated cash return.
      </p>
      {lastChecked && <p className={styles.checked}>Last checked {formatDate(lastChecked)}</p>}

      <CardExplorer cards={CARDS} />
      <CategoryLegend />
    </main>
  );
};

export default HomePage;
