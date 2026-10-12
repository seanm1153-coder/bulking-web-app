import { describe, expect, it } from 'vitest'
import saved from '../../public/data/preferences.json'
import { avoidMatcher, parsePreferences } from '../lib/preferences'
import { STICKERS } from '../stickers/shapes'
import { BOOSTERS, boosterText, IDEAS, ideaText, isClean, KEEPS } from './ideas'

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
