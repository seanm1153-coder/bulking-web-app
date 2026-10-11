import { useState } from 'react'
import { CATEGORIES, displayTitle, siteLabel, type CategoryId, type Link } from '../lib/links'
import type { LinksApi } from '../lib/useLinks'
import { Sticker } from '../stickers/Sticker'
import { LinkCard } from './LinkCard'

type Filter = CategoryId | 'all' | 'favorites'

export function Library({ api, onAdd, onEdit, onPlay, onSetup }: {
  api: LinksApi
  onAdd: () => void
  onEdit: (link: Link) => void
  onPlay: (link: Link) => void
  onSetup: () => void
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')

  const count = (f: Filter) => api.links.filter((l) => matches(l, f)).length
  const q = query.trim().toLowerCase()
  const shown = api.links
    .filter((l) => matches(l, filter))
    .filter((l) => !q || [displayTitle(l), l.note ?? '', siteLabel(l), l.url].some((s) => s.toLowerCase().includes(q)))

  async function toggleFavorite(link: Link) {
    if (!api.token) return onSetup()
    setNotice('')
    try {
      await api.update(link.id, { favorite: link.favorite ? undefined : true })
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Couldn’t update that link.')
    }
  }

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    ...CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
    { id: 'favorites', label: '★ Favorites' },
  ]

  return (
    <section className="section" id="saved" aria-labelledby="saved-h">
      <header className="section-head">
        <div>
          <h2 id="saved-h">Saved</h2>
          <p className="section-sub">Videos, recipes and posts from around the internet. Paste a link anywhere on this page to save it.</p>
        </div>
        <div className="saved-tools">
          <label className="search">
            <span className="visually-hidden">Search saved links</span>
            <input type="search" placeholder="Search saved" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <button type="button" className="btn btn-tomato" onClick={onAdd}>+ Save a link</button>
        </div>
      </header>

      <div className="pills" role="group" aria-label="Filter saved links">
        {filters.map((f) => {
          const n = count(f.id)
          if (n === 0 && f.id !== 'all' && f.id !== filter) return null
          return (
            <button key={f.id} type="button" className="pill" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label} <span className="pill-n">{n}</span>
            </button>
          )
        })}
      </div>

      {notice && <p className="error" role="alert">{notice}</p>}
      {api.status === 'error' && (
        <p className="error" role="alert">{api.error} <button type="button" className="link-btn" onClick={onSetup}>Check the setup</button></p>
      )}

      {api.status === 'loading' ? (
        <p className="muted">Loading saved links…</p>
      ) : shown.length > 0 ? (
        <div className="link-grid">
          {shown.map((link, i) => (
            <LinkCard key={link.id} link={link} tilt={i % 2 ? 6 : -6} onPlay={onPlay} onEdit={onEdit} onFavorite={toggleFavorite} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <Sticker name="jar" tilt={-8} />
          <div>
            <h3>{api.links.length ? 'Nothing matches that.' : 'Nothing saved yet.'}</h3>
            <p>
              {api.links.length
                ? 'Try another category or search.'
                : 'Found a recipe video or a good post? Copy its link and paste it anywhere on this page.'}
            </p>
            {!api.links.length && (
              <p><button type="button" className="link-btn" onClick={onSetup}>Set up saving from your phone and browser</button></p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function matches(link: Link, filter: Filter): boolean {
  if (filter === 'all') return true
  if (filter === 'favorites') return !!link.favorite
  return link.category === filter
}
