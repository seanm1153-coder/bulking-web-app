import { avoidMatcher, REASONS, type Preference, type Rating } from '../lib/preferences'
import { foodsIn, FOODS, type Food } from './foods'
import { IDEAS, ideaText, type Idea } from './ideas'

// Patterns in your thumbs that could become tastes: a food that keeps turning
// up in ideas you turned down (and never in ones you liked) is a Never to
// suggest, and the other way round a Love. A reason you keep giving for a
// thumbs down is a note to suggest.

export type Hint =
  | { kind: 'avoid' | 'love'; key: string; food: Food; ideas: string[] }
  | { kind: 'note'; key: string; reason: string; note: string; ideas: string[] }

const ENOUGH = 2 // ratings that make a pattern

export function tasteHints(ratings: Rating[], prefs: Preference[], ideas: Idea[] = IDEAS, foods: Food[] = FOODS): Hint[] {
  const rated = (thumb: Rating['thumb']) =>
    ratings.filter((r) => r.thumb === thumb).flatMap((r) => {
      const idea = ideas.find((i) => i.slug === r.idea)
      return idea ? [{ title: r.title, text: ideaText(idea) }] : []
    })
  const down = rated('down')
  const up = rated('up')
  const avoid = avoidMatcher(prefs)

  const hints: Hint[] = []
  for (const food of foods) {
    if (avoid?.(food.label)) continue // a Never already covers it
    const has = (list: typeof down) => list.filter((r) => foodsIn(r.text, prefs, [food]).length > 0).map((r) => r.title)
    const downIn = has(down)
    const upIn = has(up)
    if (downIn.length >= ENOUGH && !upIn.length) hints.push({ kind: 'avoid', key: `avoid:${food.id}`, food, ideas: downIn })
    else if (upIn.length >= ENOUGH && !downIn.length) hints.push({ kind: 'love', key: `love:${food.id}`, food, ideas: upIn })
  }

  const noted = new Set(prefs.filter((p) => p.kind === 'note').map((p) => p.label.toLowerCase()))
  for (const { label, note } of REASONS) {
    const titles = ratings.filter((r) => r.thumb === 'down' && r.reasons?.includes(label)).map((r) => r.title)
    if (titles.length >= ENOUGH && !noted.has(note.toLowerCase())) hints.push({ kind: 'note', key: `note:${label}`, reason: label, note, ideas: titles })
  }

  return hints.sort((a, b) => b.ideas.length - a.ideas.length)
}

// "A", "A and B", "A, B and C".
export const listOf = (items: string[]) =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`

// What a suggestion says about where it came from, also saved as the new
// preference's `detail` so whoever writes recipes knows why it's there.
export function hintDetail(h: Hint): string {
  const n = h.ideas.length
  if (h.kind === 'note') return `You said “${h.reason.toLowerCase()}” about ${listOf(h.ideas)}.`
  return `In ${n} ideas you ${h.kind === 'avoid' ? 'turned down' : 'liked'}: ${listOf(h.ideas)}.`
}
