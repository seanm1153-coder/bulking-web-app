import { describe, expect, it } from 'vitest'
import { addPreferences, avoidedIn, avoidMatcher, cleanGoals, newPreference, parsePreferences, rate, type Preference } from './preferences'

const fruit: Preference = { id: 'f', kind: 'avoid', label: 'Fruit', terms: ['fruit', 'banana', 'berry', 'berries', 'strawberry', 'apple', 'jam', 'lemon'] }
const mushrooms: Preference = { id: 'm', kind: 'avoid', label: 'Mushroom' }
const spicy: Preference = { id: 's', kind: 'love', label: 'Spicy food' }

describe('avoidMatcher', () => {
  it('matches whole words and plurals', () => {
    const avoid = avoidMatcher([fruit, mushrooms])!
    expect(avoid('Sliced bananas on top')).toBeTruthy()
    expect(avoid('A handful of berries')).toBeTruthy()
    expect(avoid('Strawberry jam')).toBeTruthy()
    expect(avoid('Sautéed mushrooms')).toBeTruthy()
    expect(avoid('A squeeze of LEMON')).toBeTruthy()
  })

  it('leaves similar words alone', () => {
    const avoid = avoidMatcher([fruit])!
    expect(avoid('Pineapple-free pizza')).toBeNull() // "apple" inside a longer word
    expect(avoid('A jammy egg')).toBeNull()
    expect(avoid('Fruity Pebbles')).toBeNull()
  })

  it('ignores loves and notes, and is null with nothing to avoid', () => {
    expect(avoidMatcher([spicy])).toBeNull()
    expect(avoidMatcher([])).toBeNull()
  })

  it('says which word it found', () => {
    expect(avoidMatcher([fruit, mushrooms])!('Toast with Bananas')).toBe('Bananas')
  })

  it('lets allowed phrases through but still catches the term on its own', () => {
    const citrusOk: Preference = { ...fruit, allow: ['lemon juice', 'lime juice'] }
    const avoid = avoidMatcher([citrusOk, mushrooms])!
    expect(avoid('A squeeze of lemon juice')).toBeNull()
    expect(avoid('Lime Juice and salt')).toBeNull()
    expect(avoid('Lemon juice and a lemon wedge')).toBe('lemon')
    expect(avoid('Lemon zest')).toBe('Lemon')
    // One entry's allow doesn't excuse another entry's terms.
    expect(avoidMatcher([citrusOk, { id: 'j', kind: 'avoid', label: 'Juice' }])!('lemon juice')).toBe('juice')
  })

  it('says which preference a text runs into', () => {
    expect(avoidedIn('banana bread with mushrooms', [fruit, mushrooms, spicy]).map((p) => p.id)).toEqual(['f', 'm'])
  })
})

describe('preferences file', () => {
  it('drops malformed entries', () => {
    const raw = { preferences: [fruit, { kind: 'avoid' }, { label: 'x', kind: 'nope' }, spicy] }
    expect(parsePreferences(raw).preferences).toEqual([fruit, spicy])
    expect(parsePreferences(undefined).preferences).toEqual([])
  })

  it('loads files from before ratings existed, and drops malformed ratings', () => {
    expect(parsePreferences({ preferences: [fruit] })).toEqual({ preferences: [fruit], ratings: [] })
    const good = { idea: 'chicken-alfredo', title: 'Chicken alfredo', thumb: 'up', on: '2026-10-11' }
    expect(parsePreferences({ preferences: [], ratings: [good, { idea: 'x', thumb: 'meh' }, null] }).ratings).toEqual([good])
  })

  it('loads daily goals, keeping only whole positive numbers, and leaves them out when there are none', () => {
    expect(parsePreferences({ preferences: [], goals: { kcal: 3200.4, protein: 180, carbs: -5, fat: 'lots', extra: 1 } }).goals).toEqual({ kcal: 3200, protein: 180 })
    expect(parsePreferences({ preferences: [], goals: {} })).not.toHaveProperty('goals')
    expect(parsePreferences({ preferences: [] })).not.toHaveProperty('goals')
    expect(cleanGoals(null)).toEqual({})
  })

  it('keeps the why behind a thumbs down, and drops it when malformed', () => {
    const down = { idea: 'snack-plate', title: 'Cheese and salami snack plate', thumb: 'down', on: '2026-10-12' }
    const why = { ...down, reasons: ['Too rich', 7, ' '], note: ' Too salty for me ' }
    expect(parsePreferences({ preferences: [], ratings: [why] }).ratings).toEqual([{ ...down, reasons: ['Too rich'], note: 'Too salty for me' }])
    expect(parsePreferences({ preferences: [], ratings: [{ ...down, reasons: 'Too rich', note: 3 }] }).ratings).toEqual([down])
  })

  it('sets, replaces and clears a rating', () => {
    const idea = { slug: 'smash-burger', title: 'Double smash burger' }
    const day = new Date(2026, 9, 11)
    const up = rate([], idea, 'up', {}, day)
    expect(up).toEqual([{ idea: 'smash-burger', title: 'Double smash burger', thumb: 'up', on: '2026-10-11' }])
    expect(rate(up, idea, 'down', {}, day).map((r) => r.thumb)).toEqual(['down'])
    expect(rate(up, idea, null)).toEqual([])
  })

  it('saves reasons and a note with a thumbs down, leaving out empty ones', () => {
    const idea = { slug: 'smash-burger', title: 'Double smash burger' }
    const day = new Date(2026, 9, 12)
    expect(rate([], idea, 'down', { reasons: ['Too rich'], note: '  too greasy ' }, day)).toEqual([
      { idea: 'smash-burger', title: 'Double smash burger', thumb: 'down', on: '2026-10-12', reasons: ['Too rich'], note: 'too greasy' },
    ])
    expect(rate([], idea, 'down', { reasons: [], note: ' ' }, day)[0]).not.toHaveProperty('reasons')
    expect(rate([], idea, 'down', { reasons: [], note: ' ' }, day)[0]).not.toHaveProperty('note')
  })

  it('adds preferences without doubling up on a label', () => {
    const list = addPreferences([fruit, spicy], [
      { kind: 'avoid', label: 'Eggs', terms: ['egg'] },
      { kind: 'love', label: 'spicy food' },
      { kind: 'note', label: 'Keep recipes quick', detail: 'From two thumbs down' },
    ], new Date(2026, 9, 12))
    expect(list.map((p) => p.label)).toEqual(['Fruit', 'Spicy food', 'Eggs', 'Keep recipes quick'])
    expect(list[2]).toMatchObject({ kind: 'avoid', terms: ['egg'], added: '2026-10-12' })
    expect(list[3]).toMatchObject({ kind: 'note', detail: 'From two thumbs down' })
  })

  it('makes a new preference with a readable id', () => {
    const p = newPreference('avoid', '  Blue   cheese ', new Date(2026, 9, 11))
    expect(p).toMatchObject({ kind: 'avoid', label: 'Blue cheese', added: '2026-10-11' })
    expect(p.id).toMatch(/^avoid-blue-cheese-/)
  })
})
