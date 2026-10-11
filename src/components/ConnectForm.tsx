import { useState, type FormEvent } from 'react'
import { REPO } from '../config'
import { verifyToken } from '../lib/github'

// Asks for a GitHub access key that can write to the repo, checks it, and
// hands it back. The key is kept in this browser only.
export function ConnectForm({ onConnected }: { onConnected: (token: string) => void }) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    const token = value.trim()
    if (!token) return
    setBusy(true)
    setError('')
    const problem = await verifyToken(token)
    setBusy(false)
    if (problem) setError(problem)
    else onConnected(token)
  }

  return (
    <form className="connect" onSubmit={submit}>
      <h2>Connect to GitHub</h2>
      <p>
        Saved links live in your repo, <b>{REPO.owner}/{REPO.name}</b>. To save from this browser, give it an access key once.
      </p>
      <ol className="steps">
        <li>Open <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">GitHub’s new token page</a>.</li>
        <li>Under <b>Repository access</b>, choose <b>Only select repositories</b> and pick <b>{REPO.name}</b>.</li>
        <li>Under <b>Permissions</b>, set <b>Contents</b> to <b>Read and write</b>.</li>
        <li>Generate the token, copy it, and paste it below.</li>
      </ol>
      <label className="field">
        <span>Access key</span>
        <input type="password" autoComplete="off" spellCheck={false} placeholder="github_pat_…" value={value} onChange={(e) => setValue(e.target.value)} />
      </label>
      <p className="fine">The key is stored in this browser only. It never goes into the site or the repo.</p>
      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" className="btn btn-tomato" disabled={busy || !value.trim()}>{busy ? 'Checking…' : 'Connect'}</button>
    </form>
  )
}
