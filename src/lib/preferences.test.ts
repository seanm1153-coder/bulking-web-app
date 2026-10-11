import { describe, expect, it } from 'vitest'
import { avoidedIn, avoidPattern, newPreference, parsePreferences, type Preference } from './preferences'

const fruit: Preference = { id: 'f', kind: 'avoid', label: 'Fruit', terms: ['fruit', 'banana', 'berry', 'berries', 'strawberry', 'apple', 'jam', 'lemon'] }
const mushrooms: Preference = { id: 'm', kind: 'avoid', label: 'Mushroom' }
const spicy: Preference = { id: 's', kind: 'love', label: 'Spicy food' }

describe('avoidPattern', () => {
  it('matches whole words and plurals', () => {
    const re = avoidPattern([fruit, mushrooms])!
    expect(re.test('Sliced bananas on top')).toBe(true)
    expect(re.test('A handful of berries')).toBe(true)
    expect(re.test('Strawberry jam')).toBe(true)
    expect(re.test('Sautéed mushrooms')).toBe(true)
    expect(re.test('A squeeze of LEMON')).toBe(true)
  })

  it('leaves similar words alone', () => {
    const re = avoidPattern([fruit])!
    expect(re.test('Pineapple-free pizza')).toBe(false) // "apple" inside a longer word
    expect(re.test('A jammy egg')).toBe(false)
    expect(re.test('Fruity Pebbles')).toBe(false)
  })

  it('ignores loves and notes, and is null with nothing to avoid', () => {
    expect(avoidPattern([spicy])).toBeNull()
    expect(avoidPattern([])).toBeNull()
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

  it('makes a new preference with a readable id', () => {
    const p = newPreference('avoid', '  Blue   cheese ', new Date(2026, 9, 11))
    expect(p).toMatchObject({ kind: 'avoid', label: 'Blue cheese', added: '2026-10-11' })
    expect(p.id).toMatch(/^avoid-blue-cheese-/)
  })
})
