# Roadmap

Ideas for what Surplus could do next, from a brainstorm on 2026-10-11. Nothing here is built yet. Everything stays food-only, about ideas rather than tracking, and in the sticker style. New recipes always follow [`public/data/preferences.json`](public/data/preferences.json).

**Up next:** set up the Claude API (see [below](#claude-api)), then build #1, #5 and #7.

## The ideas

### Making new food

| # | Idea | What it does | Claude API? |
| --- | --- | --- | --- |
| 1 | **Cook me something** ⭐ | Pick a mood ("lazy", "spicy", "breakfast for dinner") and a time limit, and get a brand-new recipe that follows your tastes, as a sticker card. Save the ones you like into Ideas. | Yes |
| 2 | **Fridge raid** | Type what's in the kitchen ("rice, eggs, cheddar, frozen chicken") and get the biggest meal you can make from it. | Yes. A simpler version without it could match what you have against existing ideas and boosters, but couldn't invent dishes. |
| 3 | **Bulk-ify any recipe** | Paste any recipe and get it back bigger: boosters added, portions scaled up, anything on the Never list taken out. | Yes |
| 4 | **Fresh every Monday** | A weekly automatic job writes a new idea and features it at the top of the site. | Yes (a GitHub Action with the key stored as a repo secret) |

### Getting more out of saved links

| # | Idea | What it does | Claude API? |
| --- | --- | --- | --- |
| 5 | **Video to recipe card** ⭐ | Turns a saved YouTube, TikTok or recipe link into a card with ingredients and steps, and flags anything on the Never list. | Only for videos. Most recipe websites embed the recipe in a standard format the site can read for free. Videos need Claude to read the transcript. |
| 6 | **"Cook this next" shelf** | A short pinned queue of saved links you actually plan to make, separate from the full library. | No |

### Playful and visual

| # | Idea | What it does | Claude API? |
| --- | --- | --- | --- |
| 7 | **Meal slot machine** ⭐ | Three spinning sticker reels (a protein, a carb, a sauce). Pull the lever and get a combo with a total. | No |
| 8 | **Build-a-shake** | Drag ingredient stickers into a blender; a big counter climbs and it names your creation ("The 1,400 Brick"). | No |
| 9 | **What 1,000 calories looks like** | Side-by-side sticker piles, like one slice of pizza next to a mountain of broccoli. Shows why some foods make bulking easier. | No |
| 10 | **Sticker book** | Mark a recipe "made it" and its sticker gets stuck into a scrapbook page. Collecting, not logging. | No |

### Building your tastes faster

| # | Idea | What it does | Claude API? |
| --- | --- | --- | --- |
| 11 | **Swipe quiz** | Swipe right or left on about 30 sticker cards to fill in Love and Never automatically. | No |
| 12 | **Thumbs on ideas** | 👍 or 👎 on any recipe, feeding your tastes over time. | No |

### Practical

| # | Idea | What it does | Claude API? |
| --- | --- | --- | --- |
| 13 | **Grocery list** | Pick a few ideas for the week and get one combined shopping list grouped by aisle, ready to copy into Notes or Reminders. | No |
| 14 | **Eating-out cheat sheet** | The biggest orders at places like Chipotle, Chick-fil-A and Panera. | No |

⭐ = top picks. #1 is what the preferences are for and keeps the ideas growing. #5 makes saved links useful for cooking, not just bookmarking. #7 is the most fun, needs no setup and suits the stickers.

## Claude API

Ideas #1–5 need the Claude API so the site can write recipes by itself. Recipes Claude writes in a Claude Code session don't need it; that counts toward the Claude plan, not API credits.

### How it's charged

- Billed separately from any Claude.ai plan, through the Claude Console. You add a card and buy prepaid credits (the minimum top-up has been $5). Each request deducts what it used, and requests stop when credits run out.
- Auto-reload is optional and off by default. Set a **monthly spend limit** (e.g. $5) so it can never go past that.
- You pay per token, for the text sent and the text written back, including the model's thinking.

### Cost estimates

Per recipe, at about 2,000 tokens in and 2,500 out. Prices are per million tokens, in and out.

| Model | Price (in / out) | Per recipe | Recipes per $5 |
| --- | --- | --- | --- |
| Claude Opus 5.5 | $4 / $20 | ~5¢ | ~100 |
| Claude Sonnet 5.5 | $2 / $10 | ~2.5¢ | ~200 |
| Claude Haiku 5.5 | $0.10 / $0.50 | ~0.15¢ | ~3,000 |

Per month, counting new recipes (#1–3), video cards (#5) and the Monday recipe (#4):

| Usage | Roughly | Opus 5.5 | Sonnet 5.5 | Haiku 5.5 |
| --- | --- | --- | --- | --- |
| Light | 10 new recipes, 5 videos | ~$1 | ~50¢ | ~3¢ |
| Regular | 40 new recipes, 20 videos | ~$3.50 | ~$1.80 | ~10¢ |
| Heavy | 150 new recipes, 60 videos | ~$12 | ~$6 | ~35¢ |

Each "give me another one" counts as a new recipe. Expect **$1–4 a month**. The Console shows the real number after a week or two. Prices are from October 2026.

### Which model

Each request names its model, and you're billed at that model's rate. The plan:

1. **Defaults per feature:** Opus 5.5 for writing new recipes (#1–4), where the extra smarts show, and Haiku 5.5 for pulling recipes out of videos (#5), which is mostly transcription.
2. **A model picker in Setup** ("Recipe writer: Opus / Sonnet / Haiku", with the rough cost per recipe beside each), so you can switch any time.

### How the key is kept

Like the GitHub key, the Anthropic API key would be pasted into the site once per browser and stored only in that browser. It never goes into the site's code or the repo. The Monday job (#4) would use a GitHub repo secret instead. Anyone with the key could spend the credits, which is the reason for the spend limit.
