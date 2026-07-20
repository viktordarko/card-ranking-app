import { describe, expect, it } from "vitest";
import { CARDS } from "./cards";
import { SPENDING_CATEGORIES } from "./categories";

const registryIds = new Set(SPENDING_CATEGORIES.map((category) => category.id));

describe("spending-category registry", () => {
  it("has a unique id per category", () => {
    expect(registryIds.size).toBe(SPENDING_CATEGORIES.length);
  });

  it("defines exactly one base category (the Base earn row)", () => {
    const baseCategories = SPENDING_CATEGORIES.filter(
      (category) => category.kind === "base",
    );
    expect(baseCategories).toHaveLength(1);
    expect(baseCategories[0]?.id).toBe("general");
  });

  it("has a registry entry for every tag used in card data", () => {
    // The matrix rows and legend derive from the registry, so a tag without an
    // entry would silently lose its row/definition even though it type-checks.
    for (const card of CARDS) {
      const rates = [...card.earnRates, ...(card.specificBrands ?? [])];
      for (const rate of rates) {
        for (const tag of rate.mccTags) {
          expect(registryIds.has(tag), `${card.id} / ${rate.id} → ${tag}`).toBe(
            true,
          );
        }
      }
    }
  });

  it("keeps every bonus category earned by at least one card (no phantom rows)", () => {
    const usedTags = new Set(
      CARDS.flatMap((card) => card.earnRates.flatMap((rate) => rate.mccTags)),
    );
    for (const category of SPENDING_CATEGORIES) {
      if (category.kind === "bonus") {
        expect(usedTags.has(category.id), category.id).toBe(true);
      }
    }
  });

  it("gives every category a plain-language description", () => {
    for (const category of SPENDING_CATEGORIES) {
      expect(category.description.length, category.id).toBeGreaterThan(0);
    }
  });
});
