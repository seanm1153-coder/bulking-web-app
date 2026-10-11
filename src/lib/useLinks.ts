import { useCallback, useEffect, useRef, useState } from 'react'
import { commitLinks, loadLinks, readToken, writeToken } from './github'
import { addLink, hostOf, removeLink, updateLink, type Link } from './links'

export type LinksStatus = 'loading' | 'ready' | 'error'

export function useLinks() {
  const [token, setTokenState] = useState(readToken)
  const [links, setLinks] = useState<Link[]>([])
  const [status, setStatus] = useState<LinksStatus>('loading')
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0) // bump to load again
  const followUps = useRef<number[]>([])

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    let live = true
    const load = () =>
      loadLinks(token).then(
        (next) => {
          if (!live) return
          setLinks(next)
          setStatus('ready')
          setError('')
        },
        (e: unknown) => {
          if (!live) return
          setStatus('error')
          setError(e instanceof Error ? e.message : 'Couldn’t load saved links.')
        },
      )
    load()
    // Titles and thumbnails arrive a minute or so after saving, from the
    // deploy workflow, so look again whenever the tab comes back into focus.
    window.addEventListener('focus', load)
    return () => {
      live = false
      window.removeEventListener('focus', load)
    }
  }, [token, version])

  useEffect(() => () => followUps.current.forEach(clearTimeout), [])

  const setToken = useCallback((next: string) => {
    writeToken(next.trim())
    setTokenState(next.trim())
  }, [])

  const commit = useCallback(async (change: (links: Link[]) => Link[], message: string) => {
    if (!token) throw new Error('Connect to GitHub first.')
    const next = await commitLinks(token, change, message)
    setLinks(next)
    // Pick up the fetched title and thumbnail once the workflow has run.
    followUps.current.push(window.setTimeout(reload, 60_000), window.setTimeout(reload, 150_000))
    return next
  }, [token, reload])

  return {
    token,
    setToken,
    links,
    status,
    error,
    reload,
    add: (link: Link) => commit((ls) => addLink(ls, link), `Save link from ${hostOf(link.url)}`),
    update: (id: string, patch: Partial<Link>) => commit((ls) => updateLink(ls, id, patch), 'Update saved link'),
    remove: (id: string) => commit((ls) => removeLink(ls, id), 'Remove saved link'),
  }
}

export type LinksApi = ReturnType<typeof useLinks>
