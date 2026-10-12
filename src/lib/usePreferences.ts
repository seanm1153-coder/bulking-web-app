import { useMemo } from 'react'
import { DATA_FILES } from '../config'
import { addPreferences, avoidMatcher, newPreference, parsePreferences, rate, type Feedback, type Preference, type PrefKind, type Thumb } from './preferences'
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
    // `extra` carries the matching words for an avoid picked from a list, and
    // where a suggested preference came from.
    add: (kind: PrefKind, label: string, withToken?: string, extra?: Pick<Preference, 'terms' | 'allow' | 'detail'>) => {
      const pref = { ...newPreference(kind, label), ...extra }
      return file.commit((d) => ({ ...d, preferences: [...d.preferences, pref] }), `${VERBS[kind]}: ${pref.label}`, withToken)
    },
    // Several at once, in one commit. Labels already in the file are skipped.
    addMany: (items: { kind: PrefKind; label: string; terms?: string[]; allow?: string[] }[], message: string, withToken?: string) =>
      file.commit((d) => ({ ...d, preferences: addPreferences(d.preferences, items) }), message, withToken),
    remove: (id: string, withToken?: string) => {
      const label = prefs.find((p) => p.id === id)?.label ?? id
      return file.commit((d) => ({ ...d, preferences: d.preferences.filter((p) => p.id !== id) }), `Remove preference: ${label}`, withToken)
    },
    rate: (idea: { slug: string; title: string }, thumb: Thumb | null, withToken?: string) => {
      const message = thumb ? `Thumbs ${thumb}: ${idea.title}` : `Clear rating: ${idea.title}`
      return file.commit((d) => ({ ...d, ratings: rate(d.ratings, idea, thumb) }), message, withToken)
    },
    // A thumbs down with the why behind it, and any foods from it to add to
    // Never, in one commit.
    thumbsDown: (idea: { slug: string; title: string }, feedback: Feedback, never: Pick<Preference, 'label' | 'terms' | 'allow'>[], withToken?: string) => {
      const why = [
        ...(feedback.reasons ?? []).map((r) => r.toLowerCase()),
        never.length > 0 && `never: ${never.map((n) => n.label.toLowerCase()).join(', ')}`,
      ].filter(Boolean)
      const message = `Thumbs down: ${idea.title}${why.length ? ` (${why.join('; ')})` : ''}`
      return file.commit((d) => ({
        ...d,
        preferences: addPreferences(d.preferences, never.map((n) => ({ kind: 'avoid' as const, ...n }))),
        ratings: rate(d.ratings, idea, 'down', feedback),
      }), message, withToken)
    },
  }
}

export type PreferencesApi = ReturnType<typeof usePreferences>
