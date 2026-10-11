import { useState } from 'react'
import { categoryById, displayTitle, isVideo, siteLabel, thumbnail, youtube, type Link } from '../lib/links'
import { Sticker } from '../stickers/Sticker'

export function LinkCard({ link, tilt, onPlay, onEdit, onFavorite }: {
  link: Link
  tilt: number
  onPlay: (link: Link) => void
  onEdit: (link: Link) => void
  onFavorite: (link: Link) => void
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const cat = categoryById(link.category)
  const thumb = imageFailed ? null : thumbnail(link)
  const playsHere = youtube(link.url) !== null
  const title = displayTitle(link)

  return (
    <article className="link-card">
      <a
        className={`link-media${thumb ? ' has-image' : ''}`}
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ background: cat.color }}
        aria-label={`${playsHere ? 'Play' : 'Open'} ${title}`}
        onClick={(e) => {
          if (!playsHere) return
          e.preventDefault()
          onPlay(link)
        }}
      >
        {thumb
          ? <img src={thumb} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} />
          : <Sticker name={cat.sticker} tilt={tilt} />}
        {isVideo(link) && <span className="play" aria-hidden="true">▶</span>}
        <span className="site-tag">{siteLabel(link)}</span>
      </a>
      <div className="link-body">
        <h3><a href={link.url} target="_blank" rel="noopener noreferrer">{title}</a></h3>
        {link.note && <p className="link-note">{link.note}</p>}
        {!link.title && !link.fetched && <p className="pending">Details on the way…</p>}
        <div className="link-foot">
          <span className="cat-tag" style={{ background: cat.color }}>{cat.label}</span>
          <button type="button" className="icon-btn star" aria-pressed={!!link.favorite}
            aria-label={link.favorite ? 'Remove from favorites' : 'Add to favorites'} onClick={() => onFavorite(link)}>★</button>
          <button type="button" className="icon-btn" onClick={() => onEdit(link)}>Edit</button>
        </div>
      </div>
    </article>
  )
}
