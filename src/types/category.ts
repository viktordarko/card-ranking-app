/**
 * The merchant categories an earn rate can target. A closed union (rather than
 * free-form strings) so a typo'd tag in card data is a compile error, not a
 * silently missing bonus.
 */
export type CategoryId =
  | "usd-spend"
  | "restaurant"
  | "groceries"
  | "gas"
  | "travel"
  | "transit"
  | "entertainment"
  | "general"
  | "ct-stores";

/**
 * - "bonus" — a merchant category cards accelerate; gets its own matrix row.
 * - "base"  — the catch-all default rate; surfaces as the Base earn row.
 * - "brand" — a specific retailer family rather than a true merchant category;
 *   shown on detail pages and in the legend, never as a comparison row.
 */
export type CategoryKind = "bonus" | "base" | "brand";

export interface SpendingCategory {
  id: CategoryId;
  kind: CategoryKind;
  /** Row label in the comparison matrix and the legend. */
  label: string;
  /** One plain-language sentence: what spending falls in this category. */
  description: string;
  /** Example merchants/purchases that make the description concrete. */
  includes?: string[];
  /** The single most common way this category surprises people. At most one
   * caveat, deliberately — cap amounts and reset rules are card facts, not
   * category facts, and live in each card's `caps`. */
  watchOut?: string;
}
