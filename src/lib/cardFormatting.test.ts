import { describe, expect, it } from "vitest";
import {
  formatLoungeVisits,
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
