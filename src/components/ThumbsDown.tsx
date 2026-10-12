import { useState, type FormEvent } from 'react'
import { asPreference, foodsIn } from '../data/foods'
import { ideaText, type Idea } from '../data/ideas'
import { REASONS } from '../lib/preferences'
import type { PreferencesApi } from '../lib/usePreferences'
import { Sticker } from '../stickers/Sticker'
import { ConnectForm } from './ConnectForm'
import { Modal } from './Modal'

const toggle = (list: string[], item: string) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item])

// A thumbs down with the why behind it: quick reasons, any foods in the recipe
// you never want, and a note in your own words. All optional. Saving hides the
// idea and commits everything at once.
export function ThumbsDownForm({ idea, prefs, token, setToken, onDone, onCancel }: {
  idea: Idea
  prefs: PreferencesApi
  token: string
  setToken: (token: string) => void
  onDone: () => void
  onCancel: () => void
}) {
  const [reasons, setReasons] = useState<string[]>([])
  const [never, setNever] = useState<string[]>([]) // food ids
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [foods] = useState(() => foodsIn(ideaText(idea), prefs.prefs)) // fixed while the form is open

  async function save(withToken = token) {
    if (!withToken) return setConnecting(true)
    setBusy(true)
    setError('')
    try {
      const picked = foods.filter((f) => never.includes(f.id)).map((f) => asPreference(f, 'avoid'))
      await prefs.thumbsDown(idea, { reasons, note }, picked, withToken)
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t save that. Try again.')
      setBusy(false)
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    void save()
  }

  return (
    <>
      <form className="nope" onSubmit={submit}>
        <fieldset className="nope-group">
          <legend>What put you off?</legend>
          <div className="pills">
            {REASONS.map((r) => (
              <button key={r.label} type="button" className="pill" aria-pressed={reasons.includes(r.label)} disabled={busy}
                onClick={() => setReasons((list) => toggle(list, r.label))}>
                {r.label}
              </button>
            ))}
          </div>
        </fieldset>

        {foods.length > 0 && (
          <fieldset className="nope-group">
            <legend>Anything in it you never want?</legend>
            <div className="boost-chips">
              {foods.map((f) => (
                <button key={f.id} type="button" className="boost-chip food-chip food-avoid" aria-pressed={never.includes(f.id)} disabled={busy}
                  onClick={() => setNever((list) => toggle(list, f.id))}>
                  <Sticker name={f.sticker} palette={f.palette} />
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <label className="field">
          <span>Anything else? <i>Optional. New recipes take it into account.</i></span>
          <input type="text" maxLength={200} placeholder="Felt like dessert" value={note} disabled={busy} onChange={(e) => setNote(e.target.value)} />
        </label>

        {error && <p className="error" role="alert">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn btn-quiet" disabled={busy} onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-tomato" disabled={busy}>
            {busy ? 'Saving…' : never.length ? `Hide it, add ${never.length} to Never` : 'Hide it'}
          </button>
        </div>
      </form>

      {/* Outside the form above: ConnectForm is a form too. */}
      {connecting && (
        <Modal label="Connect to GitHub" onClose={() => setConnecting(false)} className="link-modal">
          <ConnectForm onConnected={(t) => { setToken(t); setConnecting(false); void save(t) }} />
        </Modal>
      )}
    </>
  )
}

// The 👎 on an idea card opens this.
export function ThumbsDownDialog({ idea, onClose, ...rest }: Omit<Parameters<typeof ThumbsDownForm>[0], 'onDone' | 'onCancel'> & { onClose: () => void }) {
  return (
    <Modal label={`Thumbs down: ${idea.title}`} onClose={onClose} className="nope-modal">
      <div className="nope-head">
        <Sticker name={idea.sticker} palette={idea.palette} tilt={6} className="pop" />
        <div>
          <p className="kicker">👎 Not for you</p>
          <h2>{idea.title}</h2>
        </div>
      </div>
      <p className="nope-sub">Hiding it takes it off Ideas and Feed me. Saying why is optional, and it shapes your tastes and new recipes.</p>
      <ThumbsDownForm idea={idea} {...rest} onDone={onClose} onCancel={onClose} />
    </Modal>
  )
}
