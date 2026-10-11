import { REPO, type DataFile } from '../config'

// The site's data (saved links, preferences) is JSON files in the repo. With
// an access key the site reads the latest version straight from GitHub and
// commits changes to it; without one it reads the copy published with the site.

const TOKEN_KEY = 'surplus:github-token'
const REPO_API = `https://api.github.com/repos/${REPO.owner}/${REPO.name}`
const contentsUrl = (file: DataFile) => `${REPO_API}/contents/${REPO.dataDir}/${file}`

export function readToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? ''
  } catch {
    return ''
  }
}

export function writeToken(token: string) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Storage blocked: the key lasts until the page closes.
  }
}

// GitHub sends file contents as base64 of UTF-8 bytes.
export function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

export function decodeBase64(b64: string): string {
  const binary = atob(b64.replace(/\s/g, ''))
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)))
}

export class GitHubError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function explain(status: number): string {
  if (status === 401) return 'GitHub didn’t accept the access key. It may have expired. Connect again with a new one.'
  if (status === 403) return `The access key can’t write to ${REPO.name}. It needs “Contents: Read and write” on that repo.`
  if (status === 404) return `Couldn’t find ${REPO.owner}/${REPO.name}. Check the repo exists and the key has access to it.`
  return `GitHub returned an error (${status}). Try again in a moment.`
}

const headers = (token: string) => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'X-GitHub-Api-Version': '2022-11-28',
})

// Turns whatever is in a file (or undefined, for a missing file) into a
// well-formed value, so a hand-edited or missing file never breaks the page.
export type Parse<T> = (raw: unknown) => T

const parseText = <T>(text: string, parse: Parse<T>): T => {
  try {
    return parse(JSON.parse(text))
  } catch {
    return parse(undefined)
  }
}

// Checks a new key before keeping it: null means it can write to the repo.
export async function verifyToken(token: string): Promise<string | null> {
  try {
    const res = await fetch(REPO_API, { headers: headers(token), cache: 'no-store' })
    if (!res.ok) return explain(res.status)
    const body = (await res.json()) as { permissions?: { push?: boolean } }
    return body.permissions?.push === false ? explain(403) : null
  } catch {
    return 'Couldn’t reach GitHub. Check your connection and try again.'
  }
}

async function readFromGitHub<T>(token: string, file: DataFile, parse: Parse<T>): Promise<{ data: T; sha: string | null }> {
  const res = await fetch(`${contentsUrl(file)}?ref=${REPO.branch}`, { headers: headers(token), cache: 'no-store' })
  if (res.status === 404) {
    // Either the file doesn't exist yet (fine) or the repo isn't reachable.
    const repo = await fetch(REPO_API, { headers: headers(token), cache: 'no-store' })
    if (!repo.ok) throw new GitHubError(repo.status, explain(repo.status))
    return { data: parse(undefined), sha: null }
  }
  if (!res.ok) throw new GitHubError(res.status, explain(res.status))
  const body = (await res.json()) as { content: string; sha: string }
  return { data: parseText(decodeBase64(body.content), parse), sha: body.sha }
}

async function readPublished<T>(file: DataFile, parse: Parse<T>): Promise<T> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${file}`, { cache: 'no-store' })
  return res.ok ? parseText(await res.text(), parse) : parse(undefined)
}

export async function loadData<T>(token: string, file: DataFile, parse: Parse<T>): Promise<T> {
  return token ? (await readFromGitHub(token, file, parse)).data : readPublished(file, parse)
}

// Read the latest file, apply the change, and commit it. If someone else
// committed in between (GitHub answers 409), start over from their version.
export async function commitData<T>(token: string, file: DataFile, parse: Parse<T>, change: (data: T) => T, message: string): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, sha } = await readFromGitHub(token, file, parse)
    const next = change(data)
    const res = await fetch(contentsUrl(file), {
      method: 'PUT',
      headers: { ...headers(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        content: encodeBase64(JSON.stringify(next, null, 2) + '\n'),
        branch: REPO.branch,
        ...(sha ? { sha } : {}),
      }),
    })
    if (res.status === 409 || res.status === 422) continue
    if (!res.ok) throw new GitHubError(res.status, explain(res.status))
    return next
  }
  throw new GitHubError(409, `${file} kept changing while saving. Try again.`)
}
