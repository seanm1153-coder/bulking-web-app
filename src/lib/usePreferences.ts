import { useMemo } from 'react'
import { DATA_FILES } from '../config'
import { addPreferences, avoidMatcher, cleanGoals, newPreference, parsePreferences, rate, type Feedback, type Goals, type Preference, type PrefKind, type Thumb } from './preferences'
import { useRepoFile } from './useRepoFile'

const VERBS: Record<PrefKind, string> = { avoid: 'Avoid', love: 'Love', note: 'Note' }

export function usePreferences(token: string) {
  const file = useRepoFile(token, DATA_FILES.preferences, parsePreferences)
  const { preferences: prefs, ratings, goals = {} } = file.data
  const avoid = useMemo(() => avoidMatcher(prefs), [prefs])

  return {
    prefs,
    ratings,
    goals,
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
    // Replaces the daily goals; empty ones are left out.
    setGoals: (next: Goals, withToken?: string) => {
      const clean = cleanGoals(next)
      const parts = [clean.kcal && `${clean.kcal.toLocaleString()} kcal`, ...(['protein', 'carbs', 'fat'] as const).map((k) => clean[k] && `${clean[k]} g ${k}`)].filter(Boolean)
      return file.commit((d) => {
        const { goals: _old, ...rest } = d
        return Object.keys(clean).length ? { ...rest, goals: clean } : rest
      }, parts.length ? `Daily goals: ${parts.join(', ')}` : 'Clear daily goals', withToken)
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
