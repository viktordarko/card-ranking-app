import { notFound } from "next/navigation";
import styles from "./page.module.css";
import { CARDS } from "../../../data/cards";

export function generateStaticParams() {
    return CARDS.map((card) => ({ id: card.id }));
}

export const dynamicParams = false;

export default async function CardDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const card = CARDS.find((item) => item.id === id);

    if (!card) {
        notFound();
    }

    return (
        <main className={styles.main}>
            <h1>{card.displayName}</h1>
            <p className={styles.metaRow}>
                {card.issuer} | {card.network} | {card.rewardType}
            </p>
            {card.rewardCurrency ? <p>Reward currency: {card.rewardCurrency}</p> : null}
            {card.cardType ? <p>Card type: {card.cardType}</p> : null}
            {card.minimumIncome ? <p>Minimum income: {card.minimumIncome}</p> : null}
            <p>Annual fee: ${card.annualFee}</p>
            {typeof card.additionalCardFee === "number" ? <p>Additional card fee: ${card.additionalCardFee}</p> : null}
            <p>FX policy: {card.fxPolicy.hasFxFee ? `${card.fxPolicy.fxFeePercent ?? 0}% FX fee` : "No FX fee"}</p>

            <section>
                <h2>Earn rates</h2>
                <ul>
                    {card.earnRates.map((rate) => (
                        <li key={rate.id}>
                            {rate.description} | {rate.rateMultiplier}x | {rate.locationScope}
                        </li>
                    ))}
                </ul>
            </section>

            <section>
                <h2>Lounge benefits</h2>
                {card.lounges?.length ? (
                    <ul>
                        {card.lounges.map((benefit) => (
                            <li key={benefit.program}>
                                {benefit.program}: {benefit.freeVisitsPerYear}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>None</p>
                )}
            </section>

            {card.caps?.length ? (
                <section>
                    <h2>Caps and limitations</h2>
                    <ul>
                        {card.caps.map((cap) => (
                            <li key={cap}>{cap}</li>
                        ))}
                    </ul>
                </section>
            ) : null}

            {card.keyBenefits?.length ? (
                <section>
                    <h2>Key ongoing benefits</h2>
                    <ul>
                        {card.keyBenefits.map((benefit) => (
                            <li key={benefit}>{benefit}</li>
                        ))}
                    </ul>
                </section>
            ) : null}

            {card.notes ? (
                <section>
                    <h2>Notes</h2>
                    <p>{card.notes}</p>
                </section>
            ) : null}
        </main>
    );
}