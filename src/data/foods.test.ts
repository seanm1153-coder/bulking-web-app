import { describe, expect, it } from 'vitest'
import saved from '../../public/data/preferences.json'
import { avoidMatcher, parsePreferences, type Preference } from '../lib/preferences'
import { STICKERS } from '../stickers/shapes'
import { asPreference, foodsIn, FOODS, quizDeck } from './foods'

const love = (label: string): Preference => ({ id: label, kind: 'love', label })
const never = (label: string, terms?: string[]): Preference => ({ id: label, kind: 'avoid', label, terms })

describe('quiz foods', () => {
  it('has about 30 foods with unique ids, real stickers and words to match', () => {
    expect(FOODS.length).toBeGreaterThanOrEqual(25)
    expect(new Set(FOODS.map((f) => f.id)).size).toBe(FOODS.length)
    for (const f of FOODS) {
      expect(STICKERS[f.sticker], f.id).toBeDefined()
      expect(f.terms.length, f.id).toBeGreaterThan(0)
    }
  })

  // Nothing on the Never list gets a card, and so never gets drawn.
  it('follows preferences.json', () => {
    const avoid = avoidMatcher(parsePreferences(saved).preferences)
    for (const f of FOODS) expect(avoid?.(f.label) ?? null, f.label).toBeNull()
  })

  it('matches its own label, so a Never hides what it says', () => {
    for (const f of FOODS) expect(avoidMatcher([never(f.label, f.terms)])?.(f.label), f.id).toBeTruthy()
  })
})

describe('quizDeck', () => {
  it('skips foods already in your tastes, whatever the case', () => {
    const deck = quizDeck([love('mushrooms'), never('Eggs', ['egg'])])
    expect(deck.map((f) => f.id)).not.toContain('mushrooms')
    expect(deck.map((f) => f.id)).not.toContain('eggs')
    expect(deck.length).toBe(FOODS.length - 2)
  })

  it('skips foods a Never already covers', () => {
    const deck = quizDeck([never('Dairy', ['milk', 'cheese', 'cream', 'yogurt'])]).map((f) => f.id)
    for (const id of ['milk', 'cheese', 'cream', 'yogurt', 'ice-cream']) expect(deck).not.toContain(id)
    expect(deck).toContain('butter')
  })
})

describe('foodsIn', () => {
  it('finds the foods a recipe uses, minus ones already in your tastes', () => {
    const text = 'Fettuccine, chicken breast, parmesan and a drizzle of olive oil. Peanut butter on the side.'
    expect(foodsIn(text, []).map((f) => f.id).sort()).toEqual(['cheese', 'chicken', 'pasta', 'peanut-butter'])
    expect(foodsIn(text, [love('Chicken')]).map((f) => f.id)).not.toContain('chicken')
  })
})

describe('asPreference', () => {
  it('gives a Never its matching words and a Love just the label', () => {
    const butter = FOODS.find((f) => f.id === 'butter')!
    expect(asPreference(butter, 'avoid')).toEqual({ kind: 'avoid', label: 'Butter', terms: ['butter'], allow: ['peanut butter', 'nut butter', 'cocoa butter'] })
    expect(asPreference(butter, 'love')).toEqual({ kind: 'love', label: 'Butter' })
    const avoid = avoidMatcher([{ id: 'b', ...asPreference(butter, 'avoid') }])!
    expect(avoid('Peanut butter toast')).toBeNull()
    expect(avoid('Melt some butter')).toBe('butter')
  })
})
