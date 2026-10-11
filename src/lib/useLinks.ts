import { useCallback, useEffect, useRef } from 'react'
import { DATA_FILES } from '../config'
import { addLink, hostOf, removeLink, updateLink, type Link, type LinksFile } from './links'
import { useRepoFile } from './useRepoFile'

const parseLinks = (raw: unknown): LinksFile => {
  const links = (raw as Partial<LinksFile> | undefined)?.links
  return { links: Array.isArray(links) ? links : [] }
}

export function useLinks(token: string, setToken: (token: string) => void) {
  const file = useRepoFile(token, DATA_FILES.links, parseLinks)
  const { commit: commitFile, reload } = file
  const followUps = useRef<number[]>([])

  useEffect(() => () => followUps.current.forEach(clearTimeout), [])

  const commit = useCallback(async (change: (links: Link[]) => Link[], message: string) => {
    const next = await commitFile((data) => ({ ...data, links: change(data.links) }), message)
    // Titles and thumbnails arrive a minute or so after saving, from the
    // deploy workflow, so look again once it has had time to run.
    followUps.current.push(window.setTimeout(reload, 60_000), window.setTimeout(reload, 150_000))
    return next.links
  }, [commitFile, reload])

  return {
    token,
    setToken,
    links: file.data.links,
    status: file.status,
    error: file.error,
    reload,
    add: (link: Link) => commit((ls) => addLink(ls, link), `Save link from ${hostOf(link.url)}`),
    update: (id: string, patch: Partial<Link>) => commit((ls) => updateLink(ls, id, patch), 'Update saved link'),
    remove: (id: string) => commit((ls) => removeLink(ls, id), 'Remove saved link'),
  }
}

export type LinksApi = ReturnType<typeof useLinks>
