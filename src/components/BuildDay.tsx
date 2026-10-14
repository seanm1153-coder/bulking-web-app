import { useEffect, useState } from 'react'
import { fillDay, fitPortions, formatTime, fromClock, layoutFor, MEAL_COUNTS, SLOT_LABEL, slotTimes, swapSlot, toClock, totalsOf, type DaySlot, type Lean, type Totals } from '../data/day'
import type { Idea } from '../data/ideas'
import { formatAmount, portionLabel, PORTIONS } from '../data/portion'
import { MACROS, type Goals } from '../lib/preferences'
import { Sticker } from '../stickers/Sticker'
import { DayBars } from './DayBars'

const CARD_COLORS = ['var(--butter)', 'var(--pink)', 'var(--mint)', 'var(--sky)', 'var(--tomato)', 'var(--paper)']
const TILTS = [-5, 4, -3, 6, -4, 3]
const LEANS: { id: Lean; label: string }[] = [{ id: 'any', label: 'Any' }, { id: 'clean', label: 'Cleaner' }, { id: 'dirty', label: 'Dirtier' }]

// The last day built, the meal count and times, kept in this browser only.
const KEY = 'surplus:day'
interface Saved {
  meals: number
  wake: number
  bed: number
  lean: Lean
  slots: Pick<DaySlot, 'slug' | 'portion' | 'locked'>[]
}

function readSaved(): Partial<Saved> {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    return saved && typeof saved === 'object' ? (saved as Partial<Saved>) : {}
  } catch {
    return {}
  }
}

function writeSaved(saved: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(saved))
  } catch {
    // Storage blocked: the day is forgotten on reload.
  }
}

const isMinutes = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < 1440
const empty = (meals: number): DaySlot[] => layoutFor(meals).map((kind) => ({ kind, slug: null, portion: 1, locked: false }))

// The saved day, if it still fits the layout.
function restore(saved: Partial<Saved>, meals: number): DaySlot[] {
  const slots = empty(meals)
  if (!Array.isArray(saved.slots) || saved.slots.length !== slots.length) return slots
  return slots.map((s, i) => {
    const old = saved.slots![i]
    const portion = PORTIONS.find((p) => p === old?.portion)
    return typeof old?.slug === 'string' && portion ? { ...s, slug: old.slug, portion, locked: !!old.locked } : s
  })
}

// One or two things that stand out about the day against the goals.
function standouts(totals: Totals, goals: Goals): string[] {
  const off = (m: keyof Totals) => (goals[m] ? Math.round(((totals[m] - goals[m]!) / goals[m]!) * 100) : 0)
  const notes: string[] = []
  if (off('protein') <= -10) notes.push(`Protein comes out ${-off('protein')}% short. Go up a portion on a high-protein meal, or swap a snack for a shake or the protein pudding.`)
  if (off('fat') >= 15) notes.push(`Fat comes out ${off('fat')}% over. Most of these recipes get a lot of their calories from fat, even the clean ones (olive oil, avocado, nuts), so carb-heavy picks like rice, oats, pasta and shakes bring it closer.`)
  if (off('carbs') <= -15) notes.push(`Carbs come out ${-off('carbs')}% under, so there’s room for more rice, oats or bread.`)
  if (off('kcal') <= -10) notes.push(`That’s ${-off('kcal')}% short on calories. Try more meals, or bigger portions.`)
  if (off('kcal') >= 8) notes.push(`That’s ${off('kcal')}% over on calories, even with smaller portions. These recipes are big; try fewer meals.`)
  return notes.slice(0, 2)
}

// Build a day: a sample day of meals at real times that adds up to the daily
// goals, to see what they look like on a plate. Shuffle for another; keep
// the meals you like first.
export function BuildDay({ ideas, goals, ready, onOpen, onGoals }: {
  ideas: Idea[] // already filtered by tastes and thumbs
  goals: Goals
  ready: boolean // tastes and goals have loaded
  onOpen: (idea: Idea, portion: number) => void
  onGoals: () => void
}) {
  const [saved] = useState(readSaved)
  const [meals, setMeals] = useState<number>(() => MEAL_COUNTS.find((n) => n === saved.meals) ?? 4)
  const [wake, setWake] = useState(isMinutes(saved.wake) ? saved.wake : 7 * 60)
  const [bed, setBed] = useState(isMinutes(saved.bed) ? saved.bed : 23 * 60)
  const [lean, setLean] = useState<Lean>(LEANS.find((l) => l.id === saved.lean)?.id ?? 'any')
  const [slots, setSlots] = useState<DaySlot[]>(() => restore(saved, meals))
  const hasGoals = MACROS.some((m) => goals[m])

  // Fill the day once there are goals, and replace any meal that's since
  // been hidden (a Never or a thumbs down), keeping the rest as they are.
  // Checked whenever the ideas or goals arrive or change, during render
  // rather than in an effect, so there's no flash of the old day.
  // Goals compared by value: the file reloads whenever the tab regains focus.
  const goalsKey = MACROS.map((m) => goals[m] ?? 0).join(',')
  const [checked, setChecked] = useState<{ ideas: Idea[]; goalsKey: string } | null>(null)
  if (hasGoals && ideas.length && (checked?.ideas !== ideas || checked.goalsKey !== goalsKey)) {
    setChecked({ ideas, goalsKey })
    const there = (slot: DaySlot) => !!slot.slug && ideas.some((i) => i.slug === slot.slug)
    if (!slots.every(there)) {
      const filled = fillDay(slots.map((slot) => (there(slot) ? { ...slot, locked: true } : { ...slot, slug: null, locked: false })), ideas, goals, lean)
      setSlots(filled.map((slot, n) => ({ ...slot, locked: there(slots[n]) && slots[n].locked })))
    } else if (checked && checked.goalsKey !== goalsKey) {
      setSlots(fitPortions(slots, ideas, goals)) // new goals: same meals, new portions
    }
  }

  useEffect(() => writeSaved({ meals, wake, bed, lean, slots: slots.map(({ slug, portion, locked }) => ({ slug, portion, locked })) }), [meals, wake, bed, lean, slots])

  const shuffle = () => setSlots(fillDay(slots, ideas, goals, lean))
  const changeMeals = (n: number) => {
    setMeals(n)
    setSlots(fillDay(empty(n), ideas, goals, lean))
  }
  const changeLean = (next: Lean) => {
    setLean(next)
    setSlots(fillDay(slots, ideas, goals, next))
  }
  const update = (index: number, change: Partial<DaySlot>) => setSlots((list) => list.map((s, i) => (i === index ? { ...s, ...change } : s)))
  const step = (index: number, by: number) => {
    const at = PORTIONS.findIndex((p) => p === slots[index].portion)
    update(index, { portion: PORTIONS[Math.min(PORTIONS.length - 1, Math.max(0, at + by))] })
  }

  const bedtime = bed <= wake ? bed + 1440 : bed // after midnight
  const times = slotTimes(layoutFor(meals), wake, bedtime)
  const totals = totalsOf(slots, ideas)
  const gapHours = meals > 1 ? Math.round(((times.at(-1)! - times[0]) / (meals - 1) / 60) * 4) / 4 : 0
  const notes = standouts(totals, goals)
  const kcalOf = slots.map((slot) => {
    const idea = ideas.find((x) => x.slug === slot.slug)
    return idea ? Math.round(idea.kcal * slot.portion) : 0
  })
  const soFar = kcalOf.map((_, i) => kcalOf.slice(0, i + 1).reduce((a, b) => a + b, 0))

  return (
    <section className="section build-day" id="day" aria-labelledby="day-h">
      <header className="section-head">
        <div>
          <h2 id="day-h">Build a day</h2>
          <p className="section-sub">What hitting your goals could look like, meal by meal and hour by hour. Shuffle for another day; keep the meals you like first.</p>
        </div>
      </header>

      <div className="day-setup">
        <div className="day-field">
          <span id="day-meals">Meals</span>
          <div className="pills" role="group" aria-labelledby="day-meals">
            {MEAL_COUNTS.map((n) => (
              <button key={n} type="button" className="pill" aria-pressed={meals === n} onClick={() => changeMeals(n)}>{n}</button>
            ))}
          </div>
        </div>
        <label className="day-field">
          <span>Up at</span>
          <input type="time" value={toClock(wake)} onChange={(e) => { const m = fromClock(e.target.value); if (m !== null) setWake(m) }} />
        </label>
        <label className="day-field">
          <span>Bed at</span>
          <input type="time" value={toClock(bed)} onChange={(e) => { const m = fromClock(e.target.value); if (m !== null) setBed(m) }} />
        </label>
        <div className="day-field">
          <span id="day-lean">Lean</span>
          <div className="pills" role="group" aria-labelledby="day-lean">
            {LEANS.map((l) => (
              <button key={l.id} type="button" className="pill" aria-pressed={lean === l.id} onClick={() => changeLean(l.id)}>{l.label}</button>
            ))}
          </div>
        </div>
        <button type="button" className="btn btn-tomato" disabled={!hasGoals} onClick={shuffle}>🎲 Shuffle</button>
      </div>

      {!ready ? (
        <p className="taste-empty">Loading…</p>
      ) : !hasGoals ? (
        <div className="empty day-nogoals">
          <Sticker name="egg" tilt={-8} />
          <div>
            <h3>Set your daily goals first</h3>
            <p>Then this builds a day of meals that adds up to them.</p>
            <button type="button" className="btn btn-tomato" onClick={onGoals}>Set daily goals</button>
          </div>
        </div>
      ) : (
        <>
          <p className="day-summary">
            {goals.kcal && <>To eat <b>{goals.kcal.toLocaleString()} kcal</b>{goals.protein && <> and <b>{goals.protein} g protein</b></>} in {meals} meals, each one needs to average about <b>{(Math.round(goals.kcal / meals / 10) * 10).toLocaleString()} kcal</b>{goals.protein && <> and <b>{Math.round(goals.protein / meals)} g protein</b></>}. </>}
            Meals from {formatTime(times[0])} to {formatTime(times.at(-1)!)}{gapHours > 0 && `, about every ${formatAmount(gapHours)} hours`}.
          </p>

          <ol className="day-timeline">
            {slots.map((s, i) => {
              const idea = ideas.find((x) => x.slug === s.slug)
              const kcal = kcalOf[i]
              return (
                <li key={i} className="day-slot" style={{ background: CARD_COLORS[i % CARD_COLORS.length] }}>
                  <p className="slot-when"><b>{formatTime(times[i])}</b><span>{SLOT_LABEL[s.kind]}</span></p>
                  {idea ? (
                    <>
                      <Sticker name={idea.sticker} palette={idea.palette} tilt={TILTS[i % TILTS.length]} />
                      <button type="button" className="slot-title" onClick={() => onOpen(idea, s.portion)}>{idea.title}</button>
                      <div className="slot-portion" role="group" aria-label={`Portion of ${idea.title}`}>
                        <button type="button" aria-label="Smaller portion" disabled={s.portion === PORTIONS[0]} onClick={() => step(i, -1)}>−</button>
                        <span>{portionLabel(s.portion)}</span>
                        <button type="button" aria-label="Bigger portion" disabled={s.portion === PORTIONS.at(-1)} onClick={() => step(i, 1)}>+</button>
                      </div>
                      <p className="slot-stats"><b>{kcal.toLocaleString()}</b> kcal · {Math.round(idea.protein * s.portion)} g protein</p>
                      <p className="slot-sofar">By then: {soFar[i].toLocaleString()} kcal{goals.kcal ? ` · ${Math.round((soFar[i] / goals.kcal) * 100)}%` : ''}</p>
                      <div className="slot-actions">
                        <button type="button" className="pill" onClick={() => setSlots(swapSlot(slots, i, ideas, goals, lean))}>↻ Swap</button>
                        <button type="button" className="pill" aria-pressed={s.locked} onClick={() => update(i, { locked: !s.locked })}>{s.locked ? '🔒 Kept' : 'Keep'}</button>
                      </div>
                    </>
                  ) : (
                    <p className="slot-stats">Nothing fits here.</p>
                  )}
                </li>
              )
            })}
          </ol>

          <div className="day-bottom">
            <DayBars totals={totals} goals={goals} onGoals={onGoals} title="The whole day" values className="day-total" />
            {notes.length > 0 && <ul className="day-notes">{notes.map((note) => <li key={note}>{note}</li>)}</ul>}
          </div>
        </>
      )}
    </section>
  )
}
