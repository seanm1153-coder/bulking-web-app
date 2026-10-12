import { useState } from 'react'
import { foodsIn, type Food } from '../data/foods'
import { CLEAN_LEVELS, IDEA_CATEGORIES, ideaText, KEEPS, tweakIdea, type Ahead, type Booster, type BoosterId, type Idea, type Line, type Tweaked } from '../data/ideas'
import type { Thumb } from '../lib/preferences'
import type { PreferencesApi } from '../lib/usePreferences'
import { Sticker } from '../stickers/Sticker'
import { CleanMeter } from './CleanMeter'
import { ConnectForm } from './ConnectForm'
import { Modal } from './Modal'
import { ThumbsDownForm } from './ThumbsDown'

export function IdeaDialog({ idea, boosters: all, prefs, token, setToken, onClose, onAnother, anotherLabel = 'Another idea' }: {
  idea: Idea
  boosters: Booster[]
  prefs: PreferencesApi
  token: string
  setToken: (token: string) => void
  onClose: () => void
  onAnother?: () => void
  anotherLabel?: string
}) {
  const [picked, setPicked] = useState<BoosterId[]>([])
  const [notch, setNotch] = useState(0) // on the clean-or-dirty slider; 0 is as written
  const category = IDEA_CATEGORIES.find((c) => c.id === idea.category)?.label

  // Suggested boosters first, then the rest.
  const boosters = [...all.filter((b) => idea.boost.includes(b.id)), ...all.filter((b) => !idea.boost.includes(b.id))]
  const added = all.filter((b) => picked.includes(b.id))
  const boostKcal = added.reduce((n, b) => n + b.kcal, 0)
  const tweaked = tweakIdea(idea, notch)
  const kcal = tweaked.kcal + boostKcal
  const protein = tweaked.protein + added.reduce((n, b) => n + b.protein, 0)
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

        <CleanSlider idea={idea} notch={notch} setNotch={setNotch} tweaked={tweaked} boosters={boosters} />

        <div className="recipe">
          <div>
            <h3>You need{batchFirst && <span className="plus">makes {idea.ahead!.makes}</span>}</h3>
            <ul>{tweaked.ingredients.map((l, i) => <RecipeLine key={i} line={l} />)}</ul>
          </div>
          <div>
            <h3>Do this</h3>
            <ol>{tweaked.steps.filter((l) => !l.gone).map((l, i) => <RecipeLine key={i} line={l} />)}</ol>
          </div>
        </div>

        {idea.ahead && <MakeAhead ahead={idea.ahead} kcal={idea.kcal + boostKcal} tweaked={notch !== 0} />}

        <div className="make-bigger">
          <h3>Make it bigger {added.length > 0 && <span className="plus">+{boostKcal.toLocaleString()} kcal</span>}</h3>
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
        {onAnother && <button type="button" className="btn btn-tomato" onClick={onAnother}>{anotherLabel}</button>}
      </div>
    </Modal>
  )
}

const orList = (items: string[]) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} or ${items.at(-1)}`)
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${Math.abs(n).toLocaleString()}`
const CLEAN_BOOSTERS: BoosterId[] = ['oil', 'avocado', 'nuts']

// Where the recipe sits from dirty to clean, and a slider that changes it:
// each notch is one of the idea's tweaks, applied to the recipe below.
function CleanSlider({ idea, notch, setNotch, tweaked, boosters }: {
  idea: Idea
  notch: number
  setNotch: (n: number) => void
  tweaked: Tweaked
  boosters: Booster[]
}) {
  const min = -(idea.clean.dirtier?.length ?? 0)
  const max = idea.clean.cleaner?.length ?? 0
  const kcal = tweaked.kcal - idea.kcal
  const protein = tweaked.protein - idea.protein
  // Cleaner usually means fewer calories; point at the clean way back up.
  const makeUp = notch > 0 && kcal <= -50
    ? boosters.filter((b) => CLEAN_BOOSTERS.includes(b.id)).map((b) => b.name.toLowerCase())
    : []

  return (
    <div className={`clean-box clean-${tweaked.score}`}>
      <p className="clean-scale">
        <CleanMeter score={tweaked.score} big /> <b>{CLEAN_LEVELS[tweaked.score]}</b>
        {notch !== 0 && <button type="button" className="link-btn" onClick={() => setNotch(0)}>Back to as written</button>}
      </p>
      {min < max && (
        <div className="clean-slider">
          <span className="clean-end-dirty" aria-hidden="true">Dirtier</span>
          <div className="clean-track">
            <input type="range" min={min} max={max} step={1} value={notch} onChange={(e) => setNotch(Number(e.target.value))}
              aria-label="Make it dirtier or cleaner"
              aria-valuetext={`${CLEAN_LEVELS[tweaked.score]}${notch === 0 ? ', as written' : `: ${tweaked.says.join(', ')}`}`} />
            <div className="clean-ticks" aria-hidden="true">
              {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
                <span key={n} className={n === 0 ? 'as-written' : undefined}>{n === 0 && 'as written'}</span>
              ))}
            </div>
          </div>
          <span className="clean-end-clean" aria-hidden="true">Cleaner</span>
        </div>
      )}
      {notch === 0 ? (
        <p>{idea.clean.why}</p>
      ) : (
        <>
          <p><b>{notch > 0 ? 'Cleaner' : 'Dirtier'}:</b> {tweaked.says.join(' · ')}.</p>
          <p className="clean-delta">
            {signed(kcal)} kcal and {signed(protein)} g protein compared with the recipe as written.
            {makeUp.length > 0 && ` Win them back with ${orList(makeUp)} from Make it bigger.`}
          </p>
        </>
      )}
    </div>
  )
}

// An ingredient or step, marked when the slider changed or dropped it.
function RecipeLine({ line }: { line: Line }) {
  if (line.gone) return <li className="line-gone">{line.text}<span className="visually-hidden"> (left out)</span></li>
  if (line.changed) return <li><span className="line-changed">{line.text}</span><span className="visually-hidden"> (changed)</span></li>
  return <li>{line.text}</li>
}

// How to make it ahead: the batch (unless the recipe above already is one),
// how long it keeps, how to eat it, and what to add fresh. The total counts
// any boosters picked, since they go on every portion, but not the slider:
// the batch is the recipe as written.
function MakeAhead({ ahead, kcal, tweaked }: { ahead: Ahead; kcal: number; tweaked: boolean }) {
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
      {tweaked && ahead.batch && <p className="ahead-note">The batch is the recipe as written. Make the same swaps if you like.</p>}
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
