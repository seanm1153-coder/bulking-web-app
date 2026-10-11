import { useEffect, useRef } from 'react'
import { REPO } from '../config'
import type { LinksApi } from '../lib/useLinks'
import { ConnectForm } from './ConnectForm'
import { Modal } from './Modal'

const siteUrl = () => `${location.origin}${location.pathname}`

// Everything needed to save links from other places: the GitHub key for this
// browser, a bookmarklet for desktop, and an iPhone Shortcut for the share sheet.
export function SetupDialog({ api, onClose }: { api: LinksApi; onClose: () => void }) {
  const bookmarklet = useRef<HTMLAnchorElement>(null)

  // React refuses to render javascript: links, so set this one directly.
  useEffect(() => {
    bookmarklet.current?.setAttribute('href', `javascript:location.href=${JSON.stringify(`${siteUrl()}?add=`)}+encodeURIComponent(location.href)`)
  }, [])

  return (
    <Modal label="Saving links" onClose={onClose} className="setup-modal">
      <h2>Saving links</h2>

      <section className="setup-block">
        <h3>This browser</h3>
        {api.token ? (
          <div className="connected">
            <p>Connected to <b>{REPO.owner}/{REPO.name}</b> with a key ending in <code>{api.token.slice(-4)}</code>.</p>
            <button type="button" className="btn btn-quiet" onClick={() => api.setToken('')}>Disconnect</button>
          </div>
        ) : (
          <ConnectForm onConnected={api.setToken} />
        )}
      </section>

      <section className="setup-block">
        <h3>Anywhere on this page</h3>
        <p>Copy a link, then press <kbd>⌘</kbd> <kbd>V</kbd> anywhere on the page. You can also drag a link onto the page.</p>
      </section>

      <section className="setup-block">
        <h3>From any website, on a computer</h3>
        <p>Drag this button to your bookmarks bar. Click it on any page to save that page here.</p>
        <a ref={bookmarklet} className="btn btn-butter bookmarklet" onClick={(e) => e.preventDefault()}>+ Save to Surplus</a>
      </section>

      <section className="setup-block">
        <h3>From your iPhone’s share sheet</h3>
        <ol className="steps">
          <li>In the Shortcuts app, make a new shortcut. In its settings, turn on <b>Show in Share Sheet</b> and let it receive URLs and text.</li>
          <li>Add a <b>URL Encode</b> action and set it to encode the <b>Shortcut Input</b>.</li>
          <li>Add an <b>Open URLs</b> action with <code>{siteUrl()}?add=</code> followed by the <b>URL Encoded Text</b>.</li>
          <li>Name it “Save to Surplus”. Now share from YouTube, TikTok, Instagram or Safari and pick it.</li>
        </ol>
        <p className="fine">The first time on your phone, the page asks for an access key. Paste the same kind of key you made for this browser.</p>
      </section>
    </Modal>
  )
}
