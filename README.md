# Surplus

A home base for eating more on purpose: big meal ideas, calorie boosters, and a library of food links saved from around the internet. Everything is drawn as die-cut stickers.

## What's on the page

- **Ideas.** Sixteen big meals (breakfasts, meals, shakes, snacks), each with a recipe. Open one to tap boosters onto it and watch the total climb. **Feed me an idea** picks one at random.
- **Boosters.** Ten easy add-ons (peanut butter, whole milk, olive oil, butter…) with what each one adds.
- **Saved.** Videos, recipes and posts you've saved, with categories, notes, favorites and search. YouTube videos play in place; everything else opens in a new tab.

Calorie and protein numbers are rough estimates.

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
| `src/components/` | Hero, Ideas, Boosters, Library and the dialogs. |
| `src/stickers/shapes.ts` | Every sticker as simple shapes with named color roles. |
| `src/stickers/Sticker.tsx` | Draws a sticker: white die-cut border, then ink outlines. |
| `src/data/ideas.ts` | The meal ideas and boosters. |
| `src/lib/links.ts` | Link types, categories, URL cleanup, YouTube and display helpers. |
| `src/lib/github.ts` | Reading and committing `links.json` through the GitHub API. |
| `src/lib/useLinks.ts` | The React hook that ties the library to GitHub. |
| `scripts/enrich-links.mjs` | Fetches link titles and thumbnails in the deploy workflow. |
