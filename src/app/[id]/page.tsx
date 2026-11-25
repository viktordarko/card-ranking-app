import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CardArt from "../../components/CardArt";
import CategoryIcon from "../../components/CategoryIcon";
import ExplorerLink from "../../components/ExplorerLink";
import WelcomeOfferPanel from "../../components/WelcomeOfferPanel";
import { CARDS } from "../../data/cards";
import {
  formatAnnualFee,
  formatDate,
  formatExtraCardFee,
  formatIncome,
  formatLoungeVisits,
  formatNetwork,
  formatPercent,
  formatRewardRate,
  formatRewardType,
  formatScopeLabel,
  formatSpecificBrandRate,
  INSURANCE_LABELS,
} from "../../lib/cardFormatting";
import { getBestForCategories } from "../../lib/cardHighlights";
import {
  getCardValueNotes,
  getCardValueUnit,
  getFxFeePercent,
  toEstimatedValuePercent,
} from "../../lib/rewardValuation";
import styles from "./page.module.css";

export const generateStaticParams = () => {
  return CARDS.map((card) => ({ id: card.id }));
};

export const dynamicParams = false;

export const generateMetadata = async ({ params }: PageProps<"/[id]">): Promise<Metadata> => {
  const { id } = await params;
  const card = CARDS.find((item) => item.id === id);

  if (!card) {
    return { title: "Card not found" };
  }

  return {
    title: `${card.displayName} — Card details`,
    description: `Earn rates, fees, and benefits for the ${card.displayName} (${card.issuer}).`,
  };
};

const CardDetailPage = async ({ params }: PageProps<"/[id]">) => {
  const { id } = await params;
  const card = CARDS.find((item) => item.id === id);

  if (!card) {
    notFound();
  }

  const fxFee = getFxFeePercent(card);
  const valueNotes = getCardValueNotes(card);
  const bestFor = getBestForCategories(CARDS).get(card.id) ?? [];
  const isCashBack = card.rewardType === "CASHBACK";

  const facts = [
    { label: "Annual fee", value: formatAnnualFee(card.annualFee) },
    {
      label: "Extra card fee",
      value: formatExtraCardFee(card),
      note:
        card.annualFee === 0 && card.additionalCardFee === undefined
          ? "The card is free, so a second person can get their own"
          : undefined,
    },
    { label: "FX fee", value: fxFee === 0 ? "None" : formatPercent(fxFee) },
    { label: "Minimum income", value: formatIncome(card.income), note: card.income?.note },
    {
      label: "Rewards",
      value: card.rewardCurrency ?? formatRewardType(card.rewardType),
      note: isCashBack
        ? `Valued at $${getCardValueUnit(card)} per $1`
        : `Valued at ${getCardValueUnit(card)}¢ per point`,
    },
    { label: "Redemption", value: card.redemption?.label ?? "Not published" },
  ];

  return (
    <main className={styles.main}>
      <div className={styles.backRow}>
        <ExplorerLink view="browse" className={styles.backLink}>
          ← All cards
        </ExplorerLink>
        <ExplorerLink view="compare" className={styles.backLink}>
          Compare side by side
        </ExplorerLink>
      </div>

      <div className={styles.hero}>
        <CardArt card={card} size="lg" morph />
        <div className={styles.heroText}>
          <h1 className={styles.cardName}>{card.displayName}</h1>
          <p className={styles.issuer}>
            {card.issuer} · {formatNetwork(card.network)}
          </p>
          <p className={styles.summary}>{card.summary}</p>
          {bestFor.length > 0 && (
            <ul className={styles.badgeRow} aria-label="Best for">
              {bestFor.map((label) => (
                <li key={label} className={styles.badge}>
                  Best for {label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {card.upcomingChanges?.length ? (
        <section className={styles.notice} aria-label="Announced changes">
          <h2 className={styles.noticeTitle}>Changes coming</h2>
          <ul className={styles.plainList}>
            {card.upcomingChanges.map((change) => (
              <li key={change.description}>
                <strong>{formatDate(change.effective)}:</strong> {change.description}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <WelcomeOfferPanel card={card} />

      <dl className={styles.facts}>
        {facts.map((fact) => (
          <div key={fact.label} className={styles.fact}>
            <dt>{fact.label}</dt>
            <dd>
              {fact.value}
              {fact.note && fact.note !== fact.value && (
                <span className={styles.factNote}>{fact.note}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Earn rates</h2>
        <div className={styles.tableWrap}>
          <table className={styles.earnTable}>
            <thead>
              <tr>
                <th scope="col">Rate</th>
                <th scope="col">On</th>
                <th scope="col">Where</th>
                <th scope="col">Est. return</th>
              </tr>
            </thead>
            <tbody>
              {card.earnRates.map((rate) => (
                <tr key={rate.id}>
                  <td className={styles.rateNum}>
                    {formatRewardRate(card.rewardType, rate.rateMultiplier)}
                  </td>
                  <td>
                    <span className={styles.rateIcons}>
                      {rate.mccTags.map((tag) => (
                        <CategoryIcon key={tag} category={tag} />
                      ))}
                    </span>
                    {rate.description}
                    {rate.capped && <span className={styles.cappedChip}>Capped</span>}
                  </td>
                  <td className={styles.scope}>{formatScopeLabel(rate.locationScope)}</td>
                  <td className={styles.estimate}>
                    {formatPercent(toEstimatedValuePercent(card, rate))}
                    {rate.mccTags.includes("usd-spend") && fxFee > 0 && (
                      <span className={styles.estimateNote}>
                        {formatPercent(toEstimatedValuePercent(card, rate) - fxFee)} after FX fee
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {card.specificBrands?.length ? (
          <>
            <h3 className={styles.subTitle}>At specific brands</h3>
            <ul className={styles.brandList}>
              {card.specificBrands.map((brandRate) => (
                <li key={brandRate.id}>
                  <strong>
                    {brandRate.id}{" "}
                    {formatSpecificBrandRate(
                      card.rewardType,
                      brandRate.rateMultiplier,
                      brandRate.description,
                    )}
                  </strong>
                  <span>{brandRate.description}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {card.caps?.length ? (
          <>
            <h3 className={styles.subTitle}>Caps and limits</h3>
            <ul className={styles.capList}>
              {card.caps.map((cap) => (
                <li key={cap}>{cap}</li>
              ))}
            </ul>
          </>
        ) : null}

        {valueNotes && <p className={styles.valueNote}>{valueNotes}</p>}
      </section>

      <div className={styles.twoCol}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Reasons to get it</h2>
          <ul className={`${styles.markList} ${styles.pros}`}>
            {card.pros.map((pro) => (
              <li key={pro}>{pro}</li>
            ))}
          </ul>
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Reasons to skip it</h2>
          <ul className={`${styles.markList} ${styles.cons}`}>
            {card.cons.map((con) => (
              <li key={con}>{con}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className={styles.twoCol}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Perks and lounge access</h2>
          <ul className={`${styles.markList} ${styles.pros}`}>
            {card.lounges?.map((lounge) => (
              <li key={lounge.program}>
                {lounge.program}: {formatLoungeVisits(lounge.freeVisitsPerYear).toLowerCase()}
                {lounge.freeVisitsPerYear === "UNLIMITED" && " visits"}
                {lounge.note && ` (${lounge.note})`}
              </li>
            ))}
            {card.keyBenefits?.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>
          {!card.lounges?.length && <p className={styles.emptyNote}>No lounge access included.</p>}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Insurance</h2>
          {card.insurance?.length ? (
            <dl className={styles.insurance}>
              {card.insurance.map((item) => (
                <div key={item.kind}>
                  <dt>{INSURANCE_LABELS[item.kind]}</dt>
                  <dd>{item.coverage}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className={styles.emptyNote}>No insurance included.</p>
          )}
        </section>
      </div>

      {card.notes ? (
        <p className={styles.noteSection}>
          <strong>Good to know: </strong>
          {card.notes}
        </p>
      ) : null}

      <footer className={styles.sources}>
        <p>Last checked {formatDate(card.verifiedOn)}. Confirm with the issuer before you apply.</p>
        <ul>
          {card.sourceUrl && (
            <li>
              <a href={card.sourceUrl} target="_blank" rel="noopener noreferrer">
                Official page ({new URL(card.sourceUrl).hostname})
              </a>
            </li>
          )}
          {card.sources?.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                {source.label}
              </a>
            </li>
          ))}
        </ul>
      </footer>
    </main>
  );
};

export default CardDetailPage;
