import { displayTitle, youtube, type Link } from '../lib/links'
import { Modal } from './Modal'

// Plays a saved YouTube video in place. Other sites open in a new tab instead.
export function VideoDialog({ link, onClose }: { link: Link; onClose: () => void }) {
  const yt = youtube(link.url)
  if (!yt) return null
  const title = displayTitle(link)
  return (
    <Modal label={title} onClose={onClose} className={`video-modal${yt.short ? ' is-short' : ''}`}>
      <div className="video-frame">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${yt.id}?autoplay=1&rel=0`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
      <div className="video-meta">
        <h2>{title}</h2>
        {link.note && <p>{link.note}</p>}
        <a href={link.url} target="_blank" rel="noopener noreferrer">Open on YouTube ↗</a>
      </div>
    </Modal>
  )
}
