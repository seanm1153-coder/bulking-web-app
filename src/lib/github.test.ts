import { afterEach, describe, expect, it, vi } from 'vitest'
import { commitData, decodeBase64, encodeBase64, GitHubError, loadData } from './github'
import type { Link, LinksFile } from './links'

const link = (id: string): Link => ({ id, url: `https://example.com/${id}`, added: '2026-10-11', category: 'inbox' })
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const fileResponse = (links: Link[], sha: string) => json({ content: encodeBase64(JSON.stringify({ links })), sha })
const parse = (raw: unknown): LinksFile => ({ links: (raw as LinksFile | undefined)?.links ?? [] })
const prepend = (l: Link) => (data: LinksFile): LinksFile => ({ links: [l, ...data.links] })
const ids = (data: LinksFile) => data.links.map((l) => l.id)

afterEach(() => vi.unstubAllGlobals())

describe('base64', () => {
  it('round-trips text with emoji and accents', () => {
    const text = 'Crème brûlée 🍮 — “quotes”'
    expect(decodeBase64(encodeBase64(text))).toBe(text)
    // GitHub wraps base64 at 60 characters.
    expect(decodeBase64(encodeBase64(text).replace(/(.{10})/g, '$1\n'))).toBe(text)
  })
})

describe('commitData', () => {
  it('reads the file, applies the change and writes it back with the sha', async () => {
    const calls: { url: string; method: string; body?: { content: string; sha: string; message: string } }[] = []
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit = {}) => {
      calls.push({ url, method: init.method ?? 'GET', body: init.body ? JSON.parse(String(init.body)) : undefined })
      return init.method === 'PUT' ? json({ content: { sha: 'new' } }) : fileResponse([link('a')], 'sha1')
    }))

    const next = await commitData('token', 'links.json', parse, prepend(link('b')), 'Save link')

    expect(ids(next)).toEqual(['b', 'a'])
    const put = calls.find((c) => c.method === 'PUT')!
    expect(put.url).toMatch(/\/contents\/public\/data\/links\.json$/)
    expect(put.body!.sha).toBe('sha1')
    expect(put.body!.message).toBe('Save link')
    expect(JSON.parse(decodeBase64(put.body!.content)).links.map((l: Link) => l.id)).toEqual(['b', 'a'])
  })

  it('starts over from the newer file when someone else saved first', async () => {
    let reads = 0
    let puts = 0
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit = {}) => {
      if (init.method === 'PUT') return ++puts === 1 ? json({ message: 'conflict' }, 409) : json({ content: { sha: 'x' } })
      reads++
      return reads === 1 ? fileResponse([link('a')], 'sha1') : fileResponse([link('c'), link('a')], 'sha2')
    }))

    const next = await commitData('token', 'links.json', parse, prepend(link('b')), 'Save link')

    expect(ids(next)).toEqual(['b', 'c', 'a'])
    expect(puts).toBe(2)
  })

  it('explains a rejected key', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ message: 'Bad credentials' }, 401)))
    await expect(commitData('bad', 'links.json', parse, (d) => d, 'x')).rejects.toBeInstanceOf(GitHubError)
    await expect(commitData('bad', 'links.json', parse, (d) => d, 'x')).rejects.toThrow(/didn’t accept the access key/)
  })
})

describe('loadData', () => {
  it('treats a broken published file as empty', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{ not json', { status: 200 })))
    expect(await loadData('', 'links.json', parse)).toEqual({ links: [] })
  })
})
