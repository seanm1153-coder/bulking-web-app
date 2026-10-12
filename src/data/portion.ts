// Scaling a recipe's ingredient lines for a bigger or smaller portion. The
// lines are free text, so this finds the amounts in them ("1½ cups", "Two
// 15-oz cans", "½ avocado") and leaves alone numbers that are part of a name
// ("80/20 beef", "15-oz", "12-inch"). Lines with no amount get a "(×2)".

export const PORTIONS = [0.5, 1, 1.5, 2] as const

const FRACTIONS: [number, string][] = [[1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [1 / 2, '½'], [2 / 3, '⅔'], [3 / 4, '¾']]
const FRACTION_VALUE: Record<string, number> = Object.fromEntries(FRACTIONS.map(([v, c]) => [c, v]))
const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']

// 1.5 → "1½", 0.33 → "⅓", 22.5 → "23". Rounds to the nearest kitchen fraction.
export function formatAmount(value: number): string {
  if (value >= 10) return String(Math.round(value))
  const whole = Math.floor(value)
  const steps: [number, string][] = [[0, ''], ...FRACTIONS, [1, '']]
  const [step, char] = steps.reduce((best, next) => (Math.abs(value - whole - next[0]) < Math.abs(value - whole - best[0]) ? next : best))
  if (step === 1) return String(whole + 1)
  return whole ? `${whole}${char}` : char || '⅛'
}

// "1×", "1½×", "½×".
export const portionLabel = (factor: number) => `${formatAmount(factor)}×`

// Counted things, so "1 egg" becomes "2 eggs" and "2 slices" becomes "1 slice".
const NOUNS: [string, string][] = [
  ['cup', 'cups'], ['scoop', 'scoops'], ['slice', 'slices'], ['strip', 'strips'], ['clove', 'cloves'],
  ['egg', 'eggs'], ['can', 'cans'], ['tortilla', 'tortillas'], ['bun', 'buns'], ['muffin', 'muffins'],
  ['potato', 'potatoes'], ['avocado', 'avocados'], ['onion', 'onions'], ['shallot', 'shallots'],
  ['patty', 'patties'], ['cucumber', 'cucumbers'], ['stick', 'sticks'], ['pepper', 'peppers'], ['square', 'squares'],
]
// Measures that don't change form, or that the amount belongs to rather than
// a noun further on ("2 oz potato chips" mustn't become "potatoes").
const UNITS = new Set(['oz', 'lb', 'g', 'kg', 'ml', 'tbsp', 'tsp', 'cup', 'cups'])
const STOP = new Set(['of', 'and', 'or', 'with', 'in', 'for', 'to', 'plus', 'each'])
const SEASONING = /salt|pepper\b|to taste|pinch|flakes|for the pan|parsley|basil/i

// An amount: digits with an optional fraction ("1½"), or a fraction alone.
// Not when it's part of "80/20", "15-oz", "9×13" or a percentage. The first
// group stands in for a lookbehind, which older iPhones can't parse.
const AMOUNT = /(^|[^\w/.×-])(\d+(?:\.\d+)?[⅛¼⅓½⅔¾]?|[⅛¼⅓½⅔¾])(?![\d/%°×-]|\.\d)/g
const LEADING_WORD = new RegExp(`^(${WORDS.slice(1).join('|')})\\b`)

const parseAmount = (text: string) => {
  const last = text.at(-1)!
  return last in FRACTION_VALUE ? Number(text.slice(0, -1) || 0) + FRACTION_VALUE[last] : Number(text)
}

// Sets the first counted noun within a few words after an amount to singular
// or plural.
function agree(rest: string, amount: number): string {
  const words = rest.split(/(\s+)/)
  let seen = 0
  for (let i = 0; i < words.length && seen < 5; i++) {
    const word = words[i]
    if (!word.trim()) continue
    seen++
    const bare = word.replace(/[,.;:()]+$/, '').toLowerCase()
    if (STOP.has(bare) || word.startsWith('(')) break
    const noun = NOUNS.find(([one, many]) => bare === one || bare === many)
    if (noun) {
      words[i] = word.replace(/^[a-z]+/i, amount > 1 ? noun[1] : noun[0])
      break
    }
    if (UNITS.has(bare) || /[,(]$/.test(word)) break
  }
  return words.join('')
}

// Moves an amount to the unit a cook would use: 12 tbsp is ¾ cup, ⅛ cup is
// 2 tbsp, 20 oz is 1¼ lb, ½ tbsp is 1½ tsp.
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9
const whole = (n: number) => near(n, Math.round(n))
function convert(value: number, unit: string): [number, string] {
  if (unit === 'tsp' && value >= 3 && whole(value / 3)) return convert(value / 3, 'tbsp')
  if (unit === 'tbsp' && value < 1) return [value * 3, 'tsp']
  if (unit === 'tbsp' && value >= 4 && whole(value / 4)) return [value / 16, 'cup']
  if (unit === 'cup' && value < 0.25) return convert(value * 16, 'tbsp')
  if (unit === 'oz' && value >= 16 && whole(value / 4)) return [value / 16, 'lb']
  if (unit === 'lb' && value < 1) return [value * 16, 'oz']
  return [value, unit]
}
const UNIT_AFTER = /^(\s+)(tsp|tbsp|cups?|oz|lb)\b/

// One ingredient line at `factor` times the portion.
export function scaleLine(text: string, factor: number): string {
  if (factor === 1) return text
  let head = ''
  let rest = text
  const word = text.match(LEADING_WORD)
  if (word) {
    const value = WORDS.indexOf(word[1]) * factor
    head = Number.isInteger(value) && value <= 10 ? WORDS[value] : formatAmount(value)
    rest = agree(text.slice(word[1].length), value)
  }
  // Each amount, then the noun it counts. From the end, so earlier positions
  // stay put.
  const amounts = [...rest.matchAll(AMOUNT)]
  for (const m of amounts.reverse()) {
    const start = m.index! + m[1].length
    const end = start + m[2].length
    const value = parseAmount(m[2]) * factor
    const after = rest.slice(end)
    const unit = after.match(UNIT_AFTER)
    if (unit) {
      const [v, u] = convert(value, unit[2].replace(/s$/, ''))
      const word = u === 'cup' && v > 1 ? 'cups' : u
      rest = rest.slice(0, start) + formatAmount(v) + unit[1] + word + after.slice(unit[0].length)
    } else {
      rest = rest.slice(0, start) + formatAmount(value) + agree(after, value)
    }
  }
  if (!word && !amounts.length) return SEASONING.test(text) ? text : `${text} (${portionLabel(factor)})`
  return head + rest
}
