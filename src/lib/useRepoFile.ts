import { useCallback, useEffect, useState } from 'react'
import type { DataFile } from '../config'
import { commitData, loadData, readToken, writeToken, type Parse } from './github'

export type LoadStatus = 'loading' | 'ready' | 'error'

// The GitHub access key for this browser, shared by every data file.
export function useToken() {
  const [token, setTokenState] = useState(readToken)
  const setToken = useCallback((next: string) => {
    writeToken(next.trim())
    setTokenState(next.trim())
  }, [])
  return [token, setToken] as const
}

// One JSON data file from the repo: loaded on mount and whenever the tab
// regains focus, and committed back with `commit`. `parse` must be a stable
// (module-level) function.
export function useRepoFile<T>(token: string, file: DataFile, parse: Parse<T>) {
  const [data, setData] = useState<T>(() => parse(undefined))
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0) // bump to load again

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    let live = true
    const load = () =>
      loadData(token, file, parse).then(
        (next) => {
          if (!live) return
          setData(next)
          setStatus('ready')
          setError('')
        },
        (e: unknown) => {
          if (!live) return
          setStatus('error')
          setError(e instanceof Error ? e.message : `Couldn’t load ${file}.`)
        },
      )
    load()
    window.addEventListener('focus', load)
    return () => {
      live = false
      window.removeEventListener('focus', load)
    }
  }, [token, file, parse, version])

  // `withToken` lets a caller commit with a key it was just handed, before
  // the new key has reached this hook.
  const commit = useCallback(async (change: (data: T) => T, message: string, withToken = token) => {
    if (!withToken) throw new Error('Connect to GitHub first.')
    const next = await commitData(withToken, file, parse, change, message)
    setData(next)
    return next
  }, [token, file, parse])

  return { data, status, error, reload, commit }
}
