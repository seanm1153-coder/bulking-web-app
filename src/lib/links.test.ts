import { describe, expect, it } from 'vitest'
import { addLink, displayTitle, findDuplicate, findUrl, isVideo, newLink, normalizeUrl, removeLink, siteLabel, thumbnail, updateLink, youtube } from './links'

describe('normalizeUrl', () => {
  it('adds https and strips share tracking', () => {
    expect(normalizeUrl('youtu.be/abc123XYZ_-?si=tracking')).toBe('https://youtu.be/abc123XYZ_-')
    expect(normalizeUrl('https://www.instagram.com/reel/C1abc/?igsh=xyz&utm_source=ig')).toBe('https://www.instagram.com/reel/C1abc/')
  })

  it('keeps meaningful parameters', () => {
    expect(normalizeUrl('https://www.youtube.com/watch?v=abc123XYZ_-&t=42')).toBe('https://www.youtube.com/watch?v=abc123XYZ_-&t=42')
  })

  it('rejects things that are not web links', () => {
    expect(normalizeUrl('')).toBeNull()
    expect(normalizeUrl('pancakes')).toBeNull()
    expect(normalizeUrl('javascript:alert(1)')).toBeNull()
    expect(normalizeUrl('ftp://example.com/file')).toBeNull()
  })
})

describe('findUrl', () => {
  it('pulls the link out of shared text', () => {
    expect(findUrl('Try this! https://www.tiktok.com/@chef/video/123?is_from_webapp=1 so good')).toBe('https://www.tiktok.com/@chef/video/123')
  })

  it('ignores text without a link', () => {
    expect(findUrl('notes.txt and some words')).toBeNull()
  })
})

describe('youtube', () => {
  it('reads every common URL shape', () => {
    expect(youtube('https://www.youtube.com/watch?v=abc123XYZ_-')).toEqual({ id: 'abc123XYZ_-', short: false })
    expect(youtube('https://youtu.be/abc123XYZ_-')).toEqual({ id: 'abc123XYZ_-', short: false })
    expect(youtube('https://m.youtube.com/shorts/abc123XYZ_-')).toEqual({ id: 'abc123XYZ_-', short: true })
    expect(youtube('https://www.youtube.com/embed/abc123XYZ_-')).toEqual({ id: 'abc123XYZ_-', short: false })
    expect(youtube('https://www.youtube.com/@somechannel')).toBeNull()
    expect(youtube('https://vimeo.com/123')).toBeNull()
  })
})

describe('display helpers', () => {
  it('names sites and finds thumbnails', () => {
    expect(siteLabel({ url: 'https://www.tiktok.com/@a/video/1' })).toBe('TikTok')
    expect(siteLabel({ url: 'https://www.budgetbytes.com/x' })).toBe('budgetbytes.com')
    expect(siteLabel({ url: 'https://x.com', site: 'Budget Bytes' })).toBe('Budget Bytes')
    expect(thumbnail({ url: 'https://youtu.be/abc123XYZ_-' })).toBe('https://i.ytimg.com/vi/abc123XYZ_-/hqdefault.jpg')
    expect(thumbnail({ url: 'https://example.com', image: 'https://img/x.jpg' })).toBe('https://img/x.jpg')
    expect(thumbnail({ url: 'https://example.com' })).toBeNull()
  })

  it('makes a readable stand-in title', () => {
    expect(displayTitle({ url: 'https://www.budgetbytes.com/chicken-tikka-masala/' })).toBe('Chicken tikka masala')
    expect(displayTitle({ url: 'https://www.instagram.com/reel/C1abc/' })).toBe('Instagram reel')
    expect(displayTitle({ url: 'https://www.tiktok.com/@chef/video/7300000000000000000' })).toBe('TikTok video')
    expect(displayTitle({ url: 'https://example.com/' })).toBe('Link from example.com')
    expect(displayTitle({ url: 'https://example.com/', title: 'Real title' })).toBe('Real title')
  })

  it('knows which links are videos', () => {
    expect(isVideo({ url: 'https://youtu.be/abc123XYZ_-' })).toBe(true)
    expect(isVideo({ url: 'https://www.instagram.com/reel/C1abc/' })).toBe(true)
    expect(isVideo({ url: 'https://www.instagram.com/p/C1abc/' })).toBe(false)
    expect(isVideo({ url: 'https://example.com', kind: 'video' })).toBe(true)
  })
})

describe('list changes', () => {
  const a = newLink('https://a.com/', 'meals', '  extra garlic ', new Date(2026, 9, 11))
  const b = newLink('https://b.com/', 'inbox', '')

  it('builds a new link', () => {
    expect(a).toMatchObject({ url: 'https://a.com/', category: 'meals', note: 'extra garlic', added: '2026-10-11' })
    expect(b.note).toBeUndefined()
    expect(a.id).not.toBe(b.id)
  })

  it('adds newest first, updates and removes by id', () => {
    const list = addLink(addLink([], a), b)
    expect(list.map((l) => l.url)).toEqual(['https://b.com/', 'https://a.com/'])
    expect(updateLink(list, a.id, { favorite: true }).find((l) => l.id === a.id)?.favorite).toBe(true)
    expect(removeLink(list, b.id)).toEqual([a])
    expect(findDuplicate(list, 'https://a.com/')).toBe(a)
  })
})
