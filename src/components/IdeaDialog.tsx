import { useState } from 'react'
import { IDEA_CATEGORIES, type Booster, type BoosterId, type Idea } from '../data/ideas'
import { Sticker } from '../stickers/Sticker'
import { Modal } from './Modal'

export function IdeaDialog({ idea, boosters: all, onClose, onAnother }: {
  idea: Idea
  boosters: Booster[]
  onClose: () => void
  onAnother?: () => void
}) {
  const [picked, setPicked] = useState<BoosterId[]>([])
  const category = IDEA_CATEGORIES.find((c) => c.id === idea.category)?.label

  // Suggested boosters first, then the rest.
  const boosters = [...all.filter((b) => idea.boost.includes(b.id)), ...all.filter((b) => !idea.boost.includes(b.id))]
  const added = all.filter((b) => picked.includes(b.id))
  const kcal = idea.kcal + added.reduce((n, b) => n + b.kcal, 0)
  const protein = idea.protein + added.reduce((n, b) => n + b.protein, 0)
  const toggle = (id: BoosterId) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  return (
    <Modal label={idea.title} onClose={onClose} className="idea-modal">
      <div className="idea-art">
        <Sticker name={idea.sticker} palette={idea.palette} tilt={-4} className="pop" />
        <div className="booster-stack" aria-hidden="true">
          {added.map((b, i) => <Sticker key={b.id} name={b.sticker} palette={b.palette} tilt={i % 2 ? 10 : -10} className="pop" />)}
        </div>
        <div className="stat-row" aria-live="polite">
          <span className="badge"><b>{kcal.toLocaleString()}</b>kcal</span>
          <span className="badge badge-pink"><b>{protein}g</b>protein</span>
        </div>
      </div>
      <div className="idea-body">
        <p className="kicker">{category} · {idea.time}</p>
        <h2>{idea.title}</h2>
        <p className="idea-blurb">{idea.blurb}</p>

        <div className="recipe">
          <div>
            <h3>You need</h3>
            <ul>{idea.ingredients.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div>
            <h3>Do this</h3>
            <ol>{idea.steps.map((x) => <li key={x}>{x}</li>)}</ol>
          </div>
        </div>

        <div className="make-bigger">
          <h3>Make it bigger {added.length > 0 && <span className="plus">+{(kcal - idea.kcal).toLocaleString()} kcal</span>}</h3>
          <div className="boost-chips" role="group" aria-label="Add boosters">
            {boosters.map((b) => (
              <button key={b.id} type="button" className="boost-chip" aria-pressed={picked.includes(b.id)} onClick={() => toggle(b.id)}>
                <Sticker name={b.sticker} palette={b.palette} />
                <span><b>+{b.kcal}</b> {b.name.toLowerCase()}, {b.amount}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="fine">Calories and protein are rough estimates.</p>
        {onAnother && <button type="button" className="btn btn-tomato" onClick={onAnother}>Another idea</button>}
      </div>
    </Modal>
  )
}
