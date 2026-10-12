import { useState } from 'react'
import { CLEAN_LEVELS, IDEA_CATEGORIES, KEEPS, type Idea, type IdeaCategory } from '../data/ideas'
import { Sticker } from '../stickers/Sticker'
import { CleanMeter } from './CleanMeter'

const CARD_COLORS = ['var(--butter)', 'var(--pink)', 'var(--mint)', 'var(--sky)', 'var(--tomato)']
const TILTS = [-4, 3, -2, 5, -5, 2]

type Order = 'usual' | 'clean' | 'dirty'
const ORDERS: { id: Order; label: string }[] = [
  { id: 'usual', label: 'Usual order' },
  { id: 'clean', label: 'Cleanest first' },
  { id: 'dirty', label: 'Dirtiest first' },
]

// `ideas` is already filtered by preferences and thumbs down; `hidden` says
// what was left out. `liked` is the slugs with a thumbs up.
export function Ideas({ ideas, hidden, liked, onOpen }: {
  ideas: Idea[]
  hidden: { count: number; labels: string[]; down: number }
  liked: Set<string>
  onOpen: (idea: Idea) => void
}) {
  const [filter, setFilter] = useState<IdeaCategory | 'all'>('all')
  const [aheadOnly, setAheadOnly] = useState(false) // on top of the category
  const [order, setOrder] = useState<Order>('usual')
  const filtered = ideas.filter((i) => (filter === 'all' || i.category === filter) && (!aheadOnly || i.ahead))
  // Sort is stable, so ties keep the usual order.
  const shown = order === 'usual' ? filtered : [...filtered].sort((a, b) => (order === 'clean' ? b.clean.score - a.clean.score : a.clean.score - b.clean.score))

  return (
    <section className="section" id="ideas" aria-labelledby="ideas-h">
      <header className="section-head">
        <div>
          <h2 id="ideas-h">Ideas</h2>
          <p className="section-sub">Meals that make eating more feel easy. Click one for the recipe.</p>
        </div>
        <div className="idea-filters">
          <div className="pills" role="group" aria-label="Filter ideas">
            {[{ id: 'all' as const, label: 'All' }, ...IDEA_CATEGORIES].map((c) => (
              <button key={c.id} type="button" className="pill" aria-pressed={filter === c.id} onClick={() => setFilter(c.id)}>
                {c.label}
              </button>
            ))}
          </div>
          <button type="button" className="pill pill-ahead" aria-pressed={aheadOnly} onClick={() => setAheadOnly((on) => !on)}>
            {KEEPS.freezer.icon} Make ahead <span className="pill-n">{ideas.filter((i) => i.ahead).length}</span>
          </button>
          <label className="pill pill-select">
            <span className="visually-hidden">Sort ideas</span>
            <select value={order} onChange={(e) => setOrder(e.target.value as Order)}>
              {ORDERS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </label>
        </div>
      </header>

      {(hidden.count > 0 || hidden.down > 0) && (
        <p className="hidden-note">
          {[
            hidden.count > 0 && `Hiding ${hidden.count} ${hidden.count === 1 ? 'idea' : 'ideas'} with ${hidden.labels.join(', ').toLowerCase()}.`,
            hidden.down > 0 && `${hidden.count > 0 ? 'Also hiding' : 'Hiding'} ${hidden.down} you gave a thumbs down.`,
          ].filter(Boolean).join(' ')} <a href="#tastes">Your tastes</a>
        </p>
      )}

      <div className="idea-grid">
        {shown.map((idea, n) => (
          // The open button stretches over the whole card (see .idea-open).
          <article key={idea.slug} className="idea-card" style={{ background: CARD_COLORS[n % CARD_COLORS.length] }}>
            {liked.has(idea.slug) && <span className="liked-tag">👍 Liked</span>}
            <Sticker name={idea.sticker} palette={idea.palette} tilt={TILTS[n % TILTS.length]} />
            {idea.ahead && (
              <span className="keeps-tag">
                {KEEPS[idea.ahead.keeps].icon} {KEEPS[idea.ahead.keeps].label} · makes {idea.ahead.makes}
              </span>
            )}
            <button type="button" className="idea-open idea-title" onClick={() => onOpen(idea)}>{idea.title}</button>
            <span className="idea-stats">
              <b>{idea.kcal.toLocaleString()}</b> kcal · {idea.protein} g protein · {idea.time}
            </span>
            <span className="idea-clean">
              <CleanMeter score={idea.clean.score} /> {CLEAN_LEVELS[idea.clean.score]}
            </span>
          </article>
        ))}
      </div>
      {shown.length === 0 && <p className="taste-empty">Nothing here with these filters.</p>}
    </section>
  )
}
