#!/usr/bin/env node
// Fills in the title, thumbnail and site name for saved links that don't have
// them yet, and sorts links left in the Inbox into a category when the title
// makes it obvious. The deploy workflow runs this on every push to main and
// commits the result. Run it locally with: node scripts/enrich-links.mjs

import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const FILE = new URL('../public/data/links.json', import.meta.url)
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'

// Sites with an oEmbed endpoint that answers without an API key.
const OEMBED = [
  [/(^|\.)(youtube\.com|youtu\.be)$/, (u) => `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(u)}`],
  [/(^|\.)tiktok\.com$/, (u) => `https://www.tiktok.com/oembed?url=${encodeURIComponent(u)}`],
  [/(^|\.)vimeo\.com$/, (u) => `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(u)}`],
]
const VIDEO_HOSTS = /(^|\.)(youtube\.com|youtu\.be|tiktok\.com|vimeo\.com)$/

// Checked in order, so the specific ones come before "meals".
const CATEGORY_WORDS = [
  ['meal-prep', /\bmeal[\s-]?prep|\bbatch[\s-]?cook|\bprep (for )?the week|\bweek of (meals|lunches)/i],
  ['shakes', /\b(shake|smoothie|milkshake)s?\b/i],
  ['breakfast', /\b(breakfast|pancakes?|waffles?|oats|oatmeal|french toast|omelett?es?|eggs?|granola|bagels?)\b/i],
  ['snacks', /\b(snacks?|bars?|bites|trail mix|energy balls?)\b/i],
  ['tips', /\b(tips|mistakes|guide|how to (bulk|gain)|hardgainer|eat more|calorie surplus)\b/i],
  ['meals', /\b(burgers?|pasta|chicken|beef|steak|rice|bowls?|pizza|burritos?|tacos?|curry|dinner|lunch|sandwich|wraps?|lasagna|chili|noodles?)\b/i],
]

export function guessCategory(text) {
  for (const [category, pattern] of CATEGORY_WORDS) if (pattern.test(text)) return category
  return null
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
export function decodeEntities(text) {
  return text
    .replace(/&#x([\da-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&(\w+);/g, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
}

// Open Graph and Twitter card tags, falling back to <title>.
export function parseMeta(html, pageUrl) {
  const tags = {}
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const key = tag.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase()
    const content = tag.match(/\bcontent\s*=\s*"([^"]*)"|\bcontent\s*=\s*'([^']*)'/i)
    if (key && content && !(key in tags)) tags[key] = decodeEntities(content[1] ?? content[2]).trim()
  }
  const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]
  const title = tags['og:title'] || tags['twitter:title'] || (titleTag ? decodeEntities(titleTag).trim() : '')
  let image = tags['og:image'] || tags['og:image:url'] || tags['twitter:image'] || ''
  if (image) {
    try {
      image = new URL(image, pageUrl).toString()
    } catch {
      image = ''
    }
  }
  return {
    title: title.replace(/\s+/g, ' ') || undefined,
    image: image || undefined,
    site: tags['og:site_name'] || undefined,
    video: /video/i.test(tags['og:type'] ?? ''),
  }
}

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(10_000) })
  return res.ok ? res.json() : null
}

export async function fetchDetails(url) {
  const host = new URL(url).hostname.replace(/^(www|m)\./, '')
  const oembed = OEMBED.find(([pattern]) => pattern.test(host))
  if (oembed) {
    const data = await getJson(oembed[1](url)).catch(() => null)
    if (data?.title) {
      return { title: data.title, image: data.thumbnail_url, site: data.provider_name, kind: 'video' }
    }
  }
  const kind = (video) => (video || VIDEO_HOSTS.test(host) ? 'video' : 'page')
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'en-US,en;q=0.9' },
    redirect: 'follow',
    signal: AbortSignal.timeout(12_000),
  }).catch(() => null)
  // Many recipe sites answer scripts with a bot check ("Just a moment…")
  // instead of the page, so only trust a successful response.
  if (res?.ok) {
    const meta = parseMeta((await res.text()).slice(0, 500_000), res.url || url)
    if (meta.title || meta.image) return { title: meta.title, image: meta.image, site: meta.site, kind: kind(meta.video) }
  }
  // Fallback: Microlink reads the page from its own servers. The free tier
  // needs no key and allows 50 lookups a day, plenty for saving links by hand.
  const ml = await getJson(`https://api.microlink.io/?url=${encodeURIComponent(url)}`).catch(() => null)
  if (ml?.status === 'success' && (ml.data?.title || ml.data?.image?.url)) {
    return { title: ml.data.title ?? undefined, image: ml.data.image?.url ?? undefined, site: ml.data.publisher ?? undefined, kind: kind(false) }
  }
  return null
}

const today = () => new Date().toISOString().slice(0, 10)

// Returns the updated list and how many links changed. `lookup` is injectable
// for tests.
export async function enrich(links, lookup = fetchDetails) {
  let changed = 0
  const out = []
  for (const link of links) {
    if (link.fetched || link.title) {
      out.push(link)
      continue
    }
    let details = null
    try {
      details = await lookup(link.url)
    } catch (e) {
      console.warn(`  couldn't fetch ${link.url}: ${e.message}`)
    }
    const next = { ...link, fetched: today() }
    if (details) {
      for (const key of ['title', 'image', 'site', 'kind']) if (details[key] && !next[key]) next[key] = details[key]
    }
    if (next.category === 'inbox' && next.title) next.category = guessCategory(next.title) ?? 'inbox'
    console.log(`  ${details ? '✓' : '·'} ${link.url}${next.title ? ` → ${next.title}` : ''}${next.category !== link.category ? ` [${next.category}]` : ''}`)
    out.push(next)
    changed++
  }
  return { links: out, changed }
}

async function main() {
  const data = JSON.parse(await readFile(FILE, 'utf8'))
  const { links, changed } = await enrich(Array.isArray(data.links) ? data.links : [])
  if (!changed) {
    console.log('No new links to look up.')
    return
  }
  await writeFile(FILE, JSON.stringify({ ...data, links }, null, 2) + '\n')
  console.log(`Looked up ${changed} link${changed === 1 ? '' : 's'}.`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main()
