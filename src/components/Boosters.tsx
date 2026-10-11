import { BOOSTERS } from '../data/ideas'
import { Sticker } from '../stickers/Sticker'

export function Boosters() {
  return (
    <section className="section boosters" id="boosters" aria-labelledby="boost-h">
      <header className="section-head">
        <div>
          <h2 id="boost-h">Boosters</h2>
          <p className="section-sub">Easy ways to add calories to almost anything you already eat. Open any idea to stack them on.</p>
        </div>
      </header>
      <div className="boost-grid">
        {BOOSTERS.map((b, i) => (
          <article key={b.id} className="boost-card">
            <Sticker name={b.sticker} palette={b.palette} tilt={i % 2 ? 6 : -6} />
            <p className="boost-kcal"><b>+{b.kcal}</b> kcal</p>
            <h3>{b.name} <span>{b.amount}</span></h3>
            <p>{b.tip}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
