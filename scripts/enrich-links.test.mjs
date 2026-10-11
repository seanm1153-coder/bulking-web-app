import { describe, expect, it } from 'vitest'
import { decodeEntities, enrich, guessCategory, parseMeta } from './enrich-links.mjs'

describe('parseMeta', () => {
  it('reads Open Graph tags in either attribute order', () => {
    const html = `<head><title>Fallback</title>
      <meta property="og:title" content="Crispy chicken &amp; rice">
      <meta content="/img/hero.jpg" property="og:image">
      <meta property="og:site_name" content='Budget Bytes'>
      <meta property="og:type" content="video.other"></head>`
    expect(parseMeta(html, 'https://www.budgetbytes.com/recipe/')).toEqual({
      title: 'Crispy chicken & rice',
      image: 'https://www.budgetbytes.com/img/hero.jpg',
      site: 'Budget Bytes',
      video: true,
    })
  })

  it('falls back to the page title', () => {
    expect(parseMeta('<title> Big   pasta </title>', 'https://x.com').title).toBe('Big pasta')
  })

  it('decodes entities', () => {
    expect(decodeEntities('Mac &#38; cheese &#x2014; it&#39;s &quot;good&quot;')).toBe('Mac & cheese — it\'s "good"')
  })
})

describe('guessCategory', () => {
  it('sorts by the most specific match', () => {
    expect(guessCategory('Meal prep chicken and rice for the week')).toBe('meal-prep')
    expect(guessCategory('1000 calorie peanut butter shake')).toBe('shakes')
    expect(guessCategory('Fluffy protein pancakes')).toBe('breakfast')
    expect(guessCategory('Smash burgers at home')).toBe('meals')
    expect(guessCategory('5 bulking mistakes, and how to eat more')).toBe('tips')
    expect(guessCategory('My trip to Japan')).toBeNull()
  })
})

describe('enrich', () => {
  it('looks up new links once, fills details and sorts the inbox', async () => {
    const links = [
      { id: '1', url: 'https://a.com/', added: '2026-10-11', category: 'inbox' },
      { id: '2', url: 'https://b.com/', added: '2026-10-11', category: 'snacks' },
      { id: '3', url: 'https://c.com/', added: '2026-10-11', category: 'inbox', title: 'Already done' },
      { id: '4', url: 'https://d.com/', added: '2026-10-11', category: 'inbox' },
    ]
    const lookup = async (url) => {
      if (url === 'https://a.com/') return { title: 'Chocolate smoothie', image: 'https://a.com/i.jpg', site: 'A', kind: 'page' }
      if (url === 'https://b.com/') return { title: 'Chicken burrito bowl', kind: 'page' }
      throw new Error('blocked')
    }
    const { links: out, changed } = await enrich(links, lookup)

    expect(changed).toBe(3)
    expect(out[0]).toMatchObject({ title: 'Chocolate smoothie', image: 'https://a.com/i.jpg', category: 'shakes' })
    expect(out[0].fetched).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(out[1].category).toBe('snacks') // a category picked by hand is kept
    expect(out[2]).toBe(links[2]) // untouched
    expect(out[3]).toMatchObject({ category: 'inbox' }) // failed lookups are marked so they aren't retried forever
    expect(out[3].fetched).toBeDefined()

    const again = await enrich(out, lookup)
    expect(again.changed).toBe(0)
  })
})
