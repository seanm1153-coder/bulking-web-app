import { Sticker } from '../stickers/Sticker'

export function Hero({ onIdea, onSave }: { onIdea: () => void; onSave: () => void }) {
  return (
    <section className="hero" aria-labelledby="hero-h">
      <div className="hero-copy">
        <h1 id="hero-h">More<br />food.</h1>
        <p>Big, easy meal ideas for gaining weight on purpose, and everything good you’ve saved from around the internet.</p>
        <div className="hero-btns">
          <button type="button" className="btn btn-tomato" onClick={onIdea}>Feed me an idea</button>
          <button type="button" className="btn btn-cream" onClick={onSave}>Save a link</button>
        </div>
      </div>
      <div className="hero-art" aria-hidden="true">
        <Sticker name="pancakes" tilt={-6} className="ha ha-pancakes" />
        <Sticker name="shake" tilt={10} className="ha ha-shake" />
        <Sticker name="burger" tilt={-12} className="ha ha-burger" />
        <Sticker name="egg" tilt={14} className="ha ha-egg" />
        <span className="badge ha ha-badge"><b>1,000</b>kcal stack</span>
      </div>
    </section>
  )
}
