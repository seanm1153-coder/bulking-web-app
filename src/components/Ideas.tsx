import { useState } from 'react'
import { IDEA_CATEGORIES, KEEPS, type Idea, type IdeaCategory } from '../data/ideas'
import { Sticker } from '../stickers/Sticker'

const CARD_COLORS = ['var(--butter)', 'var(--pink)', 'var(--mint)', 'var(--sky)', 'var(--tomato)']
const TILTS = [-4, 3, -2, 5, -5, 2]

// `ideas` is already filtered by preferences and thumbs down; `hidden` says
// what was left out. `liked` is the slugs with a thumbs up. The 👎 on a card
// calls `onNope`.
export function Ideas({ ideas, hidden, liked, onOpen, onNope }: {
  ideas: Idea[]
  hidden: { count: number; labels: string[]; down: number }
  liked: Set<string>
  onOpen: (idea: Idea) => void
  onNope: (idea: Idea) => void
}) {
  const [filter, setFilter] = useState<IdeaCategory | 'all'>('all')
  const [aheadOnly, setAheadOnly] = useState(false) // on top of the category
  const shown = ideas.filter((i) => (filter === 'all' || i.category === filter) && (!aheadOnly || i.ahead))

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
          // The open button stretches over the whole card (see .idea-open);
          // the 👎 sits on top of it.
          <article key={idea.slug} className="idea-card" style={{ background: CARD_COLORS[n % CARD_COLORS.length] }}>
            {liked.has(idea.slug) && <span className="liked-tag">👍 Liked</span>}
            <button type="button" className="nope-btn" aria-label={`Thumbs down: ${idea.title}`} title="Not for me" onClick={() => onNope(idea)}>👎</button>
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
          </article>
        ))}
      </div>
      {shown.length === 0 && <p className="taste-empty">Nothing here with these filters.</p>}
    </section>
  )
}
