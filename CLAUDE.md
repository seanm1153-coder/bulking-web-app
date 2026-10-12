# Surplus

A food ideas site for bulking: meal ideas, calorie boosters, the user's food preferences, and a library of saved links. Vite + React + TypeScript, published to GitHub Pages. `README.md` has the features, setup and code layout.

## Commands

- `npm run dev`: dev server at http://localhost:5173/
- `npm test`: Vitest (`src/**/*.test.ts` and `scripts/*.test.mjs`)
- `npm run lint`: oxlint
- `npm run build`: type-check and build to `dist/`

Run `npm run lint && npm test && npm run build` before committing. CI runs the same.

## Food preferences come first

`public/data/preferences.json` is the user's food preferences: things to **avoid** (never include, in any form), things they **love**, and **notes**, plus `ratings` (thumbs up or down on ideas; a thumbs down can have `reasons` and a `note` saying why). The user edits it from the Your tastes section, the swipe quiz and the thumbs on each idea, so read the current file before writing anything.

- Read it before adding or changing any recipe, idea, booster, or meal suggestion, including suggestions made in chat.
- Never include anything an `avoid` entry covers: not as an ingredient, topping, garnish, flavor, or in a drawing. Its `detail` says what counts; its `terms` are what the site matches, and its `allow` lists phrases that are fine anyway (write them exactly that way, e.g. "lemon juice").
- Lean toward `love` entries and ideas rated `up`, steer away from what ideas rated `down` have in common and from the `reasons` and `note` given for them, and follow `notes`.
- `src/data/ideas.test.ts` fails if any idea or booster mentions an avoided term. Never weaken that test or an `avoid` entry to make it pass. Change the recipe.
- Don't add, remove or edit preferences yourself unless the user asks.

## How it fits together

- There's no backend. The site's data is JSON in `public/data/` (`links.json`, `preferences.json`). With a GitHub access key (kept in `localStorage` as `surplus:github-token`) the site reads and commits those files through the GitHub API (`src/lib/github.ts`, `src/lib/useRepoFile.ts`). Without a key it reads the published copies.
- The site hides ideas and boosters whose text matches an `avoid` preference (`src/lib/preferences.ts`), and ideas rated down.
- The swipe quiz, the "what did you love about it?" chips after a thumbs up and the Never picks in the thumbs-down form all use the foods in `src/data/foods.ts`. A Never picked there gets that food's `terms`.
- The thumbs-down reasons are `REASONS` in `src/lib/preferences.ts`. `src/data/hints.ts` turns patterns across ratings into suggested Never, Love and note entries in Your tastes. The user adds them; nothing is added automatically.
- The deploy workflow runs `scripts/enrich-links.mjs` to fill in `title`, `image`, `site` and `kind`, then commits the file back. The site never fetches link details itself.
- Stickers are shapes in `src/stickers/shapes.ts`, colored by named roles from `PALETTE`. Recolor a sticker by passing a `palette` override rather than copying its shapes.

## Rules

- Visual style is die-cut stickers: thick ink outlines (`--ink`), hard offset shadows, flat colors from the tokens in `:root` in `src/styles.css`. Never use raw hex in components; sticker colors live in `PALETTE`.
- Desktop-first, but nothing should break on a phone. The save-link dialog in particular is used from the iPhone share sheet.
- New stickers go in `STICKERS` as a list of shapes in a 200×200 box. Keep them simple: a few flat shapes, ink outlines, no gradients.
- Calorie and protein numbers in `src/data/ideas.ts` are rough estimates from typical ingredient values. Keep them plausible and keep the "rough estimates" note visible.
- Never commit an access key. Don't add code that sends the key anywhere except `api.github.com`.
- `links.json` and `preferences.json` are user data. Changes to their shape must keep old entries loading.
