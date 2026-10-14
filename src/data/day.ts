import type { Goals, Macro } from '../lib/preferences'
import { MACROS } from '../lib/preferences'
import type { Idea } from './ideas'
import { PORTIONS } from './portion'

// Build a day: a sample day of meals at real times, with portions picked so
// it lands on the daily goals. It's for seeing what the goals look like on a
// plate, not for tracking.

export type SlotKind = 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'late'

export const SLOT_LABEL: Record<SlotKind, string> = {
  breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner', late: 'Before bed',
}

export const MEAL_COUNTS = [3, 4, 5, 6] as const

const LAYOUTS: Record<number, SlotKind[]> = {
  3: ['breakfast', 'lunch', 'dinner'],
  4: ['breakfast', 'lunch', 'snack', 'dinner'],
  5: ['breakfast', 'snack', 'lunch', 'snack', 'dinner'],
  6: ['breakfast', 'snack', 'lunch', 'snack', 'dinner', 'late'],
}
export const layoutFor = (meals: number): SlotKind[] => LAYOUTS[meals] ?? LAYOUTS[4]

// Times in minutes after midnight. The first meal is half an hour after
// waking; the last is dinner two and a half hours before bed, or a snack 45
// minutes before it. The rest are spread evenly, to the quarter hour.
export function slotTimes(kinds: SlotKind[], wake: number, bed: number): number[] {
  const first = wake + 30
  const last = Math.max(first, bed - (kinds.at(-1) === 'late' ? 45 : 150))
  const gap = kinds.length > 1 ? (last - first) / (kinds.length - 1) : 0
  return kinds.map((_, i) => Math.round((first + gap * i) / 15) * 15)
}

// 450 → "7:30 am", 1230 → "8:30 pm".
export function formatTime(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440
  const h = Math.floor(m / 60)
  return `${h % 12 || 12}:${String(m % 60).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`
}

// "08:30" ↔ 510, for <input type="time">.
export const toClock = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
export const fromClock = (value: string) => {
  const [h, m] = value.split(':').map(Number)
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null
}

export type Lean = 'any' | 'clean' | 'dirty'

export interface DaySlot {
  kind: SlotKind
  slug: string | null
  portion: number
  locked: boolean // kept when shuffling
}

// The ideas that fit a slot, leaning cleaner or dirtier if asked. Falls back
// rather than leaving a slot empty.
export function poolFor(kind: SlotKind, ideas: Idea[], lean: Lean = 'any'): Idea[] {
  const categories = kind === 'breakfast' ? ['breakfast'] : kind === 'lunch' || kind === 'dinner' ? ['meals'] : ['snacks', 'shakes']
  const fits = ideas.filter((i) => categories.includes(i.category))
  const base = fits.length ? fits : ideas
  const tiers = lean === 'clean' ? [(i: Idea) => i.clean.score >= 4, (i: Idea) => i.clean.score >= 3]
    : lean === 'dirty' ? [(i: Idea) => i.clean.score <= 2, (i: Idea) => i.clean.score <= 3]
    : []
  for (const keep of tiers) {
    const pool = base.filter(keep)
    if (pool.length) return pool
  }
  return base
}

export type Totals = Record<Macro, number>

export function totalsOf(slots: DaySlot[], ideas: Idea[]): Totals {
  const totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  for (const s of slots) {
    const idea = ideas.find((i) => i.slug === s.slug)
    if (idea) for (const m of MACROS) totals[m] += idea[m] * s.portion
  }
  for (const m of MACROS) totals[m] = Math.round(totals[m])
  return totals
}

// How far a day is from the goals, lower is better. Calories and protein
// matter most, and falling short on protein counts double. Portions other
// than 1× cost a little, so it doesn't scale everything for no reason.
export function missBy(totals: Totals, goals: Goals, portions: number[] = []): number {
  const weight: Totals = { kcal: 4, protein: 3, carbs: 1, fat: 1 }
  let score = 0
  for (const m of MACROS) {
    const goal = goals[m]
    if (!goal) continue
    let off = (totals[m] - goal) / goal
    if (m === 'protein' && off < 0) off *= 2
    score += weight[m] * off * off
  }
  return score + 0.002 * portions.reduce((n, p) => n + Math.abs(p - 1), 0)
}

// Sets each unlocked slot's portion to whatever brings the day closest to
// the goals, a slot at a time, until nothing improves.
export function fitPortions(slots: DaySlot[], ideas: Idea[], goals: Goals): DaySlot[] {
  const day = slots.map((s) => ({ ...s, portion: s.locked ? s.portion : 1 }))
  const cost = () => missBy(totalsOf(day, ideas), goals, day.map((s) => s.portion))
  for (let pass = 0; pass < 6; pass++) {
    let changed = false
    for (const s of day) {
      if (s.locked || !s.slug) continue
      const start = s.portion
      let best = start
      let bestCost = cost()
      for (const p of PORTIONS) {
        s.portion = p
        const c = cost()
        if (c < bestCost - 1e-9) [best, bestCost] = [p, c]
      }
      s.portion = best
      if (best !== start) changed = true
    }
    if (!changed) break
  }
  return day
}

const pick = <T>(list: T[], random: () => number) => list[Math.floor(random() * list.length)]

const within = (totals: Totals, goals: Goals, m: Macro, by: number) => !goals[m] || Math.abs(totals[m] - goals[m]!) / goals[m]! <= by

// Close enough to the goals to count, at three levels: calories within 6%
// and protein no more than 8% short; then also fat and carbs within 25%;
// then within 15%. Days are picked from the strictest level that has any.
export function closeness(totals: Totals, goals: Goals): number {
  if (!within(totals, goals, 'kcal', 0.06) || (goals.protein && totals.protein < goals.protein * 0.92)) return 0
  if (within(totals, goals, 'fat', 0.15) && within(totals, goals, 'carbs', 0.15)) return 3
  if (within(totals, goals, 'fat', 0.25) && within(totals, goals, 'carbs', 0.25)) return 2
  return 1
}

// A day that lands near the goals: tries a few hundred mixes of ideas for
// the unlocked slots and fits the portions. Picks at random among the ones
// that come closest (see `closeness`), so shuffling gives a different day,
// or the single closest if none count. Locked slots stay as they are. No idea appears twice
// unless a slot has nothing else.
export function fillDay(slots: DaySlot[], ideas: Idea[], goals: Goals, lean: Lean = 'any', random: () => number = Math.random, tries = 250): DaySlot[] {
  const pools = slots.map((s) => poolFor(s.kind, ideas, lean))
  const wider = slots.map((s) => poolFor(s.kind, ideas)) // before repeating an idea
  const good: { day: DaySlot[]; cost: number }[][] = [] // by closeness level
  let best: DaySlot[] = slots
  let bestCost = Infinity
  for (let t = 0; t < tries; t++) {
    const used = new Set(slots.filter((s) => s.locked && s.slug).map((s) => s.slug!))
    const draft = slots.map((s, i) => {
      if (s.locked && s.slug) return s
      const unused = (pool: Idea[]) => pool.filter((idea) => !used.has(idea.slug))
      const fresh = unused(pools[i]).length ? unused(pools[i]) : unused(wider[i])
      const idea = pick(fresh.length ? fresh : pools[i], random)
      if (idea) used.add(idea.slug)
      return { ...s, slug: idea?.slug ?? null }
    })
    const fitted = fitPortions(draft, ideas, goals)
    const totals = totalsOf(fitted, ideas)
    const cost = missBy(totals, goals, fitted.map((s) => s.portion))
    const level = closeness(totals, goals)
    if (level) (good[level] ??= []).push({ day: fitted, cost })
    if (cost < bestCost) [best, bestCost] = [fitted, cost]
  }
  // From the closest level, the best-balanced quarter (at least five), so a
  // shuffle varies without landing on a lopsided day.
  const closest = good.findLast((days) => days?.length)
  if (!closest) return best
  const ranked = [...closest].sort((a, b) => a.cost - b.cost)
  return pick(ranked.slice(0, Math.max(5, Math.ceil(ranked.length / 4))), random).day
}

// Another idea for one slot, then the portion that suits the rest of the day.
export function swapSlot(slots: DaySlot[], index: number, ideas: Idea[], goals: Goals, lean: Lean = 'any', random: () => number = Math.random): DaySlot[] {
  const taken = new Set(slots.map((s) => s.slug))
  const pool = poolFor(slots[index].kind, ideas, lean)
  const fresh = pool.filter((i) => !taken.has(i.slug))
  const idea = pick(fresh.length ? fresh : pool.filter((i) => i.slug !== slots[index].slug), random) ?? pool[0]
  const next = slots.map((s, i) => (i === index ? { ...s, slug: idea?.slug ?? null, locked: false } : s))
  // Only this slot's portion moves; everything else is left as it was.
  const frozen = next.map((s, i) => ({ ...s, locked: i !== index || s.locked }))
  const fitted = fitPortions(frozen, ideas, goals)
  return next.map((s, i) => (i === index ? { ...s, portion: fitted[i].portion } : s))
}

// A small seeded random number generator, so tests get the same day twice.
export function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
