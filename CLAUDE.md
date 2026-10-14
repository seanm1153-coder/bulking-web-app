# Surplus

A food ideas site for bulking: meal ideas, calorie boosters, the user's food preferences, and a library of saved links. Vite + React + TypeScript, published to GitHub Pages. `README.md` has the features, setup and code layout.

## Commands

- `npm run dev`: dev server at http://localhost:5173/
- `npm test`: Vitest (`src/**/*.test.ts` and `scripts/*.test.mjs`)
- `npm run lint`: oxlint
- `npm run build`: type-check and build to `dist/`

Run `npm run lint && npm test && npm run build` before committing. CI runs the same.

## Food preferences come first

`public/data/preferences.json` is the user's food preferences: things to **avoid** (never include, in any form), things they **love**, and **notes**, plus `ratings` (thumbs up or down on ideas; a thumbs down can have `reasons` and a `note` saying why) and `goals` (daily `kcal`, `protein`, `carbs` and `fat`; any can be missing). The user edits it from the Your tastes section, the swipe quiz and the thumbs on each idea, so read the current file before writing anything.

- Read it before adding or changing any recipe, idea, booster, or meal suggestion, including suggestions made in chat.
- Never include anything an `avoid` entry covers: not as an ingredient, topping, garnish, flavor, or in a drawing. Its `detail` says what counts; its `terms` are what the site matches, and its `allow` lists phrases that are fine anyway (write them exactly that way, e.g. "lemon juice").
- Lean toward `love` entries and ideas rated `up`, steer away from what ideas rated `down` have in common and from the `reasons` and `note` given for them, and follow `notes`.
- When suggesting meals in chat, you can size them against `goals` ("about a third of your day").
- `src/data/ideas.test.ts` fails if any idea or booster mentions an avoided term. Never weaken that test or an `avoid` entry to make it pass. Change the recipe.
- Don't add, remove or edit preferences yourself unless the user asks.

## How it fits together

- There's no backend. The site's data is JSON in `public/data/` (`links.json`, `preferences.json`). With a GitHub access key (kept in `localStorage` as `surplus:github-token`) the site reads and commits those files through the GitHub API (`src/lib/github.ts`, `src/lib/useRepoFile.ts`). Without a key it reads the published copies.
- The site hides ideas and boosters whose text matches an `avoid` preference (`src/lib/preferences.ts`), and ideas rated down.
- The swipe quiz, the "what did you love about it?" chips after a thumbs up and the Never picks in the thumbs-down form all use the foods in `src/data/foods.ts`. A Never picked there gets that food's `terms`.
- The thumbs-down reasons are `REASONS` in `src/lib/preferences.ts`. `src/data/hints.ts` turns patterns across ratings into suggested Never, Love and note entries in Your tastes. The user adds them; nothing is added automatically.
- Build a day (`src/data/day.ts`, `src/components/BuildDay.tsx`) picks ideas from the visible ones (so Nevers and thumbs-down ideas never appear) and fits portions to `goals`. The built day lives in `localStorage` (`surplus:day`) only; it's for exploring, not tracking, so it's never committed.
- The deploy workflow runs `scripts/enrich-links.mjs` to fill in `title`, `image`, `site` and `kind`, then commits the file back. The site never fetches link details itself.
- Stickers are shapes in `src/stickers/shapes.ts`, colored by named roles from `PALETTE`. Recolor a sticker by passing a `palette` override rather than copying its shapes.

## Rules

- Visual style is die-cut stickers: thick ink outlines (`--ink`), hard offset shadows, flat colors from the tokens in `:root` in `src/styles.css`. Never use raw hex in components; sticker colors live in `PALETTE`.
- Desktop-first, but nothing should break on a phone. The save-link dialog in particular is used from the iPhone share sheet.
- New stickers go in `STICKERS` as a list of shapes in a 200×200 box. Keep them simple: a few flat shapes, ink outlines, no gradients.
- Calories and macros (`kcal`, `protein`, `carbs`, `fat`) in `src/data/ideas.ts` are rough estimates from typical ingredient values: tally them ingredient by ingredient. Keep the "rough estimates" note visible. They're for one portion, also on ideas written as a batch. Notches and boosters carry all four too. The tests check that 4 × protein + 4 × carbs + 9 × fat comes within 10% of the calories (12% for boosters, and a looser margin for notches); if it doesn't, a number is wrong, so fix the number rather than the test.
- Every idea has a `clean` score from 1 (Filthy) to 5 (Clean) and a one-line `why`. Score it on protein per calorie (6 g per 100 kcal or more is strong, under 4 is weak), whole vs. processed food, added sugar, fiber and plants, and where the fat comes from (olive oil, nuts and avocado vs. butter, cream, bacon and frying). Calories don't count. Compare with the existing scores so the scale stays consistent.
- `clean.cleaner` and `clean.dirtier` are the notches on the recipe's slider (see `Tweak` in `src/data/ideas.ts`): one to three each way, each landing strictly further along the scale, with a rough kcal and protein change per portion. Every idea below 5 needs at least one cleaner notch. A `swap` names a line exactly as it reads at that notch, after earlier notches; the tests check this. Notches follow `preferences.json` like everything else: creamy or cheesy pasta sauces go cleaner with blended cottage cheese, never Greek yogurt; Greek yogurt stands in for sour cream, mayo-based sauces and dips; and a dough goes cleaner as Greek yogurt dough (self-rising flour and Greek yogurt).
- Recipes can be scaled ½× to 2× (`src/data/portion.ts`), which rewrites the amounts in ingredient lines. Write amounts it can find: digits or fractions before the unit ("1 scoop whey", not "a scoop of whey"), "One"/"Two" only at the start of a line, and sizes hyphenated ("15-oz can", "12-inch") so they're left alone. `src/data/portion.test.ts` checks every line reads right at every portion.
- An idea's `ahead` says how to make it ahead (see `Ahead` in `src/data/ideas.ts`). Keep storage times conservative: cooked food 3–4 days in the fridge and at most 3 months frozen. Put anything that goes soggy or doesn't freeze well (avocado, sour cream, salsa, fried eggs, crunchy toppings) under `fresh`.
- Never commit an access key. Don't add code that sends the key anywhere except `api.github.com`.
- `links.json` and `preferences.json` are user data. Changes to their shape must keep old entries loading.
