import { useMemo, useState, type FormEvent } from 'react'
import { asPreference } from '../data/foods'
import { hintDetail, tasteHints, type Hint } from '../data/hints'
import type { PrefKind, Preference, Rating } from '../lib/preferences'
import type { PreferencesApi } from '../lib/usePreferences'
import { Sticker } from '../stickers/Sticker'
import { ConnectForm } from './ConnectForm'
import { Modal } from './Modal'

const COLUMNS: { kind: PrefKind; title: string; hint: string; placeholder: string }[] = [
  { kind: 'avoid', title: 'Never', hint: 'Left out of every idea and new recipe.', placeholder: 'Mushrooms' },
  { kind: 'love', title: 'Love', hint: 'More of these in new recipes.', placeholder: 'Spicy food' },
  { kind: 'note', title: 'Notes', hint: 'Anything else to keep in mind.', placeholder: 'Breakfast has to take under 10 minutes' },
]

// Suggestions you've waved off, kept in this browser only.
const SKIPPED_KEY = 'surplus:skipped-hints'

function readSkipped(): string[] {
  try {
    const list: unknown = JSON.parse(localStorage.getItem(SKIPPED_KEY) ?? '[]')
    return Array.isArray(list) ? list.filter((k): k is string => typeof k === 'string') : []
  } catch {
    return []
  }
}

function writeSkipped(keys: string[]) {
  try {
    localStorage.setItem(SKIPPED_KEY, JSON.stringify(keys))
  } catch {
    // Storage blocked: skips last until the page closes.
  }
}

const COLUMN_TITLE: Record<PrefKind, string> = { avoid: 'Never', love: 'Love', note: 'Notes' }

// A rating's why, for the list: "Too sweet · “too much like dessert”".
const whyOf = (r: Rating) => [...(r.reasons ?? []), r.note && `“${r.note}”`].filter(Boolean).join(' · ')

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
  const [skipped, setSkipped] = useState(readSkipped)
  const hints = useMemo(() => tasteHints(prefs.ratings, prefs.prefs).filter((h) => !skipped.includes(h.key)), [prefs.ratings, prefs.prefs, skipped])

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
    if (window.confirm(`Remove “${p.label}” from ${COLUMN_TITLE[p.kind]}?`)) void run(p.id, () => prefs.remove(p.id, withToken))
  }

  // Turns a suggestion into a preference, noting where it came from.
  function adopt(h: Hint, withToken = token) {
    if (!withToken) return setPending(() => (t: string) => adopt(h, t))
    const detail = hintDetail(h)
    if (h.kind === 'note') return void run(h.key, () => prefs.add('note', h.note, withToken, { detail }))
    const { terms, allow } = asPreference(h.food, h.kind)
    void run(h.key, () => prefs.add(h.kind, h.food.label, withToken, { terms, allow, detail }))
  }

  function skip(h: Hint) {
    const next = [...skipped, h.key]
    setSkipped(next)
    writeSkipped(next)
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

      {hints.length > 0 && (
        <div className="rated hints">
          <h3>What your thumbs say</h3>
          <p className="taste-hint">Patterns in the ideas you rated. Add one to your tastes, or × to skip it.</p>
          <ul className="hint-list">
            {hints.map((h) => (
              <li key={h.key} className={`hint hint-${h.kind}`}>
                {h.kind !== 'note' && <Sticker name={h.food.sticker} palette={h.food.palette} />}
                <div>
                  <b>{h.kind === 'note' ? h.note : h.food.label}</b>
                  <small>{hintDetail(h)}</small>
                </div>
                <button type="button" className="btn btn-quiet" disabled={busy === h.key} onClick={() => adopt(h)}>
                  {busy === h.key ? 'Saving…' : `Add to ${COLUMN_TITLE[h.kind]}`}
                </button>
                <button type="button" className="x" aria-label={`Skip: ${h.kind === 'note' ? h.note : h.food.label}`} onClick={() => skip(h)}>×</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {prefs.ratings.length > 0 && (
        <div className="rated">
          <h3>Ideas you rated</h3>
          <p className="taste-hint">Thumbs-down ideas are hidden. New recipes lean toward the ones you liked and steer clear of why you turned others down.</p>
          <ul className="rated-list">
            {[...prefs.ratings].sort((a, b) => (a.thumb === b.thumb ? 0 : a.thumb === 'up' ? -1 : 1)).map((r) => (
              <li key={r.idea} className={`rated-item rated-${r.thumb}`}>
                <span aria-hidden="true">{r.thumb === 'up' ? '👍' : '👎'}</span>
                <span className="visually-hidden">{r.thumb === 'up' ? 'Thumbs up:' : 'Thumbs down:'}</span>
                <b>{r.title}</b>
                {whyOf(r) && <small title={whyOf(r)}>{whyOf(r)}</small>}
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
