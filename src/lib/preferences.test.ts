import { describe, expect, it } from 'vitest'
import { avoidedIn, avoidMatcher, newPreference, parsePreferences, rate, type Preference } from './preferences'

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

  it('sets, replaces and clears a rating', () => {
    const idea = { slug: 'smash-burger', title: 'Double smash burger' }
    const day = new Date(2026, 9, 11)
    const up = rate([], idea, 'up', day)
    expect(up).toEqual([{ idea: 'smash-burger', title: 'Double smash burger', thumb: 'up', on: '2026-10-11' }])
    expect(rate(up, idea, 'down', day).map((r) => r.thumb)).toEqual(['down'])
    expect(rate(up, idea, null)).toEqual([])
  })

  it('makes a new preference with a readable id', () => {
    const p = newPreference('avoid', '  Blue   cheese ', new Date(2026, 9, 11))
    expect(p).toMatchObject({ kind: 'avoid', label: 'Blue cheese', added: '2026-10-11' })
    expect(p.id).toMatch(/^avoid-blue-cheese-/)
  })
})
