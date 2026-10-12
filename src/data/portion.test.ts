import { describe, expect, it } from 'vitest'
import { IDEAS, tweakIdea } from './ideas'
import { formatAmount, portionLabel, PORTIONS, scaleLine } from './portion'

describe('formatAmount', () => {
  it('rounds to kitchen fractions, and to whole numbers from 10 up', () => {
    expect([0.5, 1, 1.125, 1.5, 0.75, 0.375, 2.6667, 0.05, 22.5].map(formatAmount)).toEqual(['½', '1', '1⅛', '1½', '¾', '⅓', '2⅔', '⅛', '23'])
    expect(portionLabel(1.5)).toBe('1½×')
  })
})

describe('scaleLine', () => {
  it('scales amounts and keeps counted nouns agreeing', () => {
    expect(scaleLine('¾ cup pancake mix', 1.5)).toBe('1⅛ cups pancake mix')
    expect(scaleLine('1 egg', 2)).toBe('2 eggs')
    expect(scaleLine('2 eggs', 0.5)).toBe('1 egg')
    expect(scaleLine('2 slices American cheese', 0.5)).toBe('1 slice American cheese')
    expect(scaleLine('1 large russet potato (about 300 g), cut into thin fries', 1.5)).toBe('1½ large russet potatoes (about 450 g), cut into thin fries')
    expect(scaleLine('1 whole-grain English muffin', 2)).toBe('2 whole-grain English muffins')
    expect(scaleLine('Sauce: 1½ tbsp brown sugar, 1 tbsp fish sauce, 1 tbsp lime juice', 2)).toBe('Sauce: 3 tbsp brown sugar, 2 tbsp fish sauce, 2 tbsp lime juice')
    expect(scaleLine('4 oz cooked chicken breast, sliced, and ½ red onion', 2)).toBe('8 oz cooked chicken breast, sliced, and 1 red onion')
  })

  it('moves amounts to the unit a cook would use', () => {
    expect(scaleLine('6 tbsp maple syrup', 2)).toBe('¾ cup maple syrup')
    expect(scaleLine('¼ cup sour cream', 0.5)).toBe('2 tbsp sour cream')
    expect(scaleLine('1 tbsp ketchup', 0.5)).toBe('1½ tsp ketchup')
    expect(scaleLine('10 oz boneless, skinless chicken thighs', 2)).toBe('1¼ lb boneless, skinless chicken thighs')
    expect(scaleLine('1 lb potatoes, peeled and chunked', 0.5)).toBe('8 oz potatoes, peeled and chunked')
    expect(scaleLine('2 tbsp water', 2)).toBe('¼ cup water')
    expect(scaleLine('3 tsp honey', 1)).toBe('3 tsp honey')
  })

  it('leaves numbers that are part of a name alone', () => {
    expect(scaleLine('6 oz 80/20 ground beef, as two balls', 1.5)).toBe('9 oz 80/20 ground beef, as two balls')
    expect(scaleLine('8 large (12-inch) flour tortillas', 0.5)).toBe('4 large (12-inch) flour tortillas')
    expect(scaleLine('Two 15-oz cans kidney beans, drained', 0.5)).toBe('One 15-oz can kidney beans, drained')
    expect(scaleLine('One 28-oz can crushed tomatoes', 2)).toBe('Two 28-oz cans crushed tomatoes')
    expect(scaleLine('One 28-oz can crushed tomatoes', 1.5)).toBe('1½ 28-oz cans crushed tomatoes')
  })

  it('marks lines with no amount, except seasoning', () => {
    expect(scaleLine('Pizza dough', 2)).toBe('Pizza dough (2×)')
    expect(scaleLine('Salt, pepper and dried oregano', 2)).toBe('Salt, pepper and dried oregano')
    expect(scaleLine('Pizza dough', 1)).toBe('Pizza dough')
  })

  // Every line on the site, at every portion and every notch, reads right:
  // no "2 egg" or "1 eggs", and names like 80/20 survive.
  it('reads right on every ingredient line', () => {
    const counted = 'cup|scoop|slice|strip|clove|egg|can|tortilla|bun|potato|avocado|onion|shallot|patty|cucumber|stick'
    const plural = new RegExp(`(?:^|\\s)(?:1|[⅛¼⅓½⅔¾]) (?:${counted})(?:s|es)\\b`)
    const single = new RegExp(`(?:^|\\s)(?:[2-9]|\\d+[⅛¼⅓½⅔¾]|\\d{2,}) (?:${counted})\\b(?!s)`)
    for (const idea of IDEAS) {
      for (let n = -(idea.clean.dirtier?.length ?? 0); n <= (idea.clean.cleaner?.length ?? 0); n++) {
        for (const { text } of tweakIdea(idea, n).ingredients) {
          for (const f of PORTIONS) {
            const out = scaleLine(text, f)
            expect(out, `${idea.slug} ×${f}: ${text}`).not.toMatch(plural)
            expect(out, `${idea.slug} ×${f}: ${text}`).not.toMatch(single)
            for (const name of text.match(/\d+\/\d+|\d+-(?:oz|inch)/g) ?? []) expect(out).toContain(name)
          }
        }
      }
    }
  })
})
