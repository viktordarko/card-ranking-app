import { describe, expect, it } from "vitest";
import {
  formatAnnualFee,
  formatDate,
  formatDollars,
  formatExtraCardFee,
  formatIncome,
  formatLoungeVisits,
  formatPercent,
  formatRewardRate,
  formatScopeLabel,
  formatSpecificBrandRate,
  getRewardSuffix,
} from "./cardFormatting";

describe("formatRewardRate", () => {
  it("uses % for cash back and x for points/MR", () => {
    expect(formatRewardRate("CASHBACK", 3)).toBe("3%");
    expect(formatRewardRate("POINTS", 5)).toBe("5x");
    expect(formatRewardRate("MR", 2)).toBe("2x");
  });

  it("renders a dash for a zero rate instead of '0x' / '0%'", () => {
    expect(formatRewardRate("CASHBACK", 0)).toBe("-");
    expect(formatRewardRate("POINTS", 0)).toBe("-");
  });
});

describe("getRewardSuffix", () => {
  it("maps each reward type to its unit", () => {
    expect(getRewardSuffix("CASHBACK")).toBe("%");
    expect(getRewardSuffix("POINTS")).toBe("x");
    expect(getRewardSuffix("MR")).toBe("x");
  });
});

describe("formatSpecificBrandRate", () => {
  it("renders a cents-per-litre fuel rebate as dollars, not a percentage", () => {
    // Guards the per-litre detection regex: a $0.05/L rebate must never show as
    // "0.05%".
    expect(
      formatSpecificBrandRate("CASHBACK", 0.05, "5 cents per litre CT Money at Petro-Canada"),
    ).toBe("+$0.05/L");
    expect(formatSpecificBrandRate("CASHBACK", 0.1, "10 cents per litre at Ultramar")).toBe(
      "+$0.10/L",
    );
  });

  it("renders non-fuel brand rates in native units", () => {
    expect(formatSpecificBrandRate("POINTS", 6, "6x at IGA")).toBe("6x");
    expect(formatSpecificBrandRate("CASHBACK", 3, "3% at Costco gas")).toBe("3%");
  });
});

describe("formatLoungeVisits", () => {
  it("distinguishes unlimited, paid-only, and a fixed count", () => {
    expect(formatLoungeVisits("UNLIMITED")).toBe("Unlimited");
    expect(formatLoungeVisits(0)).toBe("Paid only");
    expect(formatLoungeVisits(6)).toBe("6/yr");
  });
});

describe("formatScopeLabel", () => {
  it("maps every location scope to a human label", () => {
    expect(formatScopeLabel("CA_ONLY")).toBe("Canada only");
    expect(formatScopeLabel("NETWORK_USD")).toBe("USD transactions");
    expect(formatScopeLabel("WORLDWIDE")).toBe("Worldwide");
  });
});

describe("formatDate", () => {
  it("keeps the calendar day in every time zone", () => {
    // Parsed as local time, Dec 31 UTC would read Dec 30 in Canada.
    expect(formatDate("2026-12-31")).toBe("Dec 31, 2026");
    expect(formatDate("2027-01-01")).toBe("Jan 1, 2027");
  });
});

describe("money and percentages", () => {
  it("formats whole dollars, and spells out a free card", () => {
    expect(formatDollars(1139)).toBe("$1,139");
    expect(formatAnnualFee(0)).toBe("No fee");
    expect(formatAnnualFee(799)).toBe("$799");
  });

  it("trims float noise and keeps the sign", () => {
    expect(formatPercent(0.1 + 0.2)).toBe("0.3%");
    expect(formatPercent(-0.5)).toBe("-0.5%");
  });
});

describe("formatExtraCardFee", () => {
  it("distinguishes a price, a free card, and one that doesn't need an extra", () => {
    expect(formatExtraCardFee({ annualFee: 139, additionalCardFee: 75 })).toBe("$75");
    expect(formatExtraCardFee({ annualFee: 0, additionalCardFee: 0 })).toBe("Free");
    expect(formatExtraCardFee({ annualFee: 0 })).toBe("N/A");
    expect(formatExtraCardFee({ annualFee: 120 })).toBe("Not published");
  });
});

describe("formatIncome", () => {
  it("joins the thresholds, falls back to the note, then says it is unknown", () => {
    expect(formatIncome({ personal: 80_000, household: 150_000 })).toBe(
      "$80,000 personal or $150,000 household",
    );
    expect(formatIncome({ note: "No minimum" })).toBe("No minimum");
    expect(formatIncome(undefined)).toBe("Not published");
  });
});
