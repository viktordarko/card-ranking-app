import Link from "next/link";
import {
  formatAnnualFee,
  formatDate,
  formatDollars,
  formatLoungeVisits,
  formatNetwork,
  formatPercent,
} from "../lib/cardFormatting";
import { getEarnHighlights } from "../lib/cardHighlights";
import { getFxFeePercent } from "../lib/rewardValuation";
import { getMatchNote, getWelcomeOfferValue } from "../lib/welcomeOffer";
import type { Card } from "../types/card";
import CardArt from "./CardArt";
import CategoryIcon from "./CategoryIcon";
import styles from "./CardTile.module.css";

interface CardTileProps {
  card: Card;
  /** Categories this card leads, strongest first. */
  bestFor: string[];
  picked: boolean;
  onTogglePick: () => void;
}

const MAX_EARN_CATEGORIES = 3;
const MAX_BADGES = 2;

/** One card in the browse view: what it costs, what it earns, and the offer. */
const CardTile = ({ card, bestFor, picked, onTogglePick }: CardTileProps) => {
  const name = card.shortName ?? card.displayName;
  const offer = card.welcomeOffer;
  const offerValue = getWelcomeOfferValue(card);
  const matchNote = getMatchNote(card);
  const fxFee = getFxFeePercent(card);
  const lounge = card.lounges?.[0];

  const stats = [
    { label: "Annual fee", value: formatAnnualFee(card.annualFee), good: card.annualFee === 0 },
    { label: "FX fee", value: fxFee === 0 ? "None" : formatPercent(fxFee), good: fxFee === 0 },
    {
      label: "Lounge visits",
      value: lounge ? formatLoungeVisits(lounge.freeVisitsPerYear) : "None",
      good: Boolean(lounge && lounge.freeVisitsPerYear !== 0),
    },
  ];

  return (
    <article className={`${styles.tile} ${picked ? styles.tilePicked : ""}`}>
      <header className={styles.header}>
        <CardArt card={card} morph />
        <div className={styles.heading}>
          <h2 className={styles.name}>
            <Link href={`/${card.id}`} className={styles.nameLink}>
              {card.displayName}
            </Link>
          </h2>
          <p className={styles.issuer}>
            {card.issuer} · {formatNetwork(card.network)}
          </p>
        </div>
      </header>

      {bestFor.length > 0 && (
        <ul className={styles.badges} aria-label="Best for">
          {bestFor.slice(0, MAX_BADGES).map((label) => (
            <li key={label} className={styles.badge}>
              Best for {label}
            </li>
          ))}
        </ul>
      )}

      <p className={styles.summary}>{card.summary}</p>

      <dl className={styles.stats}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.stat}>
            <dt>{stat.label}</dt>
            <dd className={stat.good ? styles.statGood : undefined}>{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className={styles.offer}>
        <span className={styles.offerLabel}>Welcome offer</span>
        {offer ? (
          <>
            <span className={styles.offerHeadline}>{offer.headline}</span>
            <span className={styles.offerMeta}>
              {offerValue !== undefined && <strong>≈ {formatDollars(offerValue)}</strong>}
              {offer.expires && <span>Ends {formatDate(offer.expires)}</span>}
            </span>
          </>
        ) : (
          <span className={styles.offerNone}>No public offer right now</span>
        )}
      </div>

      {matchNote && <p className={styles.matchNote}>{matchNote}</p>}

      <ul className={styles.earnList} aria-label="Earn rates">
        {getEarnHighlights(card, MAX_EARN_CATEGORIES).map((earn) => (
          <li key={earn.id} className={styles.earnRow}>
            <CategoryIcon category={earn.categoryId} className={styles.earnIcon} />
            <span className={styles.earnLabel}>
              {earn.label}
              {earn.condition && <span className={styles.earnCondition}>{earn.condition}</span>}
              {earn.capped && <span className={styles.earnCondition}>up to a spend cap</span>}
            </span>
            <span className={styles.earnValue}>
              <span className={styles.earnRate}>{earn.rate}</span>
              {earn.estimate && <span className={styles.earnEstimate}>{earn.estimate}</span>}
            </span>
          </li>
        ))}
      </ul>

      <footer className={styles.footer}>
        <label className={styles.compare}>
          <input type="checkbox" checked={picked} onChange={onTogglePick} />
          Compare<span className="srOnly"> {name}</span>
        </label>
        <Link
          href={`/${card.id}`}
          className={styles.details}
          aria-label={`See details for ${card.displayName}`}
        >
          See details
        </Link>
      </footer>
    </article>
  );
};

export default CardTile;
