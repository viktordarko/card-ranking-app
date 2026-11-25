"use client";

import { formatDate, formatDollars } from "../lib/cardFormatting";
import { getWelcomeOfferValue, isOfferOver } from "../lib/welcomeOffer";
import type { Card } from "../types/card";
import { useToday } from "./useToday";
import styles from "./WelcomeOfferPanel.module.css";

/** The detail page's welcome offer. Runs in the browser to notice it has ended. */
const WelcomeOfferPanel = ({ card }: { card: Card }) => {
  const today = useToday();
  const offer = card.welcomeOffer;
  const isOver = today !== null && isOfferOver(card, today);

  if (!offer || isOver) {
    return (
      <section className={styles.offer} aria-label="Welcome offer">
        <div>
          <h2 className={styles.offerTitle}>Welcome offer</h2>
          <p className={styles.offerMeta}>
            {offer?.expires
              ? `The last offer we saw ended ${formatDate(offer.expires)}. Check the issuer's page for a new one.`
              : `No public offer when this card was last checked (${formatDate(card.verifiedOn)}).`}
          </p>
        </div>
      </section>
    );
  }

  const value = getWelcomeOfferValue(card);

  return (
    <section className={styles.offer} aria-label="Welcome offer">
      <div>
        <h2 className={styles.offerTitle}>Welcome offer</h2>
        <p className={styles.offerHeadline}>{offer.headline}</p>
        {offer.details?.length ? (
          <ul className={styles.offerDetails}>
            {offer.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        ) : null}
        <p className={styles.offerMeta}>
          {offer.expires
            ? `Ends ${formatDate(offer.expires)}`
            : "No end date published; offers change often"}
        </p>
      </div>
      {value !== undefined && (
        <p className={styles.offerValue}>
          ≈ {formatDollars(value)}
          <span>estimated value</span>
        </p>
      )}
    </section>
  );
};

export default WelcomeOfferPanel;
