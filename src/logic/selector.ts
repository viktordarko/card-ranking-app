import type { Card, EarnRate } from "../types/card";

export type MerchantType =
    | "restaurant"
    | "travel"
    | "groceries"
    | "gas"
    | "transit"
    | "pharmacy"
    | "general";

export type ScenarioLocation = "CANADA" | "FOREIGN";
export type ScenarioCurrency = "CAD" | "USD" | "OTHER";

export interface ScenarioInput {
    merchantType: MerchantType;
    location: ScenarioLocation;
    currency: ScenarioCurrency;
    requireNoFxFee: boolean;
    requireLoungeAccess: boolean;
    topN?: number;
}

export interface ScoredCard {
    cardId: string;
    cardName: string;
    effectiveMultiplier: number;
    matchedRateDescription: string;
    fxPolicySummary: string;
    loungeSummary: string;
    card: Card;
}

function rateEligibleForScenario(rate: EarnRate, scenario: ScenarioInput): boolean {
    if (scenario.location === "CANADA") {
        return rate.locationScope === "CA_ONLY" || rate.locationScope === "WORLDWIDE";
    }

    if (rate.locationScope === "WORLDWIDE") {
        return true;
    }

    if (scenario.currency === "USD" && rate.locationScope === "NETWORK_USD") {
        return true;
    }

    return false;
}

function toFxSummary(card: Card): string {
    if (!card.fxPolicy.hasFxFee) {
        return "No FX fee";
    }

    return `${card.fxPolicy.fxFeePercent ?? 0}% FX fee`;
}

function toLoungeSummary(card: Card): string {
    if (!card.lounges?.length) {
        return "No lounge access";
    }

    return card.lounges.map((lounge) => `${lounge.program} (${lounge.freeVisitsPerYear})`).join(", ");
}

export function rankCardsForScenario(cards: Card[], scenario: ScenarioInput): ScoredCard[] {
    const filteredCards = cards.filter((card) => {
        if (scenario.requireNoFxFee && card.fxPolicy.hasFxFee) {
            return false;
        }

        if (scenario.requireLoungeAccess && !card.lounges?.length) {
            return false;
        }

        return true;
    });

    const scored = filteredCards.map((card) => {
        const eligibleRates = card.earnRates.filter((rate) => rateEligibleForScenario(rate, scenario));
        const matchedRates = eligibleRates.filter(
            (rate) => rate.mccTags.includes(scenario.merchantType) || rate.mccTags.includes("general"),
        );

        const bestRate = [...matchedRates].sort((a, b) => b.rateMultiplier - a.rateMultiplier)[0];
        const fallbackRate = [...eligibleRates].sort((a, b) => b.rateMultiplier - a.rateMultiplier)[0];
        const selectedRate = bestRate ?? fallbackRate;

        const baseMultiplier = selectedRate?.rateMultiplier ?? 0;
        const fxPenalty =
            scenario.location === "FOREIGN" && card.fxPolicy.hasFxFee
                ? (card.fxPolicy.fxFeePercent ?? 0) / 100
                : 0;

        return {
            cardId: card.id,
            cardName: card.displayName,
            effectiveMultiplier: Number(Math.max(0, baseMultiplier - fxPenalty).toFixed(3)),
            matchedRateDescription: selectedRate?.description ?? "No matching earn rate",
            fxPolicySummary: toFxSummary(card),
            loungeSummary: toLoungeSummary(card),
            card,
        } satisfies ScoredCard;
    });

    scored.sort((a, b) => {
        if (b.effectiveMultiplier !== a.effectiveMultiplier) {
            return b.effectiveMultiplier - a.effectiveMultiplier;
        }

        return a.card.annualFee - b.card.annualFee;
    });

    return scored.slice(0, scenario.topN ?? 5);
}