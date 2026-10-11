import { useEffect, useState } from 'react'
import { Boosters } from './components/Boosters'
import { Hero } from './components/Hero'
import { IdeaDialog } from './components/IdeaDialog'
import { Ideas } from './components/Ideas'
import { Library } from './components/Library'
import { LinkDialog } from './components/LinkDialog'
import { SetupDialog } from './components/SetupDialog'
import { VideoDialog } from './components/VideoDialog'
import { IDEAS, type Idea } from './data/ideas'
import { findUrl, normalizeUrl, type Link } from './lib/links'
import { useLinks } from './lib/useLinks'

const SHARE_PARAMS = ['add', 'url', 'text']

// A link handed over by the bookmarklet or the iPhone Shortcut, as ?add=<url>.
function sharedUrl(): string | null {
  const params = new URLSearchParams(location.search)
  for (const key of SHARE_PARAMS) {
    const value = params.get(key)
    const url = value && (findUrl(value) ?? normalizeUrl(value))
    if (url) return url
  }
  return null
}

function randomIdea(except?: Idea): Idea {
  const pool = IDEAS.filter((i) => i !== except)
  return pool[Math.floor(Math.random() * pool.length)]
}

type LinkForm = { url?: string; editing?: Link }

export default function App() {
  const api = useLinks()
  const [idea, setIdea] = useState<{ idea: Idea; random: boolean } | null>(null)
  const [linkForm, setLinkForm] = useState<LinkForm | null>(() => {
    const url = sharedUrl()
    return url ? { url } : null
  })
  const [setupOpen, setSetupOpen] = useState(false)
  const [video, setVideo] = useState<Link | null>(null)

  // Drop ?add= from the address bar once it has been read, so a reload
  // doesn't offer to save the same link again.
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (!SHARE_PARAMS.some((k) => params.has(k))) return
    SHARE_PARAMS.forEach((k) => params.delete(k))
    const rest = params.toString()
    history.replaceState(null, '', `${location.pathname}${rest ? `?${rest}` : ''}${location.hash}`)
  }, [])

  // Paste or drop a link anywhere on the page to save it.
  useEffect(() => {
    const busy = () => document.querySelector('dialog[open]') !== null
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null
      if (busy() || target?.closest('input, textarea, [contenteditable="true"]')) return
      const url = findUrl(e.clipboardData?.getData('text') ?? '')
      if (!url) return
      e.preventDefault()
      setLinkForm({ url })
    }
    const isLinkDrag = (e: DragEvent) => !busy() && !!e.dataTransfer && [...e.dataTransfer.types].some((t) => t === 'text/uri-list' || t === 'text/plain')
    const onDragOver = (e: DragEvent) => {
      if (!isLinkDrag(e)) return
      e.preventDefault()
      document.body.classList.add('is-dropping')
    }
    const onDragLeave = (e: DragEvent) => {
      if (!e.relatedTarget) document.body.classList.remove('is-dropping')
    }
    const onDrop = (e: DragEvent) => {
      document.body.classList.remove('is-dropping')
      if (!isLinkDrag(e)) return
      const raw = e.dataTransfer?.getData('text/uri-list') || e.dataTransfer?.getData('text/plain') || ''
      const url = findUrl(raw.split(/\r?\n/).find((line) => line && !line.startsWith('#')) ?? '')
      if (!url) return
      e.preventDefault()
      setLinkForm({ url })
    }
    document.addEventListener('paste', onPaste)
    document.addEventListener('dragover', onDragOver)
    document.addEventListener('dragleave', onDragLeave)
    document.addEventListener('drop', onDrop)
    return () => {
      document.removeEventListener('paste', onPaste)
      document.removeEventListener('dragover', onDragOver)
      document.removeEventListener('dragleave', onDragLeave)
      document.removeEventListener('drop', onDrop)
    }
  }, [])

  return (
    <>
      <header className="top">
        <div className="wrap top-inner">
          <a className="logo" href="#top">Surplus<i aria-hidden="true" /></a>
          <nav className="top-nav" aria-label="Sections">
            <a href="#ideas">Ideas</a>
            <a href="#boosters">Boosters</a>
            <a href="#saved">Saved</a>
          </nav>
          <div className="top-actions">
            <button type="button" className="btn btn-quiet" onClick={() => setSetupOpen(true)}>Setup</button>
            <button type="button" className="btn btn-tomato" onClick={() => setLinkForm({})}>+ Save a link</button>
          </div>
        </div>
      </header>

      <main className="wrap" id="top">
        <Hero onIdea={() => setIdea({ idea: randomIdea(), random: true })} onSave={() => setLinkForm({})} />
        <Ideas onOpen={(i) => setIdea({ idea: i, random: false })} />
        <Boosters />
        <Library
          api={api}
          onAdd={() => setLinkForm({})}
          onEdit={(link) => setLinkForm({ editing: link })}
          onPlay={setVideo}
          onSetup={() => setSetupOpen(true)}
        />
      </main>

      <footer className="foot">
        <div className="wrap foot-inner">
          <span>Surplus · eat more, on purpose</span>
          <span>Calories are rough estimates. Stickers are drawn in code.</span>
        </div>
      </footer>

      <div className="drop-hint" aria-hidden="true"><span>Drop to save this link</span></div>

      {idea && (
        <IdeaDialog
          key={idea.idea.slug}
          idea={idea.idea}
          onClose={() => setIdea(null)}
          onAnother={idea.random ? () => setIdea({ idea: randomIdea(idea.idea), random: true }) : undefined}
        />
      )}
      {linkForm && <LinkDialog api={api} initialUrl={linkForm.url} editing={linkForm.editing} onClose={() => setLinkForm(null)} />}
      {setupOpen && <SetupDialog api={api} onClose={() => setSetupOpen(false)} />}
      {video && <VideoDialog link={video} onClose={() => setVideo(null)} />}
    </>
  )
}
