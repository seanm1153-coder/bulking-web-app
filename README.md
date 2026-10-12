# Surplus

A home base for eating more on purpose: big meal ideas, calorie boosters, your food preferences, and a library of food links saved from around the internet. Everything is drawn as die-cut stickers.

## What's on the page

- **Ideas.** Sixteen big meals (breakfasts, meals, shakes, snacks), each with a recipe. Open one to tap boosters onto it and watch the total climb. **Feed me an idea** picks one at random.
- **Boosters.** Ten easy add-ons (peanut butter, whole milk, olive oil, butter…) with what each one adds.
- **Your tastes.** Foods you never want, foods you love, and notes. Ideas and boosters that mention anything on the Never list are hidden, and new recipes are written to follow all of it.
- **Swipe quiz.** About 30 food stickers to swipe right (love), left (never) or up (fine either way), then save in one go. Foods already in your tastes are skipped. Start it from **Your tastes**.
- **Thumbs.** 👍 or 👎 on any idea. A thumbs down hides the idea; either one offers the foods in it as one-tap Love or Never picks.
- **Saved.** Videos, recipes and posts you've saved, with categories, notes, favorites and search. YouTube videos play in place; everything else opens in a new tab.

Calorie and protein numbers are rough estimates.

Ideas for what to build next are in [`ROADMAP.md`](ROADMAP.md).

## Preferences

[`public/data/preferences.json`](public/data/preferences.json) holds your tastes. Edit them from the **Your tastes** section (it saves the same way links do) or by hand. Each entry has a `kind` (`avoid`, `love` or `note`), a short `label`, and optionally a `detail` explaining it. `avoid` entries can list `terms`, the words that count as a match; otherwise the label is used. Matching is whole-word and catches plurals. `allow` lists phrases that are fine even though they contain a term, like `"lemon juice"` under Fruit. Thumbs on ideas are kept in the same file under `ratings`.

`src/data/ideas.test.ts` checks every idea and booster against the Never list, so a recipe that breaks a preference fails the build.

## Saving links

Saved links live in [`public/data/links.json`](public/data/links.json) in this repo, and anyone can see them on the published site. The site writes to that file through the GitHub API using an access key you paste in once per browser. There are four ways to save:

1. **Paste** a link anywhere on the page (⌘V), or drag one onto it.
2. **+ Save a link** in the header.
3. **Bookmarklet** (desktop): open **Setup** and drag **+ Save to Surplus** to your bookmarks bar.
4. **iPhone share sheet**: make a Shortcut that opens `https://seanm1153-coder.github.io/bulking-web-app/?add=` plus the URL-encoded link. **Setup** on the site has the exact steps.

### The access key

Create a [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new) with:

- **Repository access:** only `bulking-web-app`
- **Permissions:** Contents → Read and write

Paste it when the site asks. It's stored in that browser's `localStorage` and nowhere else.

### Titles and thumbnails

Every push to `main` runs [`scripts/enrich-links.mjs`](scripts/enrich-links.mjs) in the deploy workflow. For each new link it tries, in order: oEmbed (YouTube, TikTok, Vimeo), the page's Open Graph tags, and then [Microlink](https://microlink.io) for sites that block scripts (free, no key, 50 lookups a day). It also moves links from **Inbox** to a category when the title makes it obvious. It commits the result back, and the site picks it up a minute or so after saving.

## Run it

```sh
npm install
npm run dev        # http://localhost:5173/
npm test           # Vitest: link helpers, GitHub saving, the detail script
npm run lint       # oxlint
npm run build      # type-check and build to dist/
node scripts/enrich-links.mjs   # fetch details for links in links.json
```

## Deploy

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs on every push to `main`: fetch link details, lint, test, build, and publish to GitHub Pages. Pull requests run the checks only. One-time setup in the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

The build uses relative paths (`base: './'`), so it works at any `https://<user>.github.io/<repo>/` URL. If the repo is renamed, update [`src/config.ts`](src/config.ts).

## Code layout

| Path | What it is |
| --- | --- |
| `src/App.tsx` | Page shell, header, dialogs, and paste/drop/`?add=` handling. |
| `src/components/` | Hero, Ideas, Boosters, Tastes, Library, the swipe quiz and the dialogs. |
| `src/stickers/shapes.ts` | Every sticker as simple shapes with named color roles. |
| `src/stickers/Sticker.tsx` | Draws a sticker: white die-cut border, then ink outlines. |
| `src/data/ideas.ts` | The meal ideas and boosters. Tested against your preferences. |
| `src/data/foods.ts` | Foods for the swipe quiz and the picks after a thumbs up or down. |
| `src/lib/links.ts` | Link types, categories, URL cleanup, YouTube and display helpers. |
| `src/lib/github.ts` | Reading and committing data files through the GitHub API. |
| `src/lib/useRepoFile.ts` | Loads and commits one data file; shares the access key. |
| `src/lib/useLinks.ts` | Saved links on top of `useRepoFile`. |
| `src/lib/preferences.ts` | Preference and rating types, and Never-list matching. |
| `scripts/enrich-links.mjs` | Fetches link titles and thumbnails in the deploy workflow. |
