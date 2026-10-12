import { useState } from 'react'
import { IDEA_CATEGORIES, type Idea, type IdeaCategory } from '../data/ideas'
import { Sticker } from '../stickers/Sticker'

const CARD_COLORS = ['var(--butter)', 'var(--pink)', 'var(--mint)', 'var(--sky)', 'var(--tomato)']
const TILTS = [-4, 3, -2, 5, -5, 2]

// `ideas` is already filtered by preferences and thumbs down; `hidden` says
// what was left out. `liked` is the slugs with a thumbs up.
export function Ideas({ ideas, hidden, liked, onOpen }: {
  ideas: Idea[]
  hidden: { count: number; labels: string[]; down: number }
  liked: Set<string>
  onOpen: (idea: Idea) => void
}) {
  const [filter, setFilter] = useState<IdeaCategory | 'all'>('all')
  const shown = filter === 'all' ? ideas : ideas.filter((i) => i.category === filter)

  return (
    <section className="section" id="ideas" aria-labelledby="ideas-h">
      <header className="section-head">
        <div>
          <h2 id="ideas-h">Ideas</h2>
          <p className="section-sub">Meals that make eating more feel easy. Click one for the recipe.</p>
        </div>
        <div className="pills" role="group" aria-label="Filter ideas">
          {[{ id: 'all' as const, label: 'All' }, ...IDEA_CATEGORIES].map((c) => (
            <button key={c.id} type="button" className="pill" aria-pressed={filter === c.id} onClick={() => setFilter(c.id)}>
              {c.label}
            </button>
          ))}
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
          <button key={idea.slug} type="button" className="idea-card" style={{ background: CARD_COLORS[n % CARD_COLORS.length] }} onClick={() => onOpen(idea)}>
            {liked.has(idea.slug) && <span className="liked-tag">👍 Liked</span>}
            <Sticker name={idea.sticker} palette={idea.palette} tilt={TILTS[n % TILTS.length]} />
            <span className="idea-title">{idea.title}</span>
            <span className="idea-stats">
              <b>{idea.kcal.toLocaleString()}</b> kcal · {idea.protein} g protein · {idea.time}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
