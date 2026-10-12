import { useState, type FormEvent } from 'react'
import type { PrefKind, Preference, Rating } from '../lib/preferences'
import type { PreferencesApi } from '../lib/usePreferences'
import { ConnectForm } from './ConnectForm'
import { Modal } from './Modal'

const COLUMNS: { kind: PrefKind; title: string; hint: string; placeholder: string }[] = [
  { kind: 'avoid', title: 'Never', hint: 'Left out of every idea and new recipe.', placeholder: 'Mushrooms' },
  { kind: 'love', title: 'Love', hint: 'More of these in new recipes.', placeholder: 'Spicy food' },
  { kind: 'note', title: 'Notes', hint: 'Anything else to keep in mind.', placeholder: 'Breakfast has to take under 10 minutes' },
]

export function Tastes({ prefs, token, setToken, onQuiz }: {
  prefs: PreferencesApi
  token: string
  setToken: (token: string) => void
  onQuiz: () => void
}) {
  const [drafts, setDrafts] = useState<Record<PrefKind, string>>({ avoid: '', love: '', note: '' })
  const [busy, setBusy] = useState<PrefKind | string | null>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState<((token: string) => void) | null>(null) // waiting on a GitHub key, then runs this

  async function run(key: string, action: () => Promise<unknown>) {
    setBusy(key)
    setError('')
    try {
      await action()
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t save that. Try again.')
      return false
    } finally {
      setBusy(null)
    }
  }

  async function add(kind: PrefKind, withToken = token) {
    const label = drafts[kind].trim()
    if (!label) return
    if (!withToken) return setPending(() => (t: string) => void add(kind, t))
    if (await run(kind, () => prefs.add(kind, label, withToken))) setDrafts((d) => ({ ...d, [kind]: '' }))
  }

  function submit(kind: PrefKind) {
    return (e: FormEvent) => {
      e.preventDefault()
      void add(kind)
    }
  }

  function remove(p: Preference, withToken = token) {
    if (!withToken) return setPending(() => (t: string) => remove(p, t))
    if (window.confirm(`Remove “${p.label}” from ${p.kind === 'avoid' ? 'Never' : p.kind === 'love' ? 'Love' : 'Notes'}?`)) void run(p.id, () => prefs.remove(p.id, withToken))
  }

  function unrate(r: Rating, withToken = token) {
    if (!withToken) return setPending(() => (t: string) => unrate(r, t))
    void run(r.idea, () => prefs.rate({ slug: r.idea, title: r.title }, null, withToken))
  }

  return (
    <section className="section tastes" id="tastes" aria-labelledby="tastes-h">
      <header className="section-head">
        <div>
          <h2 id="tastes-h">Your tastes</h2>
          <p className="section-sub">What you never want, what you love, and anything else to remember. Ideas that include something on the Never list are hidden, and new recipes follow all of it.</p>
        </div>
        <button type="button" className="btn btn-butter" onClick={onQuiz}>Take the swipe quiz</button>
      </header>

      {error && <p className="error" role="alert">{error}</p>}
      {prefs.status === 'error' && <p className="error" role="alert">{prefs.error}</p>}

      <div className="taste-cols">
        {COLUMNS.map((col) => {
          const items = prefs.prefs.filter((p) => p.kind === col.kind)
          return (
            <div key={col.kind} className={`taste-col taste-${col.kind}`}>
              <h3>{col.title}</h3>
              <p className="taste-hint">{col.hint}</p>
              {items.length > 0 ? (
                <ul className="taste-list">
                  {items.map((p) => (
                    <li key={p.id} className="taste-item">
                      <div>
                        <b>{p.label}</b>
                        {p.detail && <small>{p.detail}</small>}
                      </div>
                      <button type="button" className="x" aria-label={`Remove ${p.label}`} disabled={busy === p.id} onClick={() => remove(p)}>×</button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="taste-empty">{prefs.status === 'loading' ? 'Loading…' : 'Nothing yet.'}</p>
              )}
              <form className="taste-add" onSubmit={submit(col.kind)}>
                <label className="visually-hidden" htmlFor={`taste-${col.kind}`}>Add to {col.title}</label>
                <input id={`taste-${col.kind}`} type="text" placeholder={col.placeholder} value={drafts[col.kind]}
                  onChange={(e) => setDrafts((d) => ({ ...d, [col.kind]: e.target.value }))} />
                <button type="submit" className="btn btn-quiet" disabled={busy === col.kind || !drafts[col.kind].trim()}>
                  {busy === col.kind ? 'Saving…' : 'Add'}
                </button>
              </form>
            </div>
          )
        })}
      </div>

      {prefs.ratings.length > 0 && (
        <div className="rated">
          <h3>Ideas you rated</h3>
          <p className="taste-hint">Thumbs-down ideas are hidden. New recipes lean toward the ones you liked.</p>
          <ul className="rated-list">
            {[...prefs.ratings].sort((a, b) => (a.thumb === b.thumb ? 0 : a.thumb === 'up' ? -1 : 1)).map((r) => (
              <li key={r.idea} className={`rated-item rated-${r.thumb}`}>
                <span aria-hidden="true">{r.thumb === 'up' ? '👍' : '👎'}</span>
                <span className="visually-hidden">{r.thumb === 'up' ? 'Thumbs up:' : 'Thumbs down:'}</span>
                <b>{r.title}</b>
                <button type="button" className="x" aria-label={`Clear rating for ${r.title}`} disabled={busy === r.idea} onClick={() => unrate(r)}>×</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pending && (
        <Modal label="Connect to GitHub" onClose={() => setPending(null)} className="link-modal">
          <ConnectForm
            onConnected={(t) => {
              const next = pending
              setToken(t)
              setPending(null)
              next(t)
            }}
          />
        </Modal>
      )}
    </section>
  )
}
