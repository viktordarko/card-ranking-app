import Link from "next/link";
import { notFound } from "next/navigation";
import { CARDS } from "../../../data/cards";
import {
  formatRewardRate,
  formatScopeLabel,
  formatSpecificBrandRate,
} from "../../../lib/cardFormatting";
import styles from "./page.module.css";

export const generateStaticParams = () => {
  return CARDS.map((card) => ({ id: card.id }));
};

export const dynamicParams = false;

const CardDetailPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const card = CARDS.find((item) => item.id === id);

  if (!card) {
    notFound();
  }

  const fxLabel =
    card.fxPolicy.hasFxFee ?
      `${card.fxPolicy.fxFeePercent ?? 2.5}% FX fee`
    : "No FX fee";

  return (
    <main className={styles.main}>
      {/* Back navigation */}
      <div className={styles.backRow}>
        <Link href="/" className={styles.backLink}>
          ← Back to comparison
        </Link>
      </div>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <h1 className={styles.cardName}>{card.displayName}</h1>
          <p className={styles.issuer}>{card.issuer}</p>
          <div className={styles.badgeRow}>
            <span className={`${styles.badge} ${styles[`net${card.network}`]}`}>
              {card.network}
            </span>
            <span className={styles.badge}>{card.rewardType}</span>
            {card.cardType && (
              <span className={styles.badge}>{card.cardType}</span>
            )}
            {!card.fxPolicy.hasFxFee && (
              <span className={`${styles.badge} ${styles.badgeGreen}`}>
                No FX Fee
              </span>
            )}
          </div>
        </div>

        <div className={styles.heroRight}>
          <div className={styles.feeStat}>
            <span className={styles.feeLabel}>Annual fee</span>
            <span className={styles.feeValue}>${card.annualFee}</span>
          </div>
          {typeof card.additionalCardFee === "number" && (
            <div className={styles.feeStat}>
              <span className={styles.feeLabel}>Auth card fee</span>
              <span className={styles.feeValue}>
                {card.additionalCardFee === 0 ?
                  "Free"
                : `$${card.additionalCardFee}`}
              </span>
            </div>
          )}
          <div className={styles.feeStat}>
            <span className={styles.feeLabel}>FX fee</span>
            <span
              className={`${styles.feeValue} ${
                card.fxPolicy.hasFxFee ? styles.fxBad : styles.fxGood
              }`}
            >
              {fxLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ── Earn rates ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Earn rates</h2>
        <div className={styles.tableWrap}>
          <table className={styles.earnTable}>
            <thead>
              <tr>
                <th>Rate</th>
                <th>Description</th>
                <th>Applies to</th>
                <th>Scope</th>
              </tr>
            </thead>
            <tbody>
              {card.earnRates.map((rate) => {
                return (
                  <tr key={rate.id}>
                    <td className={styles.rateCell}>
                      <span className={styles.rateNum}>
                        {formatRewardRate(card.rewardType, rate.rateMultiplier)}
                      </span>
                    </td>
                    <td>{rate.description}</td>
                    <td>{rate.appliesTo ?? "See issuer terms"}</td>
                    <td>
                      <span className={styles.scopeChip}>
                        {formatScopeLabel(rate.locationScope)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Metadata row ── */}
      <div className={styles.metaGrid}>
        {card.rewardCurrency && (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Reward currency</span>
            <span className={styles.metaValue}>{card.rewardCurrency}</span>
          </div>
        )}
        {card.minimumIncome && (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Minimum income</span>
            <span className={styles.metaValue}>{card.minimumIncome}</span>
          </div>
        )}
      </div>

      {/* ── Lounge + Benefits (two columns) ── */}
      <div className={styles.twoCol}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Lounge access</h2>
          {card.lounges?.length ?
            <ul className={styles.benefitList}>
              {card.lounges.map((l) => (
                <li key={l.program}>
                  <span className={styles.benefitText}>{l.program}</span>
                  <span className={styles.visitBadge}>
                    {l.freeVisitsPerYear === "UNLIMITED" ?
                      "Unlimited complimentary visits"
                    : l.freeVisitsPerYear === 0 ?
                      "Paid access only"
                    : `${l.freeVisitsPerYear} complimentary visits / year`}
                  </span>
                </li>
              ))}
            </ul>
          : <p className={styles.emptyNote}>No lounge access included</p>}
        </section>

        {card.keyBenefits?.length ?
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Key benefits</h2>
            <ul className={styles.benefitList}>
              {card.keyBenefits.map((b) => (
                <li key={b}>
                  <span className={styles.benefitText}>{b}</span>
                </li>
              ))}
            </ul>
          </section>
        : null}
      </div>

      {/* ── Caps ── */}
      {card.caps?.length ?
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Caps &amp; limitations</h2>
          <ul className={styles.capList}>
            {card.caps.map((cap) => (
              <li key={cap}>{cap}</li>
            ))}
          </ul>
        </section>
      : null}

      {card.specificBrands?.length ?
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Brand-specific boosts</h2>
          <ul className={styles.benefitList}>
            {card.specificBrands.map((brandRate) => (
              <li key={brandRate.id}>
                <span className={styles.benefitText}>
                  {brandRate.id}:{" "}
                  {formatSpecificBrandRate(
                    card.rewardType,
                    brandRate.rateMultiplier,
                    brandRate.description,
                  )}
                </span>
                <span className={styles.visitBadge}>
                  {brandRate.description}
                </span>
              </li>
            ))}
          </ul>
        </section>
      : null}

      {/* ── Notes ── */}
      {card.notes ?
        <p className={styles.noteSection}>
          <span className={styles.noteLabel}>Note: </span>
          {card.notes}
        </p>
      : null}
    </main>
  );
};

export default CardDetailPage;
