import { describe, expect, it } from 'vitest'
import { fillDay, formatTime, fromClock, layoutFor, missBy, poolFor, seeded, slotTimes, swapSlot, toClock, totalsOf, type DaySlot } from './day'
import { IDEAS } from './ideas'

const goals = { kcal: 2600, protein: 160, carbs: 300, fat: 85 }
const empty = (meals: number): DaySlot[] => layoutFor(meals).map((kind) => ({ kind, slug: null, portion: 1, locked: false }))

describe('times', () => {
  it('spreads meals from just after waking to dinner before bed', () => {
    expect(slotTimes(layoutFor(4), 7 * 60, 23 * 60).map(formatTime)).toEqual(['7:30 am', '11:45 am', '4:15 pm', '8:30 pm'])
    expect(slotTimes(layoutFor(3), 6 * 60, 22 * 60).map(formatTime)).toEqual(['6:30 am', '1:00 pm', '7:30 pm'])
  })

  it('puts a before-bed snack 45 minutes before bed', () => {
    expect(formatTime(slotTimes(layoutFor(6), 7 * 60, 23 * 60).at(-1)!)).toBe('10:15 pm')
  })

  it('formats and reads clock times', () => {
    expect([0, 450, 720, 1230].map(formatTime)).toEqual(['12:00 am', '7:30 am', '12:00 pm', '8:30 pm'])
    expect(toClock(450)).toBe('07:30')
    expect(fromClock('22:15')).toBe(1335)
    expect(fromClock('')).toBeNull()
  })
})

describe('pools', () => {
  it('fills breakfast with breakfasts, meals with meals, snacks with snacks and shakes', () => {
    expect(poolFor('breakfast', IDEAS).every((i) => i.category === 'breakfast')).toBe(true)
    expect(poolFor('dinner', IDEAS).every((i) => i.category === 'meals')).toBe(true)
    expect(new Set(poolFor('snack', IDEAS).map((i) => i.category))).toEqual(new Set(['snacks', 'shakes']))
  })

  it('leans cleaner or dirtier, and falls back rather than going empty', () => {
    expect(poolFor('dinner', IDEAS, 'clean').every((i) => i.clean.score >= 4)).toBe(true)
    expect(poolFor('dinner', IDEAS, 'dirty').every((i) => i.clean.score <= 2)).toBe(true)
    const onlyFilthy = IDEAS.filter((i) => i.clean.score === 1)
    expect(poolFor('breakfast', onlyFilthy, 'clean').length).toBeGreaterThan(0)
  })
})

describe('fillDay', () => {
  it.each([3, 4, 5, 6])('lands close to the goals with %i meals', (meals) => {
    const day = fillDay(empty(meals), IDEAS, goals, 'any', seeded(meals))
    const t = totalsOf(day, IDEAS)
    expect(Math.abs(t.kcal - goals.kcal) / goals.kcal).toBeLessThan(0.08)
    expect(t.protein).toBeGreaterThan(goals.protein * 0.85)
    expect(new Set(day.map((s) => s.slug)).size).toBe(meals) // no repeats
    expect(day.every((s) => s.slug)).toBe(true)
  })

  it('doesn’t repeat an idea when leaning runs out of them', () => {
    const day = fillDay(empty(6), IDEAS, goals, 'clean', seeded(2))
    expect(new Set(day.map((s) => s.slug)).size).toBe(6)
  })

  it('keeps locked slots as they are', () => {
    const start = fillDay(empty(4), IDEAS, goals, 'any', seeded(1))
    start[0] = { ...start[0], slug: 'protein-pancakes', portion: 2, locked: true }
    const next = fillDay(start, IDEAS, goals, 'any', seeded(2))
    expect(next[0]).toEqual(start[0])
    expect(next.slice(1).map((s) => s.slug)).not.toContain('protein-pancakes')
  })

  it('gives a different day when shuffled', () => {
    const days = [1, 2, 3, 4, 5].map((seed) => fillDay(empty(4), IDEAS, goals, 'any', seeded(seed)).map((s) => s.slug).join())
    expect(new Set(days).size).toBeGreaterThanOrEqual(4)
  })

  it('is closer to the goals than the recipes at 1× would be', () => {
    const day = fillDay(empty(5), IDEAS, goals, 'any', seeded(9))
    const asIs = day.map((s) => ({ ...s, portion: 1 }))
    expect(missBy(totalsOf(day, IDEAS), goals)).toBeLessThanOrEqual(missBy(totalsOf(asIs, IDEAS), goals))
  })
})

describe('swapSlot', () => {
  it('changes one slot and leaves the others alone', () => {
    const day = fillDay(empty(4), IDEAS, goals, 'any', seeded(3))
    const next = swapSlot(day, 2, IDEAS, goals, 'any', seeded(4))
    expect(next[2].slug).not.toBe(day[2].slug)
    expect(next.filter((_, i) => i !== 2)).toEqual(day.filter((_, i) => i !== 2))
  })
})
