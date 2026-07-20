import type { SpendingCategory } from "../types/category";

/**
 * Single source of truth for what each spending category means. The comparison
 * matrix derives its category rows (and their tooltips) from this list, and the
 * legend under the matrix renders it in full, so the table and its definitions
 * can never drift apart.
 *
 * Issuers bucket a purchase by how the merchant is *coded* (its merchant
 * category code), not by what was bought — which is where most category
 * confusion comes from. Each entry therefore keeps to one description, a few
 * examples, and at most one "watch out" for the miscoding that actually bites.
 * The `kind: "bonus"` entries appear in matrix-row order.
 */
export const SPENDING_CATEGORIES: SpendingCategory[] = [
  {
    id: "usd-spend",
    kind: "bonus",
    label: "USD spend",
    description: "Purchases charged in US dollars, online or while travelling.",
    includes: ["US online stores", "US-billed subscriptions", "purchases in the US"],
    watchOut:
      "A ~2.5% FX fee applies on most cards and eats much of a USD bonus unless the card waives it.",
  },
  {
    id: "restaurant",
    kind: "bonus",
    label: "Dining",
    description: "Restaurants, bars, cafés, fast food, and food delivery.",
    includes: ["Sit-down restaurants", "coffee shops", "Uber Eats / DoorDash"],
    watchOut:
      "Food bought inside a hotel, store, or venue can code as that venue instead of dining.",
  },
  {
    id: "groceries",
    kind: "bonus",
    label: "Groceries",
    description: "Stand-alone grocery stores and supermarkets.",
    includes: ["Loblaws", "Metro", "Sobeys / IGA", "No Frills"],
    watchOut:
      "Walmart and Costco usually code as general merchandise or wholesale club, so most cards pay only the base rate there.",
  },
  {
    id: "gas",
    kind: "bonus",
    label: "Gas",
    description: "Gas stations — and EV charging on many newer cards.",
    includes: ["Petro-Canada", "Esso", "Shell", "Ultramar"],
    watchOut:
      "Warehouse-club pumps (e.g. Costco gas) can code as the club rather than a gas station on some cards.",
  },
  {
    id: "travel",
    kind: "bonus",
    label: "Travel",
    description: "Flights, hotels, car rentals, and other travel bookings.",
    includes: ["Airlines", "hotels", "car rentals", "tour operators"],
    watchOut:
      "Some cards only pay their travel bonus on bookings made through the issuer's own travel portal.",
  },
  {
    id: "transit",
    kind: "bonus",
    label: "Transit",
    description: "Daily public transit and local rides.",
    includes: ["Bus / subway / commuter fares", "taxis", "rideshares"],
    watchOut:
      "Fares bought through municipal apps sometimes code as government services and miss the bonus.",
  },
  {
    id: "entertainment",
    kind: "bonus",
    label: "Entertainment",
    description: "Movie theatres, concerts, and other entertainment venues.",
    includes: ["Cinemas", "theatres", "concerts", "attractions"],
    watchOut:
      "Streaming is usually a separate, narrower list of named services — not part of general entertainment.",
  },
  {
    id: "general",
    kind: "base",
    label: "Base earn",
    description:
      "Everything that doesn't fall in a bonus category — the card's default rate.",
  },
  {
    id: "ct-stores",
    kind: "brand",
    label: "Canadian Tire stores",
    description:
      "The Canadian Tire family of stores — a brand perk, not a true merchant category.",
    includes: ["Canadian Tire", "Sport Chek", "Mark's", "Atmosphere"],
  },
];
