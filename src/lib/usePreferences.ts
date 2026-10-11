import { useMemo } from 'react'
import { DATA_FILES } from '../config'
import { avoidPattern, newPreference, parsePreferences, type PrefKind } from './preferences'
import { useRepoFile } from './useRepoFile'

export function usePreferences(token: string) {
  const file = useRepoFile(token, DATA_FILES.preferences, parsePreferences)
  const prefs = file.data.preferences
  const avoid = useMemo(() => avoidPattern(prefs), [prefs])

  return {
    prefs,
    avoid,
    status: file.status,
    error: file.error,
    add: (kind: PrefKind, label: string, withToken?: string) => {
      const pref = newPreference(kind, label)
      const verb = kind === 'avoid' ? 'Avoid' : kind === 'love' ? 'Love' : 'Note'
      return file.commit((d) => ({ ...d, preferences: [...d.preferences, pref] }), `${verb}: ${pref.label}`, withToken)
    },
    remove: (id: string) => {
      const label = prefs.find((p) => p.id === id)?.label ?? id
      return file.commit((d) => ({ ...d, preferences: d.preferences.filter((p) => p.id !== id) }), `Remove preference: ${label}`)
    },
  }
}

export type PreferencesApi = ReturnType<typeof usePreferences>
