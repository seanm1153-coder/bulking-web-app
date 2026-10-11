import { useRef, useState, type FormEvent } from 'react'
import { CATEGORIES, categoryById, findDuplicate, newLink, normalizeUrl, siteLabel, thumbnail, type CategoryId, type Link } from '../lib/links'
import type { LinksApi } from '../lib/useLinks'
import { Sticker } from '../stickers/Sticker'
import { ConnectForm } from './ConnectForm'
import { Modal } from './Modal'

// Saves a new link, or edits one when `editing` is set. Without an access key
// it asks for one first, then carries on with the same link.
export function LinkDialog({ api, initialUrl = '', editing, onClose }: {
  api: LinksApi
  initialUrl?: string
  editing?: Link
  onClose: () => void
}) {
  const [url, setUrl] = useState(editing?.url ?? initialUrl)
  const [category, setCategory] = useState<CategoryId>(editing?.category ?? 'inbox')
  const [note, setNote] = useState(editing?.note ?? '')
  const [favorite, setFavorite] = useState(!!editing?.favorite)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const urlRef = useRef<HTMLInputElement>(null)

  const normalized = normalizeUrl(url)
  const duplicate = normalized && normalized !== editing?.url ? findDuplicate(api.links, normalized) : undefined
  const thumb = normalized ? thumbnail({ url: normalized, image: normalized === editing?.url ? editing.image : undefined }) : null
  const cat = categoryById(category)

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    setError('')
    try {
      await action()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.')
      setBusy(false)
    }
  }

  function save(e: FormEvent) {
    e.preventDefault()
    if (!normalized) {
      setError('That doesn’t look like a link. Paste a full web address.')
      urlRef.current?.focus()
      return
    }
    if (duplicate) return
    if (editing) {
      const patch: Partial<Link> = { url: normalized, category, note: note.trim() || undefined, favorite: favorite || undefined }
      // A new address needs its details looked up again.
      if (normalized !== editing.url) Object.assign(patch, { title: undefined, image: undefined, site: undefined, kind: undefined, fetched: undefined })
      void run(() => api.update(editing.id, patch))
    } else {
      const link = newLink(normalized, category, note)
      if (favorite) link.favorite = true
      void run(() => api.add(link))
    }
  }

  function remove() {
    if (editing && window.confirm('Remove this link?')) void run(() => api.remove(editing.id))
  }

  return (
    <Modal label={editing ? 'Edit link' : 'Save a link'} onClose={onClose} className="link-modal">
      {!api.token ? (
        <ConnectForm onConnected={api.setToken} />
      ) : (
        <form className="link-form" onSubmit={save}>
          <h2>{editing ? 'Edit link' : 'Save a link'}</h2>

          <div className="link-preview" style={{ background: cat.color }}>
            {thumb ? <img src={thumb} alt="" referrerPolicy="no-referrer" /> : <Sticker name={cat.sticker} tilt={-6} />}
            {normalized && <span className="site-tag">{siteLabel({ url: normalized })}</span>}
          </div>

          <label className="field">
            <span>Link</span>
            <input ref={urlRef} type="url" inputMode="url" autoFocus={!initialUrl && !editing} placeholder="https://www.youtube.com/watch?v=…"
              value={url} onChange={(e) => setUrl(e.target.value)} />
          </label>
          {duplicate && <p className="error" role="alert">Already saved, in {categoryById(duplicate.category).label}.</p>}

          <fieldset className="field">
            <legend>Category</legend>
            <div className="pills">
              {CATEGORIES.map((c) => (
                <label key={c.id} className="pill pill-radio">
                  <input type="radio" name="category" value={c.id} checked={category === c.id} onChange={() => setCategory(c.id)} />
                  {c.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="field">
            <span>Note <i>(optional)</i></span>
            <textarea rows={2} placeholder="Double the garlic. Use thighs, not breasts." value={note} onChange={(e) => setNote(e.target.value)} autoFocus={!!initialUrl} />
          </label>

          <label className="check">
            <input type="checkbox" checked={favorite} onChange={(e) => setFavorite(e.target.checked)} />
            Favorite
          </label>

          {error && <p className="error" role="alert">{error}</p>}

          <div className="form-actions">
            {editing && <button type="button" className="btn btn-quiet" onClick={remove} disabled={busy}>Remove</button>}
            <button type="submit" className="btn btn-tomato" disabled={busy || !!duplicate}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Save link'}</button>
          </div>
          {!editing && <p className="fine">The title and thumbnail are filled in automatically a minute or so after saving.</p>}
        </form>
      )}
    </Modal>
  )
}
