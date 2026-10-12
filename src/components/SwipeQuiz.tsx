import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { asPreference, quizDeck, type Food } from '../data/foods'
import type { PreferencesApi } from '../lib/usePreferences'
import { Sticker } from '../stickers/Sticker'
import { ConnectForm } from './ConnectForm'
import { Modal } from './Modal'

type Choice = 'love' | 'avoid' | null // null: fine either way
type Answer = { food: Food; choice: Choice }
type Fling = { food: Food; dir: 'left' | 'right' | 'up'; dx: number; dy: number; n: number }

const CARD_COLORS = ['var(--butter)', 'var(--pink)', 'var(--mint)', 'var(--sky)']
const THRESHOLD = 110 // px of drag that counts as a swipe

const clamp = (n: number) => Math.max(0, Math.min(1, n))
const dirOf = (choice: Choice) => (choice === 'love' ? 'right' : choice === 'avoid' ? 'left' : 'up')

// Swipe right on foods you love and left on ones you never want, and they go
// into your tastes in one commit at the end. Up (or "Fine") skips a food.
export function SwipeQuiz({ prefs, token, setToken, onClose }: {
  prefs: PreferencesApi
  token: string
  setToken: (token: string) => void
  onClose: () => void
}) {
  const [deck] = useState(() => quizDeck(prefs.prefs))
  const [answers, setAnswers] = useState<Answer[]>([])
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null)
  const [fling, setFling] = useState<Fling | null>(null)
  const [stopped, setStopped] = useState(false) // finished early
  const [left, setLeft] = useState<Set<string>>(new Set()) // answers left out on the review screen
  const [step, setStep] = useState<'review' | 'connect' | 'saving' | 'saved'>('review')
  const [error, setError] = useState('')
  const start = useRef<{ x: number; y: number } | null>(null)

  const done = stopped || answers.length >= deck.length
  const current = done ? undefined : deck[answers.length]

  function answer(choice: Choice, from = { dx: 0, dy: 0 }) {
    if (!current) return
    setFling({ food: current, dir: dirOf(choice), ...from, n: answers.length })
    setAnswers((a) => [...a, { food: current, choice }])
    setDrag(null)
  }

  function undo() {
    setFling(null)
    setStopped(false)
    setAnswers((a) => a.slice(0, -1))
  }

  // Arrow keys swipe; Backspace undoes.
  useEffect(() => {
    if (done) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const choice = ({ ArrowRight: 'love', ArrowLeft: 'avoid', ArrowUp: null, ArrowDown: null } as Record<string, Choice | undefined>)[e.key]
      if (choice !== undefined) {
        e.preventDefault()
        answer(choice)
      } else if (e.key === 'Backspace' && answers.length) {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = { x: e.clientX, y: e.clientY }
    setDrag({ dx: 0, dy: 0 })
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (start.current) setDrag({ dx: e.clientX - start.current.x, dy: e.clientY - start.current.y })
  }
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!start.current) return
    const from = { dx: e.clientX - start.current.x, dy: e.clientY - start.current.y }
    start.current = null
    if (from.dx > THRESHOLD) answer('love', from)
    else if (from.dx < -THRESHOLD) answer('avoid', from)
    else if (from.dy < -THRESHOLD && Math.abs(from.dx) < THRESHOLD) answer(null, from)
    else setDrag(null)
  }
  const onPointerCancel = () => {
    start.current = null
    setDrag(null)
  }

  const picked = answers.filter((a) => a.choice !== null)
  const keep = picked.filter((a) => !left.has(a.food.id))

  async function save(withToken = token) {
    if (!keep.length) return onClose()
    if (!withToken) return setStep('connect')
    setStep('saving')
    setError('')
    const loves = keep.filter((a) => a.choice === 'love').length
    const nevers = keep.length - loves
    const counts = [loves && `${loves} ${loves === 1 ? 'love' : 'loves'}`, nevers && `${nevers} ${nevers === 1 ? 'never' : 'nevers'}`].filter(Boolean).join(', ')
    try {
      await prefs.addMany(keep.map((a) => asPreference(a.food, a.choice!)), `Swipe quiz: ${counts}`, withToken)
      setStep('saved')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t save that. Try again.')
      setStep('review')
    }
  }

  if (step === 'connect') {
    return (
      // Its own dialog (see the key), so closing it goes back to the review.
      <Modal key="connect" label="Connect to GitHub" onClose={() => setStep('review')} className="link-modal">
        <ConnectForm onConnected={(t) => { setToken(t); void save(t) }} />
      </Modal>
    )
  }

  if (!deck.length) {
    return (
      <Modal key="quiz" label="Swipe quiz" onClose={onClose} className="quiz-modal">
        <div className="quiz-end">
          <Sticker name="egg" tilt={-8} className="pop" />
          <h2>You’ve done them all</h2>
          <p>Every food in the quiz is already in your tastes. Add more by hand in Your tastes.</p>
          <button type="button" className="btn btn-tomato" onClick={onClose}>Close</button>
        </div>
      </Modal>
    )
  }

  if (done) {
    const group = (choice: 'love' | 'avoid', title: string) => {
      const list = picked.filter((a) => a.choice === choice)
      if (!list.length) return null
      return (
        <div className={`quiz-group quiz-${choice}`}>
          <h3>{title}</h3>
          <div className="quiz-chips" role="group" aria-label={title}>
            {list.map(({ food }) => (
              <button key={food.id} type="button" className="quiz-chip" aria-pressed={!left.has(food.id)} disabled={step !== 'review'}
                onClick={() => setLeft((s) => { const n = new Set(s); if (n.has(food.id)) n.delete(food.id); else n.add(food.id); return n })}>
                <Sticker name={food.sticker} palette={food.palette} />
                <span>{food.label}</span>
              </button>
            ))}
          </div>
        </div>
      )
    }

    return (
      <Modal key="quiz" label="Swipe quiz" onClose={onClose} className="quiz-modal">
        {step === 'saved' ? (
          <div className="quiz-end">
            <Sticker name="shake" tilt={8} className="pop" />
            <h2>Saved</h2>
            <p>Added {keep.length} to your tastes. Ideas with anything on the Never list are now hidden.</p>
            <button type="button" className="btn btn-tomato" onClick={onClose}>Done</button>
          </div>
        ) : (
          <div className="quiz-review">
            <p className="kicker">Swipe quiz · {answers.length} of {deck.length}</p>
            <h2>{picked.length ? 'Here’s what you picked' : 'Nothing picked'}</h2>
            {picked.length ? (
              <>
                <p className="quiz-sub">Tap one to leave it out, then save them to your tastes.</p>
                {group('love', 'Love')}
                {group('avoid', 'Never')}
              </>
            ) : (
              <p className="quiz-sub">You said everything was fine. Nothing to save.</p>
            )}
            {error && <p className="error" role="alert">{error}</p>}
            <div className="quiz-actions">
              {answers.length > 0 && <button type="button" className="btn btn-quiet" disabled={step === 'saving'} onClick={undo}>Back</button>}
              {stopped && answers.length < deck.length && (
                <button type="button" className="btn btn-quiet" disabled={step === 'saving'} onClick={() => setStopped(false)}>Keep swiping</button>
              )}
              <button type="button" className="btn btn-tomato" disabled={step === 'saving'} onClick={() => void save()}>
                {step === 'saving' ? 'Saving…' : keep.length ? `Save ${keep.length} to your tastes` : 'Close'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    )
  }

  const d = drag ?? { dx: 0, dy: 0 }
  const upward = Math.abs(d.dx) < THRESHOLD / 2 ? clamp(-d.dy / THRESHOLD) : 0
  const stack = deck.slice(answers.length, answers.length + 3)

  return (
    <Modal key="quiz" label="Swipe quiz" onClose={onClose} className="quiz-modal">
      <div className="quiz">
        <p className="kicker">Swipe quiz · {answers.length + 1} of {deck.length}</p>
        <h2>Love it or never?</h2>
        <p className="quiz-sub">Swipe right if you love it, left if you never want it, up if it’s fine either way. Arrow keys work too.</p>

        <div className="quiz-stack">
          {stack.map((food, i) => {
            const top = i === 0
            const n = answers.length + i
            const style = {
              background: CARD_COLORS[n % CARD_COLORS.length],
              zIndex: 3 - i,
              ...(top
                ? { transform: `translate(${d.dx}px, ${d.dy}px) rotate(${d.dx / 14}deg)` }
                : { transform: `translateY(${i * 24}px) scale(${1 - i * 0.05})` }),
            } as CSSProperties
            return (
              <div
                key={food.id}
                className={`quiz-card${top && drag ? ' is-dragging' : ''}`}
                style={style}
                aria-hidden={!top}
                {...(top ? { onPointerDown, onPointerMove, onPointerUp, onPointerCancel } : {})}
              >
                <Sticker name={food.sticker} palette={food.palette} tilt={n % 2 ? 5 : -5} />
                <span className="quiz-label">{food.label}</span>
                {top && (
                  <>
                    <span className="stamp stamp-love" style={{ opacity: clamp(d.dx / THRESHOLD) }}>Love</span>
                    <span className="stamp stamp-never" style={{ opacity: clamp(-d.dx / THRESHOLD) }}>Never</span>
                    <span className="stamp stamp-fine" style={{ opacity: upward }}>Fine</span>
                  </>
                )}
              </div>
            )
          })}
          {fling && (
            <div
              key={fling.n}
              className={`quiz-card quiz-fling fling-${fling.dir}`}
              style={{ background: CARD_COLORS[fling.n % CARD_COLORS.length], '--x': `${fling.dx}px`, '--y': `${fling.dy}px`, '--r': `${fling.dx / 14}deg` } as CSSProperties}
              aria-hidden="true"
              onAnimationEnd={() => setFling(null)}
            >
              <Sticker name={fling.food.sticker} palette={fling.food.palette} tilt={fling.n % 2 ? 5 : -5} />
              <span className="quiz-label">{fling.food.label}</span>
            </div>
          )}
        </div>

        <p className="visually-hidden" aria-live="polite">{current?.label}</p>
        <div className="quiz-btns">
          <button type="button" className="btn quiz-btn quiz-btn-never" onClick={() => answer('avoid')}>
            <span aria-hidden="true">✕</span> Never
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => answer(null)}>Fine</button>
          <button type="button" className="btn quiz-btn quiz-btn-love" onClick={() => answer('love')}>
            <span aria-hidden="true">♥</span> Love
          </button>
        </div>
        <div className="quiz-foot">
          <button type="button" className="link-btn" disabled={!answers.length} onClick={undo}>Undo</button>
          {answers.length > 0 && <button type="button" className="link-btn" onClick={() => setStopped(true)}>Finish now</button>}
        </div>
      </div>
    </Modal>
  )
}
