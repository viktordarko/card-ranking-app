import type { Card } from "../types/card";

interface CardDetailsProps {
  card: Card;
}

const CardDetails = ({ card }: CardDetailsProps) => {
  return (
    <div>
      <h1>{card.displayName}</h1>
      <p>
        <strong>Network:</strong> {card.network}
      </p>
      <p>
        <strong>Reward Type:</strong> {card.rewardType}
      </p>
      <p>
        <strong>Annual Fee:</strong> ${card.annualFee}
      </p>
      <p>
        <strong>FX Policy:</strong>{" "}
        {card.fxPolicy.hasFxFee ?
          `${card.fxPolicy.fxFeePercent ?? 0}% FX fee`
        : "No FX fee"}
      </p>
      <h2>Earn Rates</h2>
      <ul>
        {card.earnRates.map((rate) => (
          <li key={rate.id}>
            {rate.description}: {rate.rateMultiplier}x ({rate.locationScope})
          </li>
        ))}
      </ul>
      <h2>Lounge Benefits</h2>
      <p>
        {card.lounges?.length ?
          card.lounges
            .map((lounge) => `${lounge.program} (${lounge.freeVisitsPerYear})`)
            .join(", ")
        : "None"}
      </p>
      {card.notes && (
        <>
          <h2>Notes</h2>
          <p>{card.notes}</p>
        </>
      )}
    </div>
  );
};

export default CardDetails;
