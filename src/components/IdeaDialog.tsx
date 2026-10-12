import { useState } from 'react'
import { foodsIn, type Food } from '../data/foods'
import { IDEA_CATEGORIES, ideaText, KEEPS, type Ahead, type Booster, type BoosterId, type Idea } from '../data/ideas'
import type { Thumb } from '../lib/preferences'
import type { PreferencesApi } from '../lib/usePreferences'
import { Sticker } from '../stickers/Sticker'
import { ConnectForm } from './ConnectForm'
import { Modal } from './Modal'
import { ThumbsDownForm } from './ThumbsDown'

export function IdeaDialog({ idea, boosters: all, prefs, token, setToken, onClose, onAnother }: {
  idea: Idea
  boosters: Booster[]
  prefs: PreferencesApi
  token: string
  setToken: (token: string) => void
  onClose: () => void
  onAnother?: () => void
}) {
  const [picked, setPicked] = useState<BoosterId[]>([])
  const category = IDEA_CATEGORIES.find((c) => c.id === idea.category)?.label

  // Suggested boosters first, then the rest.
  const boosters = [...all.filter((b) => idea.boost.includes(b.id)), ...all.filter((b) => !idea.boost.includes(b.id))]
  const added = all.filter((b) => picked.includes(b.id))
  const kcal = idea.kcal + added.reduce((n, b) => n + b.kcal, 0)
  const protein = idea.protein + added.reduce((n, b) => n + b.protein, 0)
  const batchFirst = !!idea.ahead && !idea.ahead.batch // the recipe itself is the batch
  const toggle = (id: BoosterId) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  return (
    <Modal label={idea.title} onClose={onClose} className="idea-modal">
      <div className="idea-art">
        <Sticker name={idea.sticker} palette={idea.palette} tilt={-4} className="pop" />
        <div className="booster-stack" aria-hidden="true">
          {added.map((b, i) => <Sticker key={b.id} name={b.sticker} palette={b.palette} tilt={i % 2 ? 10 : -10} className="pop" />)}
        </div>
        <div className="stat-row" aria-live="polite">
          <span className="badge"><b>{kcal.toLocaleString()}</b>{batchFirst ? 'kcal each' : 'kcal'}</span>
          <span className="badge badge-pink"><b>{protein}g</b>protein</span>
        </div>
      </div>
      <div className="idea-body">
        <p className="kicker">{category} · {idea.time}</p>
        <h2>{idea.title}</h2>
        <p className="idea-blurb">{idea.blurb}</p>
        {idea.source && (
          <p className="idea-source">
            Adapted from <a href={idea.source.url} target="_blank" rel="noopener noreferrer">{idea.source.name}’s recipe ↗</a>, made bigger for bulking.
          </p>
        )}

        <div className="recipe">
          <div>
            <h3>You need{batchFirst && <span className="plus">makes {idea.ahead!.makes}</span>}</h3>
            <ul>{idea.ingredients.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div>
            <h3>Do this</h3>
            <ol>{idea.steps.map((x) => <li key={x}>{x}</li>)}</ol>
          </div>
        </div>

        {idea.ahead && <MakeAhead ahead={idea.ahead} kcal={kcal} />}

        <div className="make-bigger">
          <h3>Make it bigger {added.length > 0 && <span className="plus">+{(kcal - idea.kcal).toLocaleString()} kcal</span>}</h3>
          <div className="boost-chips" role="group" aria-label="Add boosters">
            {boosters.map((b) => (
              <button key={b.id} type="button" className="boost-chip" aria-pressed={picked.includes(b.id)} onClick={() => toggle(b.id)}>
                <Sticker name={b.sticker} palette={b.palette} />
                <span><b>+{b.kcal}</b> {b.name.toLowerCase()}, {b.amount}</span>
              </button>
            ))}
          </div>
        </div>

        <Thumbs idea={idea} prefs={prefs} token={token} setToken={setToken} />

        <p className="fine">Calories and protein are rough estimates.</p>
        {onAnother && <button type="button" className="btn btn-tomato" onClick={onAnother}>Another idea</button>}
      </div>
    </Modal>
  )
}

// How to make it ahead: the batch (unless the recipe above already is one),
// how long it keeps, how to eat it, and what to add fresh. The total counts
// any boosters picked, since they go on every portion.
function MakeAhead({ ahead, kcal }: { ahead: Ahead; kcal: number }) {
  const keeps = KEEPS[ahead.keeps]
  return (
    <section className={`ahead ahead-${ahead.keeps}`} aria-label="Make ahead">
      <h3>
        <span className="ahead-icon" aria-hidden="true">{keeps.icon}</span> Make ahead
        <span className="plus">{ahead.makes} {ahead.unit} · {(kcal * ahead.makes).toLocaleString()} kcal</span>
      </h3>
      {ahead.batch && (
        <div className="ahead-batch">
          <div>
            <h4>For {ahead.makes}</h4>
            <ul>{ahead.batch.ingredients.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div>
            <h4>Batch it</h4>
            <ol>{ahead.batch.steps.map((x) => <li key={x}>{x}</li>)}</ol>
          </div>
        </div>
      )}
      <dl className="ahead-facts">
        <div><dt>Keeps</dt><dd>{ahead.lasts}</dd></div>
        <div><dt>To eat</dt><dd>{ahead.eat}</dd></div>
        {ahead.fresh && <div><dt>Add fresh</dt><dd>{ahead.fresh.join(', ')}</dd></div>}
      </dl>
    </section>
  )
}

// 👍 or 👎 on the idea. A 👍 offers the foods in the recipe that aren't in
// your tastes yet, one tap each to Love; a 👎 asks why first (see ThumbsDown).
function Thumbs({ idea, prefs, token, setToken }: {
  idea: Idea
  prefs: PreferencesApi
  token: string
  setToken: (token: string) => void
}) {
  const rating = prefs.ratings.find((r) => r.idea === idea.slug)
  const thumb = rating?.thumb
  const [asking, setAsking] = useState(false) // the why-form for a 👎
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [added, setAdded] = useState<string[]>([])
  const [pending, setPending] = useState<((token: string) => void) | null>(null) // waiting on a GitHub key

  async function run(key: string, action: (t: string) => Promise<unknown>, withToken = token) {
    if (!withToken) return setPending(() => (t: string) => void run(key, action, t))
    setBusy(key)
    setError('')
    try {
      await action(withToken)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t save that. Try again.')
      return false
    } finally {
      setBusy(null)
    }
  }

  function press(t: Thumb) {
    if (t === 'down' && thumb !== 'down') return setAsking((a) => !a)
    setAsking(false)
    void run(t, (tok) => prefs.rate(idea, thumb === t ? null : t, tok))
  }
  const love = (food: Food) =>
    void run(food.id, async (tok) => {
      await prefs.add('love', food.label, tok)
      setAdded((a) => [...a, food.label])
    })

  const foods = thumb === 'up' ? foodsIn(ideaText(idea), prefs.prefs) : []
  const why = [...(rating?.reasons ?? []), rating?.note && `“${rating.note}”`].filter(Boolean).join(' · ')

  return (
    <div className="thumbs">
      <div className="thumbs-row">
        <h3>Would you make it again?</h3>
        <div className="thumbs-btns" role="group" aria-label="Rate this idea">
          <button type="button" className="thumb thumb-up" aria-pressed={thumb === 'up'} aria-label="Thumbs up" disabled={busy !== null} onClick={() => press('up')}>👍</button>
          <button type="button" className="thumb thumb-down" aria-pressed={thumb === 'down'} aria-expanded={thumb === 'down' ? undefined : asking} aria-label="Thumbs down" disabled={busy !== null} onClick={() => press('down')}>👎</button>
        </div>
      </div>
      {asking && (
        <div className="thumbs-more">
          <ThumbsDownForm idea={idea} prefs={prefs} token={token} setToken={setToken} onDone={() => setAsking(false)} onCancel={() => setAsking(false)} />
        </div>
      )}
      {thumb === 'down' && (
        <p className="thumbs-note">
          {why && <>You said: {why}. </>}Hidden from Ideas and Feed me. Undo it here or in Your tastes.
        </p>
      )}
      {foods.length > 0 && (
        <div className="thumbs-more">
          <p>What did you love about it? Tap to add to Love.</p>
          <div className="boost-chips" role="group" aria-label="Add to Love">
            {foods.map((f) => (
              <button key={f.id} type="button" className="boost-chip food-chip food-love" disabled={busy !== null} onClick={() => love(f)}>
                <Sticker name={f.sticker} palette={f.palette} />
                <span>{busy === f.id ? 'Saving…' : f.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {added.length > 0 && <p className="thumbs-note" aria-live="polite">Added {added.join(', ')} to Love.</p>}
      {error && <p className="error" role="alert">{error}</p>}

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
    </div>
  )
}
