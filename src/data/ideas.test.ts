import { describe, expect, it } from 'vitest'
import saved from '../../public/data/preferences.json'
import { avoidMatcher, parsePreferences } from '../lib/preferences'
import { STICKERS } from '../stickers/shapes'
import { BOOSTERS, boosterText, IDEAS, ideaText, isClean, KEEPS, tweakIdea } from './ideas'

// The written recipes must follow the saved preferences, so nothing on the
// Never list sneaks back in when ideas are added or edited.
describe('ideas follow preferences.json', () => {
  const prefs = parsePreferences(saved).preferences
  const avoid = avoidMatcher(prefs)

  it('has preferences to check against', () => {
    expect(prefs.length).toBeGreaterThan(0)
  })

  it.each(IDEAS.map((i) => [i.title, i] as const))('%s avoids everything on the Never list', (_, idea) => {
    expect(avoid?.(ideaText(idea)) ?? null).toBeNull()
  })

  it.each(BOOSTERS.map((b) => [b.name, b] as const))('booster %s avoids everything on the Never list', (_, booster) => {
    expect(avoid?.(boosterText(booster)) ?? null).toBeNull()
  })
})

describe('tweakIdea', () => {
  const burger = IDEAS.find((i) => i.slug === 'smash-burger')!

  it('leaves the recipe as written at 0', () => {
    const t = tweakIdea(burger, 0)
    expect(t).toMatchObject({ score: burger.clean.score, kcal: burger.kcal, protein: burger.protein, says: [] })
    expect(t.ingredients.map((l) => l.text)).toEqual(burger.ingredients)
    expect(t.ingredients.some((l) => l.changed || l.gone)).toBe(false)
  })

  it('applies notches in order, swapping lines in place and adding up the change', () => {
    const t = tweakIdea(burger, 2)
    const [a, b] = burger.clean.cleaner!
    expect(t.score).toBe(b.to)
    expect(t.kcal).toBe(burger.kcal + a.kcal + b.kcal)
    expect(t.ingredients[0]).toEqual({ text: '6 oz 90/10 ground beef, as two balls', changed: true })
    expect(t.steps.at(-1)?.text).toContain('tomato')
  })

  it('goes dirtier with negative notches, adding lines at the end', () => {
    const t = tweakIdea(burger, -1)
    expect(t.score).toBe(1)
    expect(t.ingredients.at(-1)).toEqual({ text: '3 strips bacon', changed: true })
  })

  it('marks dropped lines rather than losing them', () => {
    const oats = IDEAS.find((i) => i.slug === 'overnight-oats')!
    expect(tweakIdea(oats, 1).ingredients.find((l) => l.text === '1 tbsp honey')).toEqual({ text: '1 tbsp honey', gone: true })
  })
})

// 4 kcal per gram of protein and carbs, 9 per gram of fat. Fiber and rounding
// keep it from being exact, but numbers that don't add up are wrong.
const fromMacros = (m: { protein: number; carbs: number; fat: number }) => 4 * m.protein + 4 * m.carbs + 9 * m.fat

describe('macros add up to the calories', () => {
  it.each(IDEAS.map((i) => [i.title, i] as const))('%s', (_, idea) => {
    expect(Math.abs(fromMacros(idea) - idea.kcal) / idea.kcal).toBeLessThanOrEqual(0.1)
  })

  it.each(BOOSTERS.map((b) => [b.name, b] as const))('booster %s', (_, b) => {
    expect(Math.abs(fromMacros(b) - b.kcal) / b.kcal).toBeLessThanOrEqual(0.12)
  })

  it('on every notch, and nothing goes below zero', () => {
    for (const idea of IDEAS) {
      for (const t of [...(idea.clean.cleaner ?? []), ...(idea.clean.dirtier ?? [])]) {
        expect(Math.abs(fromMacros(t) - t.kcal), `${idea.slug}: ${t.says}`).toBeLessThanOrEqual(Math.max(30, Math.abs(t.kcal) * 0.25))
      }
      for (let n = -(idea.clean.dirtier?.length ?? 0); n <= (idea.clean.cleaner?.length ?? 0); n++) {
        const { protein, carbs, fat } = tweakIdea(idea, n)
        expect(Math.min(protein, carbs, fat), `${idea.slug} at ${n}`).toBeGreaterThanOrEqual(0)
      }
    }
  })
})

describe('ideas data', () => {
  it('has unique slugs, real stickers and boosters that exist', () => {
    expect(new Set(IDEAS.map((i) => i.slug)).size).toBe(IDEAS.length)
    const boosterIds = new Set(BOOSTERS.map((b) => b.id))
    for (const idea of IDEAS) {
      expect(STICKERS[idea.sticker], idea.slug).toBeDefined()
      for (const b of idea.boost) expect(boosterIds.has(b), `${idea.slug} → ${b}`).toBe(true)
    }
  })

  it('scores every idea from dirty to clean, with a reason, and has both ends', () => {
    for (const { slug, clean } of IDEAS) {
      expect([1, 2, 3, 4, 5], slug).toContain(clean.score)
      expect(clean.why.length, slug).toBeGreaterThan(10)
    }
    expect(IDEAS.filter(isClean).length).toBeGreaterThanOrEqual(5)
    expect(IDEAS.filter((i) => i.clean.score <= 2).length).toBeGreaterThanOrEqual(5)
  })

  it('gives every idea notches that move one way, and something cleaner unless it’s already Clean', () => {
    for (const { slug, clean } of IDEAS) {
      if (clean.score < 5) expect(clean.cleaner?.length, slug).toBeGreaterThan(0)
      const up = [clean.score, ...(clean.cleaner ?? []).map((t) => t.to)]
      const down = [clean.score, ...(clean.dirtier ?? []).map((t) => t.to)]
      up.slice(1).forEach((to, i) => expect(to, `${slug} cleaner ${i + 1}`).toBeGreaterThan(up[i]))
      down.slice(1).forEach((to, i) => expect(to, `${slug} dirtier ${i + 1}`).toBeLessThan(down[i]))
    }
  })

  it('finds every line a notch swaps, at every notch', () => {
    for (const idea of IDEAS) {
      for (let n = -(idea.clean.dirtier?.length ?? 0); n <= (idea.clean.cleaner?.length ?? 0); n++) {
        const t = tweakIdea(idea, n)
        expect(t.missing, `${idea.slug} at ${n}`).toEqual([])
        expect(t.kcal, `${idea.slug} at ${n}`).toBeGreaterThan(300)
      }
    }
  })

  it('gives every make-ahead idea a batch size, storage and reheating', () => {
    const ahead = IDEAS.filter((i) => i.ahead)
    expect(ahead.length).toBeGreaterThanOrEqual(10)
    for (const { slug, ahead: a } of ahead) {
      expect(KEEPS[a!.keeps], slug).toBeDefined()
      expect(Number.isInteger(a!.makes) && a!.makes >= 2, slug).toBe(true)
      expect(a!.unit && a!.lasts && a!.eat, slug).toBeTruthy()
      if (a!.batch) expect(a!.batch.ingredients.length && a!.batch.steps.length, slug).toBeTruthy()
    }
  })
})
