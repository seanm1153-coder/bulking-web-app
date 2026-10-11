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
  added?: string // YYYY-MM-DD
}

export interface PreferencesFile {
  preferences: Preference[]
}

const KINDS: PrefKind[] = ['avoid', 'love', 'note']

export const parsePreferences = (raw: unknown): PreferencesFile => {
  const list = (raw as Partial<PreferencesFile> | undefined)?.preferences
  return {
    preferences: Array.isArray(list)
      ? list.filter((p): p is Preference => !!p && typeof p.label === 'string' && KINDS.includes(p.kind))
      : [],
  }
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// One case-insensitive pattern for every avoided word, matched as whole words
// with an optional plural ("mushroom" also catches "mushrooms").
export function avoidPattern(prefs: Preference[]): RegExp | null {
  const terms = prefs
    .filter((p) => p.kind === 'avoid')
    .flatMap((p) => (p.terms?.length ? p.terms : [p.label]))
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
  if (!terms.length) return null
  terms.sort((a, b) => b.length - a.length)
  return new RegExp(`\\b(?:${terms.map(escape).join('|')})(?:e?s)?\\b`, 'i')
}

// Which avoid preferences a piece of text runs into, for "hidden because of…" notes.
export function avoidedIn(text: string, prefs: Preference[]): Preference[] {
  return prefs.filter((p) => p.kind === 'avoid' && avoidPattern([p])?.test(text))
}

export function newPreference(kind: PrefKind, label: string, today = new Date()): Preference {
  const clean = label.trim().replace(/\s+/g, ' ')
  const pad = (n: number) => String(n).padStart(2, '0')
  const slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'pref'
  return {
    id: `${kind}-${slug}-${crypto.randomUUID().slice(0, 4)}`,
    kind,
    label: clean,
    added: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`,
  }
}
