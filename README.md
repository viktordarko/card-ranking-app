# Card Ranking Application

Scenario-based credit card recommendation app built with Next.js App Router, TypeScript, CSS Modules, and Lightning CSS.

## Highlights

- Home page scenario form with client-side ranking.
- Card list page with client-side filters.
- Static card detail pages via `generateStaticParams`.
- Typed domain model and selector logic in `src/types` and `src/logic`.

## Tech Stack

- Next.js (App Router)
- TypeScript
- CSS Modules (`*.module.css`)
- Lightning CSS (handled by Next.js 16 CSS pipeline)

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Run dev server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

4. Start production server:

```bash
npm run start
```

## Code Quality

This project uses **oxlint** for fast, strict linting:

```bash
# Run linter (93 rules, all errors)
npm run lint

# Auto-fix violations
npm run lint:fix

# Type checking
npm run typecheck
```

**Oxlint Configuration:** `.oxlintrc.json`

- All available rules enabled at error level (maximum strictness)
- TypeScript strict mode enforced
- ~100x faster than ESLint
- ~5ms full codebase scan on 16 files

## Project Notes

- Card data is currently in `src/data/cards.ts` and can be expanded with real card portfolio data.
- Ranking logic entry point is `rankCardsForScenario` in `src/logic/selector.ts`.
