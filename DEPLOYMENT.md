# Deployment Guide

## Recommended: Vercel (Best fit for Next.js)

1. Push repository to GitHub.
2. In Vercel dashboard, import the repository.
3. Framework preset: Next.js (auto-detected).
4. Build command: `npm run build`.
5. Output setting: default for Next.js.
6. Deploy.

### CLI Option

```bash
npm i -g vercel
vercel
vercel --prod
```

## Alternative: Netlify

1. Push repository to GitHub.
2. In Netlify dashboard, import repository.
3. Build command: `npm run build`.
4. Publish directory: `.next` (or use Netlify Next.js runtime defaults).
5. Deploy.

## Production Checks

Run before deploy:

```bash
npm run lint
npm run typecheck
npm run build
```
