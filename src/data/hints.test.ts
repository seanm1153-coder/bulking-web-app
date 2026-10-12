import { describe, expect, it } from 'vitest'
import type { Preference, Rating } from '../lib/preferences'
import { hintDetail, listOf, tasteHints } from './hints'
import type { Idea } from './ideas'

const idea = (slug: string, ...ingredients: string[]): Idea => ({
  slug, title: slug, category: 'meals', sticker: 'bowl', kcal: 900, protein: 40, carbs: 90, fat: 40, time: '10 min',
  blurb: '', ingredients, steps: [], boost: [], clean: { score: 3, why: '' },
})
const ideas = [
  idea('a', '2 eggs', 'heavy cream'),
  idea('b', '3 eggs', 'honey'),
  idea('c', 'honey', 'cream'),
  idea('d', 'cheddar', 'rice'),
  idea('e', 'parmesan', 'rice'),
]
const thumb = (slug: string, t: Rating['thumb'], reasons?: string[]): Rating => ({ idea: slug, title: slug, thumb: t, on: '2026-10-12', ...(reasons ? { reasons } : {}) })
const pref = (kind: Preference['kind'], label: string, terms?: string[]): Preference => ({ id: label, kind, label, terms })
const keys = (ratings: Rating[], prefs: Preference[] = []) => tasteHints(ratings, prefs, ideas).map((h) => h.key).sort()

describe('tasteHints', () => {
  it('suggests a Never for a food in two or more ideas you turned down', () => {
    expect(keys([thumb('a', 'down'), thumb('b', 'down')])).toEqual(['avoid:eggs'])
    expect(tasteHints([thumb('a', 'down'), thumb('b', 'down')], [], ideas)[0]).toMatchObject({ ideas: ['a', 'b'] })
  })

  it('needs two, and holds back when you liked an idea with it too', () => {
    expect(keys([thumb('a', 'down')])).toEqual([])
    expect(keys([thumb('b', 'down'), thumb('c', 'down'), thumb('a', 'up')])).toEqual(['avoid:honey'])
  })

  it('suggests a Love for a food in two or more ideas you liked', () => {
    expect(keys([thumb('d', 'up'), thumb('e', 'up')])).toEqual(['love:cheese', 'love:rice'])
  })

  it('skips foods already in your tastes or covered by a Never', () => {
    expect(keys([thumb('d', 'up'), thumb('e', 'up')], [pref('love', 'Rice')])).toEqual(['love:cheese'])
    expect(keys([thumb('d', 'up'), thumb('e', 'up')], [pref('avoid', 'Dairy', ['cheese', 'milk'])])).toEqual(['love:rice'])
  })

  it('suggests a note for a reason you keep giving, unless it’s already noted', () => {
    const ratings = [thumb('a', 'down', ['Too much work']), thumb('d', 'down', ['Too much work', 'Too sweet']), thumb('missing', 'down', ['Too much work'])]
    const notes = tasteHints(ratings, [], ideas).filter((h) => h.kind === 'note')
    expect(notes).toMatchObject([{ reason: 'Too much work', note: 'Keep recipes quick, with few steps', ideas: ['a', 'd', 'missing'] }])
    expect(keys(ratings, [pref('note', 'keep recipes quick, with few steps')])).toEqual([])
  })

  it('ignores ratings for ideas that no longer exist when counting foods', () => {
    expect(keys([thumb('a', 'down'), thumb('gone', 'down')])).toEqual([])
  })
})

describe('hint text', () => {
  it('lists ideas the way you’d say them', () => {
    expect(listOf(['a'])).toBe('a')
    expect(listOf(['a', 'b'])).toBe('a and b')
    expect(listOf(['a', 'b', 'c'])).toBe('a, b and c')
  })

  it('says where a suggestion came from', () => {
    const [eggs] = tasteHints([thumb('a', 'down'), thumb('b', 'down')], [], ideas)
    expect(hintDetail(eggs)).toBe('In 2 ideas you turned down: a and b.')
    const [note] = tasteHints([thumb('a', 'down', ['Too sweet']), thumb('b', 'down', ['Too sweet'])], [pref('avoid', 'Eggs', ['egg'])], ideas)
    expect(hintDetail(note)).toBe('You said “too sweet” about a and b.')
  })
})
