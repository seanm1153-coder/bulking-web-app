import { avoidMatcher, type Preference, type PrefKind } from '../lib/preferences'
import { PALETTE, type Palette, type StickerName } from '../stickers/shapes'
import { BOOSTERS, IDEAS } from './ideas'

// Foods for the swipe quiz, and for "what did you love about it?" after a
// thumbs up or down. Picking one adds a preference with its label; a Never
// also gets the `terms` (and `allow`) so the site can match it in recipes.

export interface Food {
  id: string
  label: string
  sticker: StickerName
  palette?: Palette
  terms: string[]
  allow?: string[]
}

const boosterPalette = (id: string) => BOOSTERS.find((b) => b.id === id)?.palette
const ideaPalette = (slug: string) => IDEAS.find((i) => i.slug === slug)?.palette

export const FOODS: Food[] = [
  { id: 'eggs', label: 'Eggs', sticker: 'egg', terms: ['egg'] },
  { id: 'mushrooms', label: 'Mushrooms', sticker: 'mushroom', terms: ['mushroom', 'portobello', 'shiitake'] },
  { id: 'peanut-butter', label: 'Peanut butter', sticker: 'pbJar', terms: ['peanut butter', 'peanut'] },
  { id: 'spicy', label: 'Spicy food', sticker: 'chili', terms: ['spicy', 'chili', 'chile', 'jalapeño', 'jalapeno', 'habanero', 'cayenne', 'chipotle', 'sriracha', 'hot sauce', 'gochujang'] },
  { id: 'cheese', label: 'Cheese', sticker: 'cheese', terms: ['cheese', 'cheddar', 'mozzarella', 'parmesan', 'feta', 'brie'] },
  { id: 'fish', label: 'Fish', sticker: 'fish', terms: ['fish', 'salmon', 'tuna', 'cod', 'tilapia', 'sardine', 'anchovy', 'anchovies'] },
  { id: 'bacon', label: 'Bacon', sticker: 'bacon', terms: ['bacon'] },
  { id: 'onions', label: 'Onions', sticker: 'onion', terms: ['onion', 'shallot', 'scallion', 'leek'] },
  { id: 'chocolate', label: 'Chocolate', sticker: 'chocolate', terms: ['chocolate', 'cocoa'] },
  { id: 'beef', label: 'Beef and burgers', sticker: 'burger', terms: ['beef', 'burger', 'steak', 'meatball'] },
  { id: 'avocado', label: 'Avocado', sticker: 'avocado', terms: ['avocado', 'guacamole'] },
  { id: 'milk', label: 'Milk', sticker: 'milk', terms: ['milk'] },
  { id: 'pickles', label: 'Pickles', sticker: 'pickle', terms: ['pickle'] },
  { id: 'chicken', label: 'Chicken', sticker: 'drumstick', terms: ['chicken'] },
  { id: 'pasta', label: 'Pasta', sticker: 'pasta', terms: ['pasta', 'spaghetti', 'fettuccine', 'macaroni', 'penne', 'lasagna', 'noodle'] },
  { id: 'olives', label: 'Olives', sticker: 'oil', terms: ['olive'], allow: ['olive oil'] },
  { id: 'ice-cream', label: 'Ice cream', sticker: 'iceCream', terms: ['ice cream'] },
  { id: 'tomatoes', label: 'Tomatoes', sticker: 'tomato', terms: ['tomato', 'marinara', 'pizza sauce', 'ketchup', 'salsa'] },
  { id: 'rice', label: 'Rice', sticker: 'rice', terms: ['rice'] },
  { id: 'yogurt', label: 'Yogurt', sticker: 'jar', palette: ideaPalette('yogurt-parfait'), terms: ['yogurt', 'yoghurt'] },
  { id: 'pizza', label: 'Pizza', sticker: 'pizza', terms: ['pizza'] },
  { id: 'butter', label: 'Butter', sticker: 'butter', terms: ['butter'], allow: ['peanut butter', 'nut butter', 'cocoa butter'] },
  { id: 'burritos', label: 'Burritos and tacos', sticker: 'burrito', terms: ['burrito', 'taco', 'quesadilla', 'nachos', 'enchilada'] },
  { id: 'honey', label: 'Honey', sticker: 'pbJar', palette: boosterPalette('honey'), terms: ['honey'] },
  { id: 'nuts', label: 'Nuts', sticker: 'nuts', terms: ['nut', 'almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut'] },
  { id: 'pancakes', label: 'Pancakes and waffles', sticker: 'pancakes', terms: ['pancake', 'waffle'] },
  { id: 'cream', label: 'Cream', sticker: 'milk', palette: boosterPalette('cream'), terms: ['cream', 'sour cream', 'heavy cream', 'whipped cream'], allow: ['ice cream'] },
  { id: 'oats', label: 'Oats', sticker: 'jar', terms: ['oat', 'oatmeal', 'granola'] },
  { id: 'protein-powder', label: 'Protein powder', sticker: 'shake', terms: ['whey', 'protein powder', 'casein'] },
  { id: 'bread', label: 'Bread', sticker: 'toast', palette: { pb: PALETTE.butterTop, honey: PALETTE.butterSide }, terms: ['bread', 'toast', 'sourdough', 'brioche', 'bun', 'bagel'] },
]

const known = (food: Food, prefs: Preference[]) => prefs.some((p) => p.label.toLowerCase() === food.label.toLowerCase())

// The quiz skips foods already in your tastes, and anything a Never already covers.
export function quizDeck(prefs: Preference[], foods = FOODS): Food[] {
  const avoid = avoidMatcher(prefs)
  return foods.filter((f) => !known(f, prefs) && !avoid?.(f.label))
}

// The foods a recipe uses that aren't in your tastes yet.
export function foodsIn(text: string, prefs: Preference[], foods = FOODS): Food[] {
  return foods.filter((f) => !known(f, prefs) && avoidMatcher([{ id: f.id, kind: 'avoid', label: f.label, terms: f.terms, allow: f.allow }])?.(text))
}

// What a quiz answer or a picked food adds to preferences.json.
export const asPreference = (food: Food, kind: PrefKind): Pick<Preference, 'kind' | 'label' | 'terms' | 'allow'> =>
  kind === 'avoid' ? { kind, label: food.label, terms: food.terms, ...(food.allow ? { allow: food.allow } : {}) } : { kind, label: food.label }
