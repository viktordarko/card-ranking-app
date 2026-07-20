# Architecture

This document explains how the app is structured, how the domain is modeled, and
how the reward-valuation and comparison logic work. For setup and scripts, see the
[README](./README.md).

## Overview

The app is a **fully static** Next.js (App Router) site. There is no backend, no
database, and no runtime data fetching. All credit-card data lives in versioned
TypeScript files, and every page is prerendered at build time.

The codebase is deliberately layered so that **data**, **domain logic**, and
**presentation** stay independent:

```
  data (typed card records)
        │
        ▼
  types (shared domain model)
        │
        ▼
  lib (pure valuation / comparison / formatting functions)
        │
        ▼
  app + components (React Server/Client Components)
```

Everything below `app/` is presentation. Everything in `lib/` is pure functions
with no React or Next.js imports, which keeps the ranking/valuation logic easy to
reason about and unit-testable in isolation.

## Directory layout

```
src/
├── app/                      # Next.js App Router (routes + layout)
│   ├── layout.tsx            # Root layout, site header, global metadata
│   ├── globals.css           # Global reset + site chrome styles
│   ├── page.tsx              # "/"  — page shell (Server Component)
│   ├── page.module.css
│   └── [id]/
│       ├── page.tsx          # "/[id]" — card detail (SSG + generateMetadata)
│       └── page.module.css
├── components/               # "/" client island, split into focused pieces
│   ├── ComparisonMatrix.tsx  #   orchestrator: state, filtering, faceting
│   ├── comparisonFilters.ts  #   pure useReducer state (selection + filters)
│   ├── CardPicker.tsx        #   tier 1 — choose which cards to compare
│   ├── FilterBar.tsx         #   tier 2 — network / reward / perks filters
│   ├── FilterPill.tsx        #   reusable toggle pill (count + disabled state)
│   ├── ActiveFilters.tsx     #   applied-filter summary + reset
│   ├── MatrixTable.tsx       #   the side-by-side comparison table
│   ├── CategoryLegend.tsx    #   static "what counts in each category?" reference
│   ├── ThemeToggle.tsx       #   light/dark switch in the header
│   └── *.module.css          #   co-located styles per component
├── data/
│   ├── cards.ts              # The card portfolio (source of truth)
│   ├── categories.ts         # Spending-category registry (definitions + gotchas)
│   └── rewardValuations.ts   # Reward-currency → value profiles
├── lib/
│   ├── rewardValuation.ts    # Points/cashback → estimated % value
│   ├── cardComparison.ts     # Comparison-matrix rows + best/worst highlighting
│   └── cardFormatting.ts     # Display formatting helpers
└── types/
    ├── card.ts               # Card, EarnRate, FxPolicy, LoungeBenefit, …
    ├── category.ts           # CategoryId union + SpendingCategory
    └── rewardValue.ts        # RewardValueProfile + profile ids
```

## Domain model

The domain model lives in [`src/types`](./src/types) and is the contract every
other layer depends on.

### `Card` ([`types/card.ts`](./src/types/card.ts))

A `Card` describes one credit card: its issuer, network, reward type, fees, FX
policy, and a list of **earn rates**. Notable fields:

| Field                                                       | Purpose                                                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `rewardType`                                                | `"MR" \| "CASHBACK" \| "POINTS"` — drives how rates are displayed (`x` vs `%`).                        |
| `rewardValueProfileId`                                      | Links the card to a `RewardValueProfile` used to convert points/cashback into an estimated cash value. |
| `annualFee` / `additionalCardFee`                           | Used directly in the comparison matrix.                                                                |
| `fxPolicy`                                                  | `{ hasFxFee, fxFeePercent? }` — foreign-transaction fee.                                               |
| `earnRates`                                                 | The list of `EarnRate`s (see below).                                                                   |
| `lounges`, `caps`, `specificBrands`, `keyBenefits`, `notes` | Optional benefit metadata shown on the detail page.                                                    |

### `EarnRate`

Each `EarnRate` captures a single earning rule:

- `rateMultiplier` — the multiplier (`2` for 2x points) or percentage (`3` for 3%).
- `mccTags` — the categories the rate applies to, typed as `CategoryId` (a closed
  union — a typo'd tag is a compile error, not a silently missing bonus). Category
  meanings live in the spending-category registry (below).
- `locationScope` — `"CA_ONLY" | "WORLDWIDE" | "NETWORK_USD"`, which governs where
  the rate is eligible.

### Spending categories ([`data/categories.ts`](./src/data/categories.ts))

Issuers bucket a purchase by how the merchant is **coded** (its merchant category
code), not by what was bought — which is where most category confusion comes
from ("why didn't my Walmart groceries earn the grocery rate?"). The registry is
the single source of truth for what each category means. Each `SpendingCategory`
carries:

- `label` + a one-sentence plain-language `description`;
- `includes` — a few example merchants to make it concrete;
- `watchOut` — **at most one** caveat: the miscoding most likely to surprise
  someone (e.g. Walmart/Costco usually coding as general merchandise, not
  groceries). This limit is deliberate: cap amounts, reset periods, and shared
  cap pools are *card* facts, so they stay in each card's `caps`, and the
  category definitions stay readable instead of becoming a rules manual.
- `kind` — `"bonus"` (gets a comparison-matrix row), `"base"` (the Base earn
  row), or `"brand"` (a retailer family like Canadian Tire stores — real earn
  data, but not a true merchant category, so never a comparison row).

The matrix's category rows (and their hover tooltips) and the
[`CategoryLegend`](./src/components/CategoryLegend.tsx) under the table are both
derived from this registry, so the table, tooltips, and legend can never drift
apart — and adding a category is a data edit, not a UI change.

### `RewardValueProfile` ([`types/rewardValue.ts`](./src/types/rewardValue.ts))

A profile assigns a **cents-per-point** (for points/MR) or a **percent-unit
multiplier** (for cashback) to a reward currency, plus notes explaining the
assumption. Profiles are defined in
[`data/rewardValuations.ts`](./src/data/rewardValuations.ts) — for example
`MR_AMEX = 2.0¢`, `SCENE_PLUS = 1.0¢`, `CASHBACK_ROGERS_BOOSTED = 1.5×`.

Keeping valuations in one place means changing "how much an Aeroplan point is
worth" is a one-line edit that ripples through the whole comparison.

## Reward valuation ([`lib/rewardValuation.ts`](./src/lib/rewardValuation.ts))

Different cards earn in different currencies, so to compare them fairly every earn
rate is normalized to an **estimated percentage of cash value**:

```
estimatedValuePercent = rateMultiplier × profile.centsPerPointOrPercentUnit
```

Examples:

- A `2x` Membership Rewards rate at `2.0¢/pt` → **4%** estimated value.
- A `3%` standard cashback rate at `1.0×` → **3%** estimated value.
- A `3%` Rogers USD rate at the boosted `1.5×` profile → **4.5%** estimated value.

`toEstimatedBaseValuePercent` does the same for a card's best `"general"`
(non-bonus) rate, which is used as the fallback "base earn" figure.

> The valuations are intentionally conservative baselines. Point currencies like
> Membership Rewards and Aeroplan can be worth substantially more with optimal
> transfer-partner redemptions; the profile `notes` document these assumptions.

One valuation rule is worth spelling out — the **transfer floor**: a transferable
currency is never valued below its best 1:1 transfer partner. Membership Rewards
transfers 1:1 to Aeroplan, so `MR_AMEX` and `AEROPLAN` are both 2.0¢. Guides that
value MR *below* Aeroplan are internally inconsistent — every Aeroplan redemption
is reachable from MR at 1:1, and MR additionally keeps other airline/hotel
partners and non-travel options, so its value can only be **at least** Aeroplan's
(the extra optionality shows up in `redemption.flexibility`, where MR scores 4 to
Aeroplan's 3, not in the cent value).

### Value vs. redemption flexibility

The point value answers **"how much is a unit worth?"** — deliberately _not_ **"how
easy is it to redeem?"** Conflating the two is misleading, so they are modelled as
separate layers:

- **Canadian Tire Money** is worth a full **1.0¢** (1:1), the same as cash back —
  but it can only be spent at Canadian Tire. That is a _redemption_ limitation, not
  a lower value, so it lives on the card (`redemption.flexibility`), **not** in the
  point value.
- **Rogers** cash back genuinely _is_ worth **1.5¢** — but only when redeemed
  toward Rogers/Fido/Shaw bills. That is a real (conditional) value, so it stays in
  the point value, with the condition surfaced in the card's `notes`.

Each card carries a `redemption` descriptor (`types/card.ts`) scored **1–5**, ranked
by _where you can direct the value_ — not by how much it is worth:

| Score | Meaning                                              | Example                                                       |
| ----- | ---------------------------------------------------- | ------------------------------------------------------------- |
| 5     | Cash, or a certificate you can cash out              | CIBC Costco — the warehouse register pays any overage in cash |
| 4     | Statement credit, or points transferable to partners | Amex MR, CIBC Dividend                                        |
| 3     | Program points (travel / groceries within a program) | Scene+, Aeroplan                                              |
| 2     | Conditional — full value only in a narrow way        | Rogers — toward Rogers/Fido/Shaw bills                        |
| 1     | A single specific retailer, non-cashable             | Triangle — Canadian Tire Money                                |

The comparison's **Redemption** row shows the label and ranks the score — and the
score doubles as the **tiebreaker** in the earn-rate rows: when two cards return
the same estimated value, the more flexible one alone takes the best-in-row
highlight. This is why Costco and Triangle —
both "store" rewards worth a full 1.0¢ on earn value — sit at opposite ends: the
Costco certificate is effectively cashable, while CT Money is locked to Canadian
Tire.

## Comparison matrix ([`lib/cardComparison.ts`](./src/lib/cardComparison.ts))

The home page renders a matrix of **cards (columns) × attributes (rows)**. The row
model lives in `lib/`; the interactive UI lives in the
[`ComparisonMatrix`](./src/components/ComparisonMatrix.tsx) client component (see
[Rendering strategy](#rendering-strategy)). Each row is described declaratively by
a `ComparisonRowDef`:

```ts
interface ComparisonRowDef {
  label: string;
  tooltip?: string; // hover definition (category rows)
  value: (card: Card) => ComparisonCell; // what to display
  numericValue?: (card: Card) => number; // basis for best/worst
  lowerIsBetter?: boolean; // e.g. fees
  tiebreak?: (card: Card) => number; // breaks numericValue ties (earn rows)
}
```

`COMPARISON_ROWS` defines the rows: Network, Reward currency, Annual fee, Auth card
fee, FX fee, the **category rows** (USD spend, Dining, Groceries, Gas, Travel,
Transit, Entertainment — generated from the spending-category registry's `"bonus"`
entries, in registry order; each label links to the category's `CategoryLegend`
entry via `categoryId` and carries a hover `tooltip` with the definition and
watch-out), Base earn, Lounge, Brand/partner perks, and Redemption.
Category cells whose accelerated rate reverts past an annual spend cap
(`EarnRate.capped`) show a small **capped** badge, since the headline is an "up
to" rate.

Two details worth highlighting:

- **Native units, normalized ranking.** A cell _displays_ values in each card's
  own units (`5x` for points, `3%` for cashback) via `cardFormatting`, but the
  best/worst comparison uses the normalized `numericValue` (estimated % value or
  raw fee), so a points card and a cashback card can be compared apples-to-apples.
- **Best / worst highlighting.** `computeRowWinners` and `computeRowWorst`
  (both thin wrappers over `computeRowExtremes`) compute, per numeric row, the set
  of card ids holding the best and worst value — respecting `lowerIsBetter` for fee
  rows. On earn rows, a tie on estimated value is broken by **redemption
  flexibility** (`row.tiebreak`): between two cards returning the same percentage,
  the one whose rewards are easier to use is genuinely better, so it alone takes
  the highlight (e.g. Amex Platinum's transferable MR beats Scene+ when both earn
  an estimated 4% on travel — and a card's mere base rate can't share gold with a
  true accelerator worth the same on paper). Only cards tied on value *and*
  flexibility share; fee rows keep plain ties. `ComparisonMatrix` recomputes all
  of this over the **currently filtered** cards (and skips highlighting when fewer
  than two cards are shown), so "best in row" always reflects what's on screen.

Category cells also surface **fallback behavior** — e.g. "5x … falls back to 1x on
non-bonus spend" — so a headline rate is never shown without its caveat.

## Formatting ([`lib/cardFormatting.ts`](./src/lib/cardFormatting.ts))

Small, pure display helpers: reward-rate suffixes (`x` vs `%`), per-litre gas
rebates (`+$0.05/L`), and human-readable location-scope labels. Isolating these
keeps the components free of formatting branches.

## Rendering strategy

| Route   | File                                           | Rendering                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`     | [`app/page.tsx`](./src/app/page.tsx)           | Static **Server Component** shell (heading + metadata) that renders the [`ComparisonMatrix`](./src/components/ComparisonMatrix.tsx) **client island**. `ComparisonMatrix` owns all the state and derived data and composes presentational pieces — [`CardPicker`](./src/components/CardPicker.tsx), [`FilterBar`](./src/components/FilterBar.tsx) (built from a reusable [`FilterPill`](./src/components/FilterPill.tsx)), [`ActiveFilters`](./src/components/ActiveFilters.tsx), and [`MatrixTable`](./src/components/MatrixTable.tsx). The per-card picker, filtering (network, reward type, no-FX, lounge), and best/worst recomputation run in the browser. The selection + filter state is one cohesive unit driven by `useReducer` ([`comparisonFilters.ts`](./src/components/comparisonFilters.ts) — a pure, unit-tested reducer), with derived data (filtered cards, faceted counts, winners) via `useMemo`; the picker and filters compose (a card shows only if it is both selected and passes every filter), and winners are recomputed over whatever set is visible. Each filter option carries a **live faceted count** and is **disabled when choosing it would leave zero cards** — computed against every _other_ active filter, so a filter can never empty the table. Applied filters are echoed as removable tags in `ActiveFilters` with a one-click **Reset filters** (separate from the picker's own **Clear**). Below the island, the page renders the static [`CategoryLegend`](./src/components/CategoryLegend.tsx) Server Component. The initial HTML is prerendered at build time. |
| `/[id]` | [`app/[id]/page.tsx`](./src/app/[id]/page.tsx) | SSG. `generateStaticParams` prerenders one page per card and `generateMetadata` gives each its own `<title>`; `dynamicParams = false` returns 404 for unknown ids. Static routes (`/`) take precedence over the dynamic segment.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

Because all data is local and known at build time, `next build` prerenders every
route to static HTML (see the route table in the build output). Deploy it to any
Next.js-compatible host (e.g. Vercel), or add `output: "export"` to
[`next.config.ts`](./next.config.ts) to produce a pure static bundle for any CDN.

## Styling

- **CSS Modules** (`*.module.css`) scope styles per component/route.
- A single [`globals.css`](./src/app/globals.css) provides the reset, site
  chrome (header/nav), and the theming token layer.
- No CSS framework or runtime CSS-in-JS; styling is compiled by Next.js's built-in
  CSS pipeline.

### Theming (light / dark)

Colors are not hardcoded in the component styles — every surface, border, text,
and status color resolves to a **semantic design token** (a CSS custom property
such as `--surface`, `--text-muted`, `--best-bg`) defined once in
[`globals.css`](./src/app/globals.css). The CSS modules only reference
`var(--token)`, so a theme is just a different set of token values.

The dark palette is applied through two triggers:

1. **OS preference** — `@media (prefers-color-scheme: dark)` scoped to
   `:root:not([data-theme="light"])`. System dark-mode users get the dark theme
   on the very first paint with **no JavaScript**, so there is no flash.
2. **Explicit override** — `:root[data-theme="dark"]` (and `="light"`) wins over
   the OS setting. The [`ThemeToggle`](./src/components/ThemeToggle.tsx) client
   component sets that attribute and persists the choice to `localStorage`; a tiny
   inline script in [`layout.tsx`](./src/app/layout.tsx) re-applies a stored
   override before paint (hence `suppressHydrationWarning` on `<html>`). The theme
   is a browser-only value (localStorage override, else OS preference), so the
   toggle **reads** it with [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore)
   rather than mirroring it into React state with an effect — that keeps it
   SSR-safe, keeps it in sync with the OS (`matchMedia`) when no override is set,
   and syncs across tabs (`storage`). `color-scheme` is set per theme so native
   form controls and scrollbars match.

The branded table header stays deep blue in both themes by design; only the
on-blue text uses fixed `rgba(255,255,255,…)` values rather than tokens.

## Tooling

- **[oxlint](https://oxc.rs/docs/guide/usage/linter)** for linting — configured in
  [`.oxlintrc.json`](./.oxlintrc.json). The `correctness` and `suspicious` rule
  categories run at error level across the TypeScript, React, Next.js, Promise,
  Unicorn, and **jsx-a11y** (accessibility) plugins, plus a curated set of stricter
  rules enabled explicitly: `no-explicit-any`, `no-non-null-assertion`,
  `consistent-type-imports`, and `eqeqeq`.

  > The whole `pedantic` / `style` / `restriction` categories are intentionally
  > **not** enabled: they contain opinionated and mutually contradictory rules
  > (e.g. `no-default-export` vs `prefer-default-export`, `sort-keys`,
  > `no-magic-numbers`, `jsx-no-literals`) that fight this app's data-driven design
  > rather than catch real defects. Strictness here means high-signal rules, not
  > maximum noise.

- **`tsc --noEmit`** for type checking, in TypeScript `strict` mode **plus**
  `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`,
  `noUnusedLocals`, and `noUnusedParameters` (see [`tsconfig.json`](./tsconfig.json)).

## Testing

[Vitest](https://vitest.dev/) unit tests live next to the pure logic they cover
(`src/**/*.test.ts`). The suite is deliberately about **catching real regressions**,
not coverage for its own sake — every test either pins a behaviour that would
otherwise break silently or guards a decision baked into the model:

- **Data integrity** ([`data/cards.test.ts`](./src/data/cards.test.ts)) — the most
  valuable set for a data-driven app. Asserts unique ids, that every
  `rewardValueProfileId` resolves (a typo would silently value a card at 1¢), that
  a rate flagged `capped` has documented `caps`, that FX-charging cards state a
  percentage, that `sourceUrl`s are valid https, etc. These catch the exact
  mistakes made when hand-editing card data.
- **Category registry integrity** ([`data/categories.test.ts`](./src/data/categories.test.ts))
  — every tag used in card data has a registry entry (a missing one would silently
  drop its matrix row and legend definition), every `"bonus"` category is earned by
  at least one card (no phantom rows), and exactly one `"base"` category exists.
  The matrix side is pinned in `cardComparison.test.ts`: category rows appear as a
  contiguous block in registry order, each with a definition tooltip.
- **Valuation & ranking invariants** — flexible points rank above plain cash back,
  a lower fee wins its row (`lowerIsBetter` sign-flip guard), value ties resolve by
  redemption flexibility (sharing the highlight only on full ties), best/worst
  recomputes over a subset, and descriptive rows aren't ranked.
- **Regression guards for specific decisions** — CT Money stays at full 1¢ value
  (its constraint is redemption, not value), TD claims no general-travel bonus
  (Air Canada is a brand perk), Rogers USD shows its boosted value, and `capped`
  markers appear only on capped accelerators.

Run with `pnpm test`; the same command runs in CI
([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)) alongside lint,
type-check, and build on every push and pull request.

## Extending the app

- **Add a card:** append a `Card` object to
  [`data/cards.ts`](./src/data/cards.ts). It automatically appears in the matrix
  (and its filters) and gets its own statically generated detail page.
- **Add a spending category:** add the id to `CategoryId`
  ([`types/category.ts`](./src/types/category.ts)) and an entry to
  [`data/categories.ts`](./src/data/categories.ts). A `"bonus"` category gets its
  matrix row, tooltip, and legend entry automatically.
- **Retune valuations:** edit the relevant profile in
  [`data/rewardValuations.ts`](./src/data/rewardValuations.ts).
- **Add a comparison row:** push a new `ComparisonRowDef` onto `COMPARISON_ROWS` in
  [`lib/cardComparison.ts`](./src/lib/cardComparison.ts).
