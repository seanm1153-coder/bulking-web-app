import type { StickerName } from '../stickers/shapes'

export type CategoryId = 'inbox' | 'breakfast' | 'meals' | 'shakes' | 'snacks' | 'meal-prep' | 'tips'

export interface Category {
  id: CategoryId
  label: string
  sticker: StickerName
  color: string // a CSS color token, used behind the sticker on cards without a thumbnail
}

export const CATEGORIES: Category[] = [
  { id: 'inbox', label: 'Inbox', sticker: 'milk', color: 'var(--sky)' },
  { id: 'breakfast', label: 'Breakfast', sticker: 'pancakes', color: 'var(--butter)' },
  { id: 'meals', label: 'Meals', sticker: 'burger', color: 'var(--tomato)' },
  { id: 'shakes', label: 'Shakes', sticker: 'shake', color: 'var(--pink)' },
  { id: 'snacks', label: 'Snacks', sticker: 'toast', color: 'var(--mint)' },
  { id: 'meal-prep', label: 'Meal prep', sticker: 'burrito', color: 'var(--sky)' },
  { id: 'tips', label: 'Tips', sticker: 'egg', color: 'var(--butter)' },
]

export const categoryById = (id: string): Category => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0]

// One saved link. `title`, `image`, `site` and `kind` are filled in later by
// scripts/enrich-links.mjs, which runs in the deploy workflow.
export interface Link {
  id: string
  url: string
  added: string // YYYY-MM-DD
  category: CategoryId
  note?: string
  favorite?: boolean
  title?: string
  image?: string
  site?: string
  kind?: 'video' | 'page'
  fetched?: string // date the details were last looked up
}

export interface LinksFile {
  links: Link[]
}

// Share links carry tracking parameters that make the same video look like a
// different URL. Strip them so duplicates can be spotted.
const TRACKING = /^(utm_\w+|fbclid|gclid|igsh|igshid|si|feature|ref|ref_src|_r|_t|is_from_webapp|sender_device)$/i

export function normalizeUrl(input: string): string | null {
  const text = input.trim()
  if (!text) return null
  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(text) ? text : `https://${text}`
  let url: URL
  try {
    url = new URL(candidate)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  if (!url.hostname.includes('.')) return null
  for (const key of [...url.searchParams.keys()]) if (TRACKING.test(key)) url.searchParams.delete(key)
  return url.toString()
}

// The first http(s) URL in some text, for pasted or shared text such as
// "Watch this https://…". Bare words never count as links here.
export function findUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s<>"']+/i)
  return match ? normalizeUrl(match[0]) : null
}

export function youtube(url: string): { id: string; short: boolean } | null {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return null
  }
  const host = u.hostname.replace(/^(www|m|music)\./, '')
  let id: string | null = null
  let short = false
  if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0]
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts[0] === 'watch') id = u.searchParams.get('v')
    else if (['shorts', 'embed', 'live', 'v'].includes(parts[0])) {
      id = parts[1] ?? null
      short = parts[0] === 'shorts'
    }
  }
  return id && /^[\w-]{6,}$/.test(id) ? { id, short } : null
}

const SITES: Record<string, string> = {
  'youtube.com': 'YouTube', 'youtu.be': 'YouTube', 'tiktok.com': 'TikTok', 'instagram.com': 'Instagram',
  'reddit.com': 'Reddit', 'pinterest.com': 'Pinterest', 'x.com': 'X', 'twitter.com': 'X', 'facebook.com': 'Facebook',
  'vimeo.com': 'Vimeo', 'cooking.nytimes.com': 'NYT Cooking', 'seriouseats.com': 'Serious Eats', 'bonappetit.com': 'Bon Appétit',
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^(www|m)\./, '')
  } catch {
    return url
  }
}

export function siteLabel(link: Pick<Link, 'url' | 'site'>): string {
  if (link.site) return link.site
  const host = hostOf(link.url)
  const known = Object.keys(SITES).find((h) => host === h || host.endsWith(`.${h}`))
  return known ? SITES[known] : host
}

export function thumbnail(link: Pick<Link, 'url' | 'image'>): string | null {
  if (link.image) return link.image
  const yt = youtube(link.url)
  return yt ? `https://i.ytimg.com/vi/${yt.id}/hqdefault.jpg` : null
}

export function isVideo(link: Pick<Link, 'url' | 'kind'>): boolean {
  if (link.kind) return link.kind === 'video'
  return youtube(link.url) !== null || /(^|\.)(tiktok|vimeo)\.com$/.test(hostOf(link.url)) || /instagram\.com\/(reel|reels|tv)\//.test(link.url)
}

// What to call a link before its real title has been fetched: a readable slug
// ("/chicken-tikka-masala" → "Chicken tikka masala") or else the kind of post.
export function displayTitle(link: Pick<Link, 'url' | 'title' | 'site' | 'kind'>): string {
  if (link.title) return link.title
  let slug = ''
  try {
    slug = decodeURIComponent(new URL(link.url).pathname).split('/').filter(Boolean).pop() ?? ''
  } catch {
    return link.url
  }
  if (/[a-z]{3,}[-_][a-z]{2,}/i.test(slug)) {
    const words = slug.replace(/\.\w+$/, '').replace(/[-_]+/g, ' ').trim()
    return words.charAt(0).toUpperCase() + words.slice(1)
  }
  if (/instagram\.com\/reels?\//.test(link.url)) return 'Instagram reel'
  if (/instagram\.com\/p\//.test(link.url)) return 'Instagram post'
  if (youtube(link.url)?.short) return 'YouTube short'
  return isVideo(link) ? `${siteLabel(link)} video` : `Link from ${siteLabel(link)}`
}

export const findDuplicate = (links: Link[], url: string) => links.find((l) => l.url === url)

export const addLink = (links: Link[], link: Link): Link[] => [link, ...links.filter((l) => l.id !== link.id)]
export const updateLink = (links: Link[], id: string, patch: Partial<Link>): Link[] =>
  links.map((l) => (l.id === id ? { ...l, ...patch } : l))
export const removeLink = (links: Link[], id: string): Link[] => links.filter((l) => l.id !== id)

export function newLink(url: string, category: CategoryId, note: string, today = new Date()): Link {
  const pad = (n: number) => String(n).padStart(2, '0')
  const link: Link = {
    id: crypto.randomUUID().slice(0, 8),
    url,
    added: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`,
    category,
  }
  if (note.trim()) link.note = note.trim()
  return link
}
