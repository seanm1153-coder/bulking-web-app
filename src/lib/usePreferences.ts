import { useMemo } from 'react'
import { DATA_FILES } from '../config'
import { avoidMatcher, newPreference, parsePreferences, rate, type Preference, type PrefKind, type Thumb } from './preferences'
import { useRepoFile } from './useRepoFile'

const VERBS: Record<PrefKind, string> = { avoid: 'Avoid', love: 'Love', note: 'Note' }

export function usePreferences(token: string) {
  const file = useRepoFile(token, DATA_FILES.preferences, parsePreferences)
  const { preferences: prefs, ratings } = file.data
  const avoid = useMemo(() => avoidMatcher(prefs), [prefs])

  return {
    prefs,
    ratings,
    avoid,
    status: file.status,
    error: file.error,
    // `extra` carries the matching words for an avoid picked from a list.
    add: (kind: PrefKind, label: string, withToken?: string, extra?: Pick<Preference, 'terms' | 'allow'>) => {
      const pref = { ...newPreference(kind, label), ...extra }
      return file.commit((d) => ({ ...d, preferences: [...d.preferences, pref] }), `${VERBS[kind]}: ${pref.label}`, withToken)
    },
    // Several at once, in one commit. Labels already in the file are skipped.
    addMany: (items: { kind: PrefKind; label: string; terms?: string[]; allow?: string[] }[], message: string, withToken?: string) =>
      file.commit((d) => {
        const have = new Set(d.preferences.map((p) => p.label.toLowerCase()))
        const fresh = items
          .filter((i) => !have.has(i.label.toLowerCase()))
          .map(({ kind, label, ...extra }) => ({ ...newPreference(kind, label), ...extra }))
        return { ...d, preferences: [...d.preferences, ...fresh] }
      }, message, withToken),
    remove: (id: string, withToken?: string) => {
      const label = prefs.find((p) => p.id === id)?.label ?? id
      return file.commit((d) => ({ ...d, preferences: d.preferences.filter((p) => p.id !== id) }), `Remove preference: ${label}`, withToken)
    },
    rate: (idea: { slug: string; title: string }, thumb: Thumb | null, withToken?: string) => {
      const message = thumb ? `Thumbs ${thumb}: ${idea.title}` : `Clear rating: ${idea.title}`
      return file.commit((d) => ({ ...d, ratings: rate(d.ratings, idea, thumb) }), message, withToken)
    },
  }
}

export type PreferencesApi = ReturnType<typeof usePreferences>
