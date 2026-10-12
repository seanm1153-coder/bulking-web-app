import { useEffect, useMemo, useState } from 'react'
import { Boosters } from './components/Boosters'
import { GoalsDialog } from './components/GoalsDialog'
import { Hero } from './components/Hero'
import { IdeaDialog } from './components/IdeaDialog'
import { Ideas } from './components/Ideas'
import { Library } from './components/Library'
import { LinkDialog } from './components/LinkDialog'
import { SetupDialog } from './components/SetupDialog'
import { SwipeQuiz } from './components/SwipeQuiz'
import { Tastes } from './components/Tastes'
import { VideoDialog } from './components/VideoDialog'
import { BOOSTERS, boosterText, IDEAS, ideaText, isClean, type Idea } from './data/ideas'
import { findUrl, normalizeUrl, type Link } from './lib/links'
import { avoidedIn } from './lib/preferences'
import { useLinks } from './lib/useLinks'
import { usePreferences } from './lib/usePreferences'
import { useToken } from './lib/useRepoFile'

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

type FeedMode = 'clean' | 'dirty'

function randomIdea(ideas: Idea[], except?: Idea): Idea | null {
  const pool = ideas.length > 1 ? ideas.filter((i) => i !== except) : ideas
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null
}

type LinkForm = { url?: string; editing?: Link }

export default function App() {
  const [token, setToken] = useToken()
  const api = useLinks(token, setToken)
  const prefs = usePreferences(token)

  // Leave out anything that mentions a food on the Never list, and ideas
  // you gave a thumbs down.
  const { avoid, prefs: prefList, ratings } = prefs
  const { ideas, boosters, hidden } = useMemo(() => {
    const ok = (text: string) => !avoid?.(text)
    const down = new Set(ratings.filter((r) => r.thumb === 'down').map((r) => r.idea))
    const allowed = IDEAS.filter((i) => ok(ideaText(i)))
    const left = IDEAS.filter((i) => !allowed.includes(i))
    const labels = [...new Set(left.flatMap((i) => avoidedIn(ideaText(i), prefList).map((p) => p.label)))]
    const ideas = allowed.filter((i) => !down.has(i.slug))
    return {
      ideas,
      boosters: BOOSTERS.filter((b) => ok(boosterText(b))),
      hidden: { count: left.length, labels, down: allowed.length - ideas.length },
    }
  }, [avoid, prefList, ratings])
  const liked = useMemo(() => new Set(ratings.filter((r) => r.thumb === 'up').map((r) => r.idea)), [ratings])
  // Clean picks from Clean and Mostly clean; dirty from everything else. If
  // that end is empty (all hidden), anything goes.
  const feedMe = (mode: FeedMode, except?: Idea) => {
    const pool = ideas.filter((i) => isClean(i) === (mode === 'clean'))
    const next = randomIdea(pool.length ? pool : ideas, except)
    setIdea(next ? { idea: next, random: mode } : null)
  }
  const [idea, setIdea] = useState<{ idea: Idea; random: FeedMode | null } | null>(null)
  const [linkForm, setLinkForm] = useState<LinkForm | null>(() => {
    const url = sharedUrl()
    return url ? { url } : null
  })
  const [setupOpen, setSetupOpen] = useState(false)
  const [goalsOpen, setGoalsOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
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
            <a href="#tastes">Tastes</a>
            <a href="#saved">Saved</a>
          </nav>
          <div className="top-actions">
            <button type="button" className="btn btn-quiet" onClick={() => setGoalsOpen(true)}>Goals</button>
            <button type="button" className="btn btn-quiet" onClick={() => setSetupOpen(true)}>Setup</button>
            <button type="button" className="btn btn-tomato" onClick={() => setLinkForm({})}>+ Save a link</button>
          </div>
        </div>
      </header>

      <main className="wrap" id="top">
        <Hero onIdea={(mode) => feedMe(mode)} onSave={() => setLinkForm({})} />
        <Ideas ideas={ideas} hidden={hidden} liked={liked} goals={prefs.goals} onOpen={(i) => setIdea({ idea: i, random: null })} />
        <Boosters boosters={boosters} />
        <Tastes prefs={prefs} token={token} setToken={setToken} onQuiz={() => setQuizOpen(true)} onGoals={() => setGoalsOpen(true)} />
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
          <span>Calories and macros are rough estimates. Stickers are drawn in code.</span>
        </div>
      </footer>

      <div className="drop-hint" aria-hidden="true"><span>Drop to save this link</span></div>

      {idea && (
        <IdeaDialog
          key={idea.idea.slug}
          idea={idea.idea}
          boosters={boosters}
          prefs={prefs}
          token={token}
          setToken={setToken}
          onClose={() => setIdea(null)}
          onAnother={idea.random ? () => feedMe(idea.random!, idea.idea) : undefined}
          anotherLabel={idea.random === 'clean' ? 'Another clean one' : idea.random === 'dirty' ? 'Another dirty one' : undefined}
          onGoals={() => setGoalsOpen(true)}
        />
      )}
      {linkForm && <LinkDialog api={api} initialUrl={linkForm.url} editing={linkForm.editing} onClose={() => setLinkForm(null)} />}
      {quizOpen && <SwipeQuiz prefs={prefs} token={token} setToken={setToken} onClose={() => setQuizOpen(false)} />}
      {setupOpen && <SetupDialog api={api} onClose={() => setSetupOpen(false)} />}
      {/* After the idea dialog, so it opens on top of it. */}
      {goalsOpen && <GoalsDialog prefs={prefs} token={token} setToken={setToken} onClose={() => setGoalsOpen(false)} />}
      {video && <VideoDialog link={video} onClose={() => setVideo(null)} />}
    </>
  )
}
