# Surplus

A food ideas site for bulking: meal ideas, calorie boosters, and a library of saved links. Vite + React + TypeScript, published to GitHub Pages. `README.md` has the features, setup and code layout.

## Commands

- `npm run dev`: dev server at http://localhost:5173/
- `npm test`: Vitest (`src/**/*.test.ts` and `scripts/*.test.mjs`)
- `npm run lint`: oxlint
- `npm run build`: type-check and build to `dist/`

Run `npm run lint && npm test && npm run build` before committing. CI runs the same.

## How it fits together

- There's no backend. Saved links are `public/data/links.json` in the repo. With a GitHub access key (kept in `localStorage` as `surplus:github-token`) the site reads and commits that file through the GitHub API (`src/lib/github.ts`). Without a key it reads the published copy.
- The deploy workflow runs `scripts/enrich-links.mjs` to fill in `title`, `image`, `site` and `kind`, then commits the file back. The site never fetches link details itself.
- Stickers are shapes in `src/stickers/shapes.ts`, colored by named roles from `PALETTE`. Recolor a sticker by passing a `palette` override rather than copying its shapes.

## Rules

- Visual style is die-cut stickers: thick ink outlines (`--ink`), hard offset shadows, flat colors from the tokens in `:root` in `src/styles.css`. Never use raw hex in components; sticker colors live in `PALETTE`.
- Desktop-first, but nothing should break on a phone. The save-link dialog in particular is used from the iPhone share sheet.
- New stickers go in `STICKERS` as a list of shapes in a 200×200 box. Keep them simple: a few flat shapes, ink outlines, no gradients.
- Calorie and protein numbers in `src/data/ideas.ts` are rough estimates from typical ingredient values. Keep them plausible and keep the "rough estimates" note visible.
- Never commit an access key. Don't add code that sends the key anywhere except `api.github.com`.
- `links.json` is user data. Changes to the `Link` shape must keep old entries loading.
