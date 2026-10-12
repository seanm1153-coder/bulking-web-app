// Food preferences, kept in public/data/preferences.json. They do two jobs:
// the site hides ideas and boosters that mention anything to avoid, and
// whoever writes new recipes (people or Claude) reads the file first.

export type PrefKind = 'avoid' | 'love' | 'note'

export interface Preference {
  id: string
  kind: PrefKind
  label: string // short, shown on the chip: "Fruit", "Spicy food"
  detail?: string // longer explanation for whoever writes recipes
  terms?: string[] // avoid only: words that count as a match (defaults to the label)
  allow?: string[] // avoid only: phrases that are fine even though they contain a term ("lemon juice")
  added?: string // YYYY-MM-DD
}

// A thumbs up or down on one of the ideas, keyed by its slug. The title is
// kept too so the file reads well on its own.
export type Thumb = 'up' | 'down'

export interface Rating {
  idea: string
  title: string
  thumb: Thumb
  on: string // YYYY-MM-DD
}

export interface PreferencesFile {
  preferences: Preference[]
  ratings: Rating[]
}

const KINDS: PrefKind[] = ['avoid', 'love', 'note']

// Older files have no `ratings`; they load with none.
export const parsePreferences = (raw: unknown): PreferencesFile => {
  const file = raw as Partial<PreferencesFile> | undefined
  const list = file?.preferences
  const ratings = file?.ratings
  return {
    preferences: Array.isArray(list)
      ? list.filter((p): p is Preference => !!p && typeof p.label === 'string' && KINDS.includes(p.kind))
      : [],
    ratings: Array.isArray(ratings)
      ? ratings.filter((r): r is Rating => !!r && typeof r.idea === 'string' && (r.thumb === 'up' || r.thumb === 'down'))
      : [],
  }
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Whole words, case-insensitive, with an optional plural ("mushroom" also
// catches "mushrooms").
function wordsPattern(words: string[], flags = 'i'): RegExp | null {
  const clean = words.map((t) => t.trim().toLowerCase()).filter(Boolean)
  if (!clean.length) return null
  clean.sort((a, b) => b.length - a.length)
  return new RegExp(`\\b(?:${clean.map(escape).join('|')})(?:e?s)?\\b`, flags)
}

// Finds the first avoided word in a piece of text, or null if there isn't one.
export type AvoidMatcher = (text: string) => string | null

// Builds the matcher for everything to avoid. An entry's `allow` phrases are
// blanked out before its terms are checked, so "lemon juice" can be fine while
// "lemon" isn't. Null when there's nothing to avoid.
export function avoidMatcher(prefs: Preference[]): AvoidMatcher | null {
  const checks = prefs
    .filter((p) => p.kind === 'avoid')
    .map((p) => ({ terms: wordsPattern(p.terms?.length ? p.terms : [p.label]), allow: wordsPattern(p.allow ?? [], 'gi') }))
    .filter((c): c is { terms: RegExp; allow: RegExp | null } => c.terms !== null)
  if (!checks.length) return null
  return (text) => {
    for (const c of checks) {
      const found = (c.allow ? text.replace(c.allow, ' ') : text).match(c.terms)
      if (found) return found[0]
    }
    return null
  }
}

// Which avoid preferences a piece of text runs into, for "hidden because of…" notes.
export function avoidedIn(text: string, prefs: Preference[]): Preference[] {
  return prefs.filter((p) => p.kind === 'avoid' && avoidMatcher([p])?.(text))
}

export const today = (now = new Date()) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function newPreference(kind: PrefKind, label: string, now = new Date()): Preference {
  const clean = label.trim().replace(/\s+/g, ' ')
  const slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'pref'
  return {
    id: `${kind}-${slug}-${crypto.randomUUID().slice(0, 4)}`,
    kind,
    label: clean,
    added: today(now),
  }
}

// Sets (or with null, clears) the rating for one idea.
export function rate(ratings: Rating[], idea: { slug: string; title: string }, thumb: Thumb | null, now = new Date()): Rating[] {
  const rest = ratings.filter((r) => r.idea !== idea.slug)
  return thumb ? [...rest, { idea: idea.slug, title: idea.title, thumb, on: today(now) }] : rest
}
