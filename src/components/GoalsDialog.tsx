import { useState, type FormEvent } from 'react'
import { MACRO_NAMES, MACROS, type Goals, type Macro } from '../lib/preferences'
import type { PreferencesApi } from '../lib/usePreferences'
import { ConnectForm } from './ConnectForm'
import { Modal } from './Modal'

const toText = (goals: Goals) => Object.fromEntries(MACROS.map((m) => [m, goals[m] ? String(goals[m]) : ''])) as Record<Macro, string>

// Daily calories and macros, saved with your tastes. Recipes show what share
// of each they are. Any of them can be left blank.
export function GoalsDialog({ prefs, token, setToken, onClose }: {
  prefs: PreferencesApi
  token: string
  setToken: (token: string) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState(() => toText(prefs.goals))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [connecting, setConnecting] = useState(false)

  const num = (m: Macro) => Number(draft[m]) || 0
  const fromMacros = 4 * num('protein') + 4 * num('carbs') + 9 * num('fat')
  const off = num('kcal') > 0 && num('protein') > 0 && num('carbs') > 0 && num('fat') > 0 && Math.abs(fromMacros - num('kcal')) / num('kcal') > 0.05

  // From calories and protein: a quarter of the calories from fat, the rest carbs.
  function splitRest() {
    const fat = Math.round((num('kcal') * 0.25) / 9)
    const carbs = Math.max(0, Math.round((num('kcal') - 4 * num('protein') - 9 * fat) / 4))
    setDraft((d) => ({ ...d, carbs: String(carbs), fat: String(fat) }))
  }

  async function save(withToken = token) {
    if (!withToken) return setConnecting(true)
    setBusy(true)
    setError('')
    try {
      await prefs.setGoals(Object.fromEntries(MACROS.map((m) => [m, num(m)])), withToken)
      onClose()
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
    <Modal label="Daily goals" onClose={onClose} className="link-modal goals-modal">
      <form className="goals" onSubmit={submit}>
        <h2>Daily goals</h2>
        <p className="goals-sub">What you’re aiming to eat in a day. Each recipe shows what share of it it covers. Leave any of them blank.</p>
        <div className="goals-grid">
          {MACROS.map((m) => (
            <label key={m} className={`field goal goal-${m}`}>
              <span>{MACRO_NAMES[m].label}</span>
              <span className="goal-input">
                <input type="number" inputMode="numeric" min={0} step={1} value={draft[m]} disabled={busy}
                  onChange={(e) => setDraft((d) => ({ ...d, [m]: e.target.value }))} />
                <i>{MACRO_NAMES[m].unit}</i>
              </span>
            </label>
          ))}
        </div>
        {num('kcal') > 0 && num('protein') > 0 && (
          <p className="goals-help">
            <button type="button" className="link-btn" disabled={busy} onClick={splitRest}>Fill in carbs and fat for me</button>
            {' '}(a quarter of the calories from fat, the rest from carbs)
          </p>
        )}
        {off && (
          <p className="goals-help" role="status">
            These macros add up to {fromMacros.toLocaleString()} kcal, not {num('kcal').toLocaleString()}. That’s fine if you meant it.
          </p>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        <div className="form-actions">
          <button type="button" className="btn btn-quiet" disabled={busy} onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-tomato" disabled={busy}>{busy ? 'Saving…' : 'Save goals'}</button>
        </div>
      </form>

      {/* Outside the form above: ConnectForm is a form too. */}
      {connecting && (
        <Modal label="Connect to GitHub" onClose={() => setConnecting(false)} className="link-modal">
          <ConnectForm onConnected={(t) => { setToken(t); setConnecting(false); void save(t) }} />
        </Modal>
      )}
    </Modal>
  )
}
