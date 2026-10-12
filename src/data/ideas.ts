import type { Palette, StickerName } from '../stickers/shapes'

// Calories and protein are rough estimates from typical values for each
// ingredient, rounded. They're there to compare ideas, not to count.

export type IdeaCategory = 'breakfast' | 'meals' | 'shakes' | 'snacks'

export const IDEA_CATEGORIES: { id: IdeaCategory; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'meals', label: 'Meals' },
  { id: 'shakes', label: 'Shakes' },
  { id: 'snacks', label: 'Snacks' },
]

export type BoosterId = 'pb' | 'milk' | 'oil' | 'avocado' | 'cheese' | 'granola' | 'butter' | 'honey' | 'nuts' | 'cream'

// Where an idea sits between a dirty bulk (1) and a clean one (5). A judgment
// call, like the calories, scored with the rubric in CLAUDE.md: protein per
// calorie, whole vs. processed food, added sugar, fiber and plants, and where
// the fat comes from. Calories themselves don't count.
export type CleanScore = 1 | 2 | 3 | 4 | 5

export const CLEAN_LEVELS: Record<CleanScore, string> = { 1: 'Filthy', 2: 'Dirty', 3: 'Middle', 4: 'Mostly clean', 5: 'Clean' }

// One notch on a recipe's clean-or-dirty slider: what changes from the notch
// before, where that lands the recipe on the scale, and roughly what it does
// to one portion. `swap` pairs a line as it reads at that point (ingredient
// or step) with its replacement, or null to drop it.
export interface Tweak {
  to: CleanScore
  says: string
  kcal: number
  protein: number
  swap?: [string, string | null][]
  add?: string[] // extra ingredients
}

export interface Clean {
  score: CleanScore
  why: string // one line on what pushes it up or down
  cleaner?: Tweak[] // notches from the recipe as written toward clean, in order
  dirtier?: Tweak[] // and toward dirty
}

// "Feed me clean" picks from these; "Feed me dirty" from the rest.
export const isClean = (i: Idea) => i.clean.score >= 4

export interface Line {
  text: string
  changed?: boolean // swapped in or added by a notch
  gone?: boolean // dropped by a notch
}

export interface Tweaked {
  score: CleanScore
  kcal: number
  protein: number
  ingredients: Line[]
  steps: Line[]
  says: string[] // what each applied notch changed
  missing: string[] // swaps whose line wasn't there (a data bug; the tests catch it)
}

// The recipe at a notch on its slider: 0 is as written, positive is that
// many notches cleaner, negative dirtier.
export function tweakIdea(idea: Idea, notch: number): Tweaked {
  const applied = (notch > 0 ? idea.clean.cleaner ?? [] : idea.clean.dirtier ?? []).slice(0, Math.abs(notch))
  const ingredients: Line[] = idea.ingredients.map((text) => ({ text }))
  const steps: Line[] = idea.steps.map((text) => ({ text }))
  const missing: string[] = []
  for (const t of applied) {
    for (const [from, to] of t.swap ?? []) {
      const lines = [ingredients, steps].find((list) => list.some((l) => !l.gone && l.text === from))
      if (!lines) {
        missing.push(from)
        continue
      }
      const i = lines.findIndex((l) => !l.gone && l.text === from)
      lines[i] = to === null ? { text: from, gone: true } : { text: to, changed: true }
    }
    ingredients.push(...(t.add ?? []).map((text) => ({ text, changed: true })))
  }
  return {
    score: applied.at(-1)?.to ?? idea.clean.score,
    kcal: idea.kcal + applied.reduce((n, t) => n + t.kcal, 0),
    protein: idea.protein + applied.reduce((n, t) => n + t.protein, 0),
    ingredients,
    steps,
    says: applied.map((t) => t.says),
    missing,
  }
}

// How an idea keeps when you make it ahead: frozen, in the fridge for a few
// days, or as dry kits in the cupboard.
export type Keeps = 'freezer' | 'fridge' | 'kit'

export const KEEPS: Record<Keeps, { icon: string; label: string }> = {
  freezer: { icon: '❄️', label: 'Freezes' },
  fridge: { icon: '🥡', label: 'Fridge prep' },
  kit: { icon: '🫙', label: 'Prep kits' },
}

// Making an idea ahead. `kcal` and `protein` on the idea are always for one
// portion. `batch` is for an idea written for one: what to buy and do for
// `makes` portions. It's left out when the recipe itself is the batch.
// Storage times stay conservative: cooked food 3–4 days in the fridge, and
// up to 3 months in the freezer.
export interface Ahead {
  keeps: Keeps
  makes: number
  unit: string // a portion, plural: "burritos", "jars"
  batch?: { ingredients: string[]; steps: string[] }
  lasts: string
  eat: string // reheating or serving
  fresh?: string[] // added when you eat it, not before
}

export interface Idea {
  slug: string
  title: string
  category: IdeaCategory
  sticker: StickerName
  palette?: Palette
  kcal: number
  protein: number
  time: string
  blurb: string
  ingredients: string[]
  steps: string[]
  boost: BoosterId[]
  source?: { name: string; url: string } // the recipe this one was adapted from
  clean: Clean
  ahead?: Ahead
}

export interface Booster {
  id: BoosterId
  name: string
  amount: string
  kcal: number
  protein: number
  sticker: StickerName
  palette?: Palette
  tip: string
}

export const BOOSTERS: Booster[] = [
  { id: 'pb', name: 'Peanut butter', amount: '2 tbsp', kcal: 190, protein: 7, sticker: 'pbJar', tip: 'Stir into oats, spread on toast, blend into shakes.' },
  { id: 'milk', name: 'Whole milk', amount: '1 cup', kcal: 150, protein: 8, sticker: 'milk', tip: 'Drink a glass with meals. Use it instead of water in oats.' },
  { id: 'oil', name: 'Olive oil', amount: '1 tbsp', kcal: 120, protein: 0, sticker: 'oil', tip: 'Drizzle over rice, pasta, eggs and vegetables.' },
  { id: 'avocado', name: 'Avocado', amount: '1 whole', kcal: 240, protein: 3, sticker: 'avocado', tip: 'Slice into bowls, mash onto toast, add to burritos.' },
  { id: 'cheese', name: 'Cheddar', amount: '1 oz', kcal: 115, protein: 7, sticker: 'cheese', tip: 'Melt into eggs, pasta, burgers and wraps.' },
  { id: 'granola', name: 'Granola', amount: '½ cup', kcal: 280, protein: 7, sticker: 'jar', palette: { whip: '#D9A55B', oats: '#C98A4B' }, tip: 'Choose a plain or nut granola. Pour it over yogurt or ice cream, or eat it with milk.' },
  { id: 'butter', name: 'Butter', amount: '1 tbsp', kcal: 100, protein: 0, sticker: 'butter', tip: 'Melt over rice, potatoes and vegetables. Fry eggs in plenty of it.' },
  { id: 'honey', name: 'Honey', amount: '1 tbsp', kcal: 64, protein: 0, sticker: 'pbJar', palette: { pb: '#F2B02E', lid: '#FFD447', peanut: '#FF8A3D' }, tip: 'Drizzle on oats, yogurt, toast and into shakes.' },
  { id: 'nuts', name: 'Mixed nuts', amount: '¼ cup', kcal: 210, protein: 6, sticker: 'nuts', tip: 'Keep a bag nearby. Chop over oats, salads and yogurt.' },
  { id: 'cream', name: 'Heavy cream', amount: '2 tbsp', kcal: 100, protein: 1, sticker: 'milk', palette: { milkBlue: '#FF6FA0' }, tip: 'Stir into eggs, sauces, coffee and mashed potatoes.' },
]

// Everything a preference could match against.
const aheadText = (a: Ahead) => [...(a.batch?.ingredients ?? []), ...(a.batch?.steps ?? []), a.lasts, a.eat, ...(a.fresh ?? [])]
const tweakText = (t: Tweak) => [t.says, ...(t.swap ?? []).flatMap(([, to]) => (to ? [to] : [])), ...(t.add ?? [])]
export const ideaText = (i: Idea) =>
  [
    i.title, i.blurb, ...i.ingredients, ...i.steps, i.clean.why,
    ...[...(i.clean.cleaner ?? []), ...(i.clean.dirtier ?? [])].flatMap(tweakText),
    ...(i.ahead ? aheadText(i.ahead) : []),
  ].join('\n')
export const boosterText = (b: Booster) => [b.name, b.amount, b.tip].join('\n')

export const IDEAS: Idea[] = [
  {
    slug: 'protein-pancakes', title: 'Protein pancake stack', category: 'breakfast', sticker: 'pancakes',
    kcal: 1110, protein: 48, time: '20 min',
    blurb: 'A diner-sized stack with whey in the batter, so it counts as a real meal.',
    ingredients: ['¾ cup pancake mix', '1 scoop vanilla whey', '1 cup whole milk', '1 egg', '1 tbsp butter', '3 tbsp maple syrup', '2 tbsp chocolate chips'],
    steps: ['Whisk the mix, whey, milk and egg until just combined.', 'Cook four or five pancakes in butter over medium heat, scattering chocolate chips on each.', 'Stack them up and finish with more butter and syrup.'],
    boost: ['butter', 'pb', 'nuts'],
    clean: {
      score: 2,
      why: 'Whey helps, but it’s pancake mix, butter and syrup.',
      cleaner: [
        { to: 3, says: 'Oat pancake mix, yogurt and peanut butter instead of syrup', kcal: 50, protein: 15,
          swap: [
            ['¾ cup pancake mix', '¾ cup oat or whole-wheat pancake mix'],
            ['3 tbsp maple syrup', '½ cup whole-milk Greek yogurt and 1 tbsp peanut butter'],
            ['Stack them up and finish with more butter and syrup.', 'Stack them up and top with the Greek yogurt and a drizzle of warm peanut butter.'],
          ],
        },
        { to: 4, says: 'Less butter, no chocolate chips', kcal: -205, protein: -2,
          swap: [
            ['1 tbsp butter', '1 tsp butter for the pan'],
            ['2 tbsp chocolate chips', null],
            ['Cook four or five pancakes in butter over medium heat, scattering chocolate chips on each.', 'Cook four or five pancakes in a lightly buttered pan over medium heat.'],
          ],
        },
      ],
      dirtier: [
        { to: 1, says: 'Bacon and double syrup', kcal: 285, protein: 9,
          swap: [
            ['3 tbsp maple syrup', '6 tbsp maple syrup'],
            ['Stack them up and finish with more butter and syrup.', 'Stack them up with the bacon and finish with more butter and syrup.'],
          ],
          add: ['3 strips bacon, cooked crisp'],
        },
      ],
    },
    ahead: {
      keeps: 'freezer', makes: 4, unit: 'stacks',
      batch: {
        ingredients: ['3 cups pancake mix', '4 scoops vanilla whey', '4 cups whole milk', '4 eggs', 'Butter for the pan', '½ cup chocolate chips'],
        steps: ['Make four times the batter and cook all the pancakes.', 'Cool them on a rack, then freeze them flat on a tray for an hour.', 'Bag them in stacks of four or five, with baking paper between.'],
      },
      lasts: 'Up to 2 months in the freezer.',
      eat: 'Straight from frozen: two rounds in the toaster, or about a minute in the microwave.',
      fresh: ['Butter', 'Maple syrup'],
    },
  },
  {
    slug: 'overnight-oats', title: 'Loaded overnight oats', category: 'breakfast', sticker: 'jar',
    kcal: 960, protein: 50, time: '5 min, then overnight',
    blurb: 'Make it before bed and breakfast is waiting in the fridge.',
    ingredients: ['1 cup rolled oats', '1 cup whole milk', '1 scoop whey', '2 tbsp peanut butter', '1 tbsp honey', '2 tbsp chocolate chips'],
    steps: ['Stir the oats, milk and whey together in a jar.', 'Swirl in the peanut butter and honey.', 'Refrigerate overnight. Top with chocolate chips in the morning.'],
    boost: ['nuts', 'honey', 'pb'],
    clean: {
      score: 4,
      why: 'Oats, milk, whey and peanut butter. Only the honey and chocolate chips are treats.',
      cleaner: [
        { to: 5, says: 'Greek yogurt and cinnamon instead of honey and chips', kcal: -95, protein: 8,
          swap: [
            ['1 tbsp honey', null],
            ['2 tbsp chocolate chips', null],
            ['Swirl in the peanut butter and honey.', 'Swirl in the peanut butter and Greek yogurt, and dust with cinnamon.'],
            ['Refrigerate overnight. Top with chocolate chips in the morning.', 'Refrigerate overnight.'],
          ],
          add: ['½ cup whole-milk Greek yogurt', '1 tsp cinnamon'],
        },
      ],
      dirtier: [
        { to: 3, says: 'Double the honey and chocolate chips', kcal: 205, protein: 1,
          swap: [
            ['1 tbsp honey', '2 tbsp honey'],
            ['2 tbsp chocolate chips', '¼ cup chocolate chips'],
          ],
        },
      ],
    },
    ahead: {
      keeps: 'fridge', makes: 5, unit: 'jars',
      batch: {
        ingredients: ['5 cups rolled oats', '5 cups whole milk', '5 scoops whey', '⅔ cup peanut butter', '5 tbsp honey', '⅔ cup chocolate chips'],
        steps: ['Line up five jars. Split the oats, milk and whey between them and stir each one.', 'Swirl peanut butter and honey into each jar.', 'Lid them and keep them in the fridge. Bag the chocolate chips separately.'],
      },
      lasts: 'Up to 4 days in the fridge.',
      eat: 'Cold from the fridge, or 1 to 2 minutes in the microwave with a splash of milk.',
      fresh: ['Chocolate chips'],
    },
  },
  {
    slug: 'breakfast-burrito', title: 'Big breakfast burrito', category: 'breakfast', sticker: 'burrito',
    kcal: 1030, protein: 47, time: '15 min',
    blurb: 'Eggs, sausage, potatoes and cheese, rolled tight. Make a batch and freeze them.',
    ingredients: ['1 large flour tortilla', '3 eggs', '3 oz breakfast sausage', '½ cup hash browns', '¼ cup shredded cheddar', 'Salsa'],
    steps: ['Brown the sausage, then crisp the hash browns in the same pan.', 'Scramble the eggs softly and fold in the cheese.', 'Pile everything onto the tortilla, add salsa, and roll it up.'],
    boost: ['avocado', 'cheese', 'cream'],
    clean: {
      score: 2,
      why: 'Plenty of protein, but pork sausage, fried hash browns and a white tortilla.',
      cleaner: [
        { to: 3, says: 'Turkey sausage', kcal: -130, protein: 3,
          swap: [
            ['3 oz breakfast sausage', '3 oz turkey breakfast sausage'],
          ],
        },
        { to: 4, says: 'Roasted potatoes and a whole-wheat tortilla', kcal: -100, protein: 2,
          swap: [
            ['½ cup hash browns', '½ cup diced potatoes, roasted in 1 tsp olive oil'],
            ['1 large flour tortilla', '1 large whole-wheat tortilla'],
            ['Brown the sausage, then crisp the hash browns in the same pan.', 'Roast the potatoes at 425°F for 20 minutes while you brown the sausage.'],
          ],
        },
      ],
      dirtier: [
        { to: 1, says: 'Bacon and double the cheese', kcal: 240, protein: 16,
          swap: [
            ['¼ cup shredded cheddar', '½ cup shredded cheddar'],
            ['Brown the sausage, then crisp the hash browns in the same pan.', 'Cook the bacon, then brown the sausage and crisp the hash browns in the same pan.'],
            ['Pile everything onto the tortilla, add salsa, and roll it up.', 'Pile everything onto the tortilla with the bacon, add salsa, and roll it up.'],
          ],
          add: ['3 strips bacon'],
        },
      ],
    },
    ahead: {
      keeps: 'freezer', makes: 8, unit: 'burritos',
      batch: {
        ingredients: ['8 large flour tortillas', '24 eggs', '1½ lb breakfast sausage', '4 cups frozen hash browns', '2 cups shredded cheddar'],
        steps: ['Brown the sausage and crisp the hash browns, in batches.', 'Scramble the eggs until only just set, so they don’t dry out when reheated. Fold in the cheese.', 'Let the filling cool completely, then fill and roll the tortillas tightly.', 'Wrap each burrito in foil and freeze them together in a bag.'],
      },
      lasts: 'Up to 3 months in the freezer.',
      eat: 'Unwrap, wrap in a damp paper towel and microwave 2 to 3 minutes, turning once. Crisp it in a dry pan if you like.',
      fresh: ['Salsa, on the side so the tortilla stays dry'],
    },
  },
  {
    slug: 'pb-honey-toast', title: 'Peanut butter honey toast', category: 'breakfast', sticker: 'toast',
    kcal: 770, protein: 23, time: '5 min',
    blurb: 'Thick buttered toast, a lot of peanut butter, honey and flaky salt. Fast and hard to beat.',
    ingredients: ['2 thick slices sourdough', '1 tbsp butter', '3 tbsp peanut butter', '1 tbsp honey', 'Flaky salt'],
    steps: ['Toast the bread well and butter it.', 'Spread on the peanut butter while it’s hot so it melts a little.', 'Drizzle with honey and finish with flaky salt.'],
    boost: ['honey', 'nuts', 'milk'],
    clean: {
      score: 2,
      why: 'Peanut butter is real food, but it’s low in protein for the calories and the honey is sugar.',
      cleaner: [
        { to: 3, says: 'Whole-grain bread, no honey, and a whey shake on the side', kcal: 205, protein: 32,
          swap: [
            ['2 thick slices sourdough', '2 thick slices whole-grain bread'],
            ['1 tbsp honey', null],
            ['Drizzle with honey and finish with flaky salt.', 'Finish with flaky salt, and have the shake with it.'],
          ],
          add: ['A whey shake made with 1 cup whole milk'],
        },
        { to: 4, says: 'No butter', kcal: -100, protein: 0,
          swap: [
            ['1 tbsp butter', null],
            ['Toast the bread well and butter it.', 'Toast the bread well.'],
          ],
        },
      ],
      dirtier: [
        { to: 1, says: 'Brioche and double the honey', kcal: 125, protein: -2,
          swap: [
            ['2 thick slices sourdough', '2 thick slices brioche'],
            ['1 tbsp honey', '2 tbsp honey'],
          ],
        },
      ],
    },
  },
  {
    slug: 'bacon-egg-cheese', title: 'Bacon, egg and cheese', category: 'breakfast', sticker: 'sandwich',
    kcal: 650, protein: 35, time: '10 min',
    blurb: 'The deli classic on a toasted brioche bun.',
    ingredients: ['1 brioche bun', '2 eggs', '3 strips bacon', '1 slice cheddar', 'Butter for the pan'],
    steps: ['Cook the bacon until crisp.', 'Fry the eggs in butter and melt the cheese over them.', 'Toast the bun and stack it all up.'],
    boost: ['butter', 'avocado', 'milk'],
    clean: {
      score: 2,
      why: 'Eggs are great. Bacon, cheese and a brioche bun pull it down.',
      cleaner: [
        { to: 3, says: 'Whole-grain English muffin', kcal: -90, protein: 1,
          swap: [
            ['1 brioche bun', '1 whole-grain English muffin'],
            ['Toast the bun and stack it all up.', 'Toast the muffin and stack it all up.'],
          ],
        },
        { to: 4, says: 'Lean ham instead of bacon, and a third egg', kcal: 0, protein: 6,
          swap: [
            ['3 strips bacon', '2 slices lean ham'],
            ['2 eggs', '3 eggs'],
            ['Cook the bacon until crisp.', 'Warm the ham in the pan.'],
          ],
        },
      ],
      dirtier: [
        { to: 1, says: 'Double bacon and a sausage patty', kcal: 330, protein: 18,
          swap: [
            ['3 strips bacon', '6 strips bacon'],
            ['Cook the bacon until crisp.', 'Cook the bacon until crisp, then the sausage patty in the fat.'],
          ],
          add: ['1 breakfast sausage patty'],
        },
      ],
    },
    ahead: {
      keeps: 'freezer', makes: 6, unit: 'sandwiches',
      batch: {
        ingredients: ['6 brioche buns', '12 eggs', '18 strips bacon', '6 slices cheddar'],
        steps: ['Bake the bacon on a sheet pan at 400°F for 15 to 20 minutes, until crisp.', 'Whisk the eggs with a pinch of salt, pour into a greased 9×13 pan and bake at 350°F for about 15 minutes. Cut into six squares.', 'Build the sandwiches and let them cool. Wrap each in baking paper and freeze them in a bag.'],
      },
      lasts: 'Up to 2 months in the freezer.',
      eat: 'Unwrap, wrap in a paper towel and microwave about 2 minutes, flipping halfway.',
    },
  },
  {
    slug: 'avocado-egg-toast', title: 'Avocado toast with four eggs', category: 'breakfast', sticker: 'toast',
    palette: { bread: '#C98A4B', pb: '#CDE88E', honey: '#E8352B' },
    kcal: 1020, protein: 46, time: '10 min',
    blurb: 'Whole-grain toast, a whole avocado and four eggs, with a glass of milk on the side.',
    ingredients: ['2 thick slices whole-grain bread', '1 ripe avocado', '4 eggs', '1 tbsp olive oil', 'Chili flakes, flaky salt and black pepper', 'A squeeze of lemon juice', '1 cup whole milk'],
    steps: ['Toast the bread well.', 'Mash the avocado with the lemon juice, salt and pepper and spread it thickly on the toast.', 'Fry the eggs in the olive oil, two on each slice, and finish with chili flakes.', 'Drink the milk with it.'],
    boost: ['cheese', 'oil', 'milk'],
    clean: {
      score: 4,
      why: 'Eggs, avocado, whole grains and olive oil. A little light on protein for the calories.',
      cleaner: [
        { to: 5, says: 'Whey in the milk', kcal: 120, protein: 24,
          swap: [
            ['1 cup whole milk', '1 cup whole milk with a scoop of whey stirred in'],
            ['Drink the milk with it.', 'Drink the whey milk with it.'],
          ],
        },
      ],
      dirtier: [
        { to: 3, says: 'Bacon and cheddar on top', kcal: 245, protein: 16,
          swap: [
            ['Fry the eggs in the olive oil, two on each slice, and finish with chili flakes.', 'Fry the eggs in the olive oil, two on each slice, then top with the cheddar, crumbled bacon and chili flakes.'],
          ],
          add: ['3 strips bacon, cooked crisp', '1 oz shredded cheddar'],
        },
        { to: 2, says: 'Brioche, and butter instead of olive oil', kcal: 40, protein: -4,
          swap: [
            ['2 thick slices whole-grain bread', '2 thick slices brioche'],
            ['1 tbsp olive oil', '1 tbsp butter'],
            ['Fry the eggs in the olive oil, two on each slice, then top with the cheddar, crumbled bacon and chili flakes.', 'Fry the eggs in the butter, two on each slice, then top with the cheddar, crumbled bacon and chili flakes.'],
          ],
        },
      ],
    },
  },
  {
    slug: 'burrito-bowl', title: 'Chicken burrito bowl', category: 'meals', sticker: 'bowl',
    kcal: 1080, protein: 67, time: '25 min',
    blurb: 'Rice, chicken thighs, beans, cheese and avocado. Easy to scale up for meal prep.',
    ingredients: ['1½ cups cooked rice', '6 oz chicken thigh', '½ cup black beans', '¼ cup shredded cheese', '½ avocado', '2 tbsp sour cream', 'Corn salsa'],
    steps: ['Season the chicken with chili powder, cumin and salt. Sear until cooked through.', 'Warm the beans and fluff the rice.', 'Build the bowl and top with cheese, avocado, sour cream and salsa.'],
    boost: ['oil', 'cheese', 'avocado'],
    clean: {
      score: 4,
      why: 'Chicken, beans, rice and avocado. The cheese and sour cream are the only treats.',
      cleaner: [
        { to: 5, says: 'Greek yogurt instead of sour cream, and brown rice', kcal: -35, protein: 3,
          swap: [
            ['2 tbsp sour cream', '2 tbsp whole-milk Greek yogurt'],
            ['1½ cups cooked rice', '1½ cups cooked brown rice'],
            ['Build the bowl and top with cheese, avocado, sour cream and salsa.', 'Build the bowl and top with cheese, avocado, Greek yogurt and salsa.'],
          ],
        },
      ],
      dirtier: [
        { to: 3, says: 'Queso and more sour cream', kcal: 160, protein: 5,
          swap: [
            ['2 tbsp sour cream', '¼ cup sour cream'],
            ['Build the bowl and top with cheese, avocado, sour cream and salsa.', 'Build the bowl and top with cheese, queso, avocado, sour cream and salsa.'],
          ],
          add: ['¼ cup queso'],
        },
        { to: 2, says: 'Tortilla chips on top', kcal: 140, protein: 2,
          add: ['A big handful of tortilla chips'],
        },
      ],
    },
    ahead: {
      keeps: 'freezer', makes: 5, unit: 'bowls',
      batch: {
        ingredients: ['2½ cups dry rice (7½ cups cooked)', '2 lb chicken thighs', 'Chili powder, cumin and salt', 'Two 15-oz cans black beans', '1¼ cups shredded cheese'],
        steps: ['Cook the rice and spread it on a tray so it cools quickly.', 'Season and sear all the chicken, then slice it.', 'Split the rice, beans, chicken and cheese between five containers. Into the fridge or freezer once cool.'],
      },
      lasts: '4 days in the fridge, or up to 3 months in the freezer.',
      eat: 'Microwave 3 minutes from the fridge or 5 to 6 from frozen, with a splash of water over the rice.',
      fresh: ['Avocado', 'Sour cream', 'Corn salsa'],
    },
  },
  {
    slug: 'spaghetti-meatballs', title: 'Spaghetti and meatballs', category: 'meals', sticker: 'pasta',
    kcal: 1030, protein: 53, time: '30 min',
    blurb: 'A big plate that reheats well. Make a double batch for later in the week.',
    ingredients: ['4 oz dry spaghetti', '6 oz beef meatballs', '1 cup marinara', '2 tbsp parmesan', 'Fresh basil'],
    steps: ['Brown the meatballs, then simmer them in the marinara for 15 minutes.', 'Cook the spaghetti and toss it with some of the sauce.', 'Top with meatballs, parmesan and basil.'],
    boost: ['oil', 'cheese', 'cream'],
    clean: {
      score: 3,
      why: 'Good protein and a tomato sauce, over white pasta with fatty meatballs.',
      cleaner: [
        { to: 4, says: 'Whole-wheat spaghetti and lean meatballs', kcal: -150, protein: 6,
          swap: [
            ['4 oz dry spaghetti', '4 oz dry whole-wheat spaghetti'],
            ['6 oz beef meatballs', '6 oz meatballs made with 90/10 beef or turkey'],
          ],
        },
        { to: 5, says: 'Spinach in the sauce', kcal: 10, protein: 1,
          swap: [
            ['1 cup marinara', '1 cup marinara with a big handful of spinach stirred in'],
          ],
        },
      ],
      dirtier: [
        { to: 2, says: 'Garlic bread and more parmesan', kcal: 345, protein: 11,
          swap: [
            ['2 tbsp parmesan', '¼ cup parmesan'],
          ],
          add: ['2 slices garlic bread'],
        },
      ],
    },
    ahead: {
      keeps: 'freezer', makes: 6, unit: 'portions',
      batch: {
        ingredients: ['1½ lb dry spaghetti', '2¼ lb beef meatballs', '6 cups marinara (two 24-oz jars)'],
        steps: ['Brown the meatballs, then simmer them in all the marinara for 15 minutes.', 'Cook the spaghetti 2 minutes short of done, drain, and toss with a ladle of sauce so it doesn’t clump.', 'Split the pasta between six containers, top with meatballs and sauce, and cool before freezing.'],
      },
      lasts: '4 days in the fridge, or up to 3 months in the freezer.',
      eat: 'Microwave covered, 3 to 4 minutes from the fridge or 6 to 7 from frozen, stirring halfway.',
      fresh: ['Parmesan', 'Basil'],
    },
  },
  {
    slug: 'smash-burger', title: 'Double smash burger', category: 'meals', sticker: 'burger',
    kcal: 880, protein: 53, time: '20 min',
    blurb: 'Two thin crispy patties, melty cheese, raw onion and sauce.',
    ingredients: ['6 oz 80/20 ground beef, as two balls', '2 slices American cheese', '1 brioche bun', '1 tbsp burger sauce', 'Lettuce and thinly sliced onion'],
    steps: ['Get a pan or griddle very hot.', 'Smash each ball flat, season, and cook 2 minutes. Flip and add cheese.', 'Stack on a toasted bun with sauce, lettuce and onion.'],
    boost: ['cheese', 'milk', 'avocado'],
    clean: {
      score: 2,
      why: 'Lots of protein, but fatty beef, American cheese and a brioche bun.',
      cleaner: [
        { to: 3, says: '90/10 beef', kcal: -130, protein: 5,
          swap: [
            ['6 oz 80/20 ground beef, as two balls', '6 oz 90/10 ground beef, as two balls'],
          ],
        },
        { to: 4, says: 'Whole-wheat bun, cheddar, Greek yogurt sauce and tomato', kcal: -185, protein: 0,
          swap: [
            ['1 brioche bun', '1 whole-wheat bun'],
            ['2 slices American cheese', '1 slice cheddar'],
            ['1 tbsp burger sauce', '1 tbsp burger sauce made with Greek yogurt instead of mayo'],
            ['Lettuce and thinly sliced onion', 'Lettuce, tomato and thinly sliced onion'],
            ['Stack on a toasted bun with sauce, lettuce and onion.', 'Stack on a toasted bun with sauce, lettuce, tomato and onion.'],
          ],
        },
      ],
      dirtier: [
        { to: 1, says: 'Bacon and a third slice of cheese', kcal: 200, protein: 13,
          swap: [
            ['2 slices American cheese', '3 slices American cheese'],
            ['Get a pan or griddle very hot.', 'Cook the bacon until crisp, then get the pan or griddle very hot.'],
            ['Stack on a toasted bun with sauce, lettuce and onion.', 'Stack on a toasted bun with the bacon, sauce, lettuce and onion.'],
          ],
          add: ['3 strips bacon'],
        },
      ],
    },
  },
  {
    slug: 'animal-style-fries', title: 'Animal-style loaded fries', category: 'meals', sticker: 'fries',
    kcal: 1450, protein: 55, time: '35 min',
    blurb: 'Crispy fries buried under cheesy beef, sweet browned onions and a tangy burger sauce. A whole meal on one tray.',
    ingredients: ['1 large russet potato (about 300 g), cut into thin fries', '1 tbsp olive oil', '6 oz 80/20 ground beef', '2 slices American cheese', '¼ cup shredded cheddar', '1 onion, finely diced', '1 tbsp butter', '1 tsp brown sugar', '2 tsp balsamic vinegar', 'Smoked paprika, garlic powder and salt', 'Sauce: 2 tbsp mayo, 3 tbsp whole-milk Greek yogurt, 1 tbsp ketchup, 1 tsp yellow mustard, ½ tsp Worcestershire sauce, 1 tsp white vinegar, hot sauce to taste'],
    steps: ['Heat the oven to 425°F (or the air fryer to 400°F). Toss the fries with the oil, a pinch of smoked paprika and salt, and cook 25 to 30 minutes (18 to 20 in the air fryer), shaking halfway, until crisp.', 'Meanwhile, cook the onion in the butter over medium-low with the brown sugar and a pinch of salt for about 15 minutes, until soft and deep golden. Stir in the balsamic for the last minute.', 'Stir the sauce together.', 'Brown the beef in a hot pan, breaking it up, and season with garlic powder, smoked paprika and salt. Press it flat, lay the cheese slices on top, and cover for a minute to melt.', 'Pile the fries on a plate, scatter the cheddar over them, then add the cheesy beef, the onions and plenty of sauce.'],
    boost: ['cheese', 'butter', 'milk'],
    clean: {
      score: 1,
      why: 'Fries, fatty beef, two cheeses and a mayo sauce. A proper dirty bulk.',
      cleaner: [
        { to: 2, says: '90/10 beef and half the cheese', kcal: -255, protein: -3,
          swap: [
            ['6 oz 80/20 ground beef', '6 oz 90/10 ground beef'],
            ['2 slices American cheese', '1 slice American cheese'],
            ['¼ cup shredded cheddar', '2 tbsp shredded cheddar'],
            ['Brown the beef in a hot pan, breaking it up, and season with garlic powder, smoked paprika and salt. Press it flat, lay the cheese slices on top, and cover for a minute to melt.', 'Brown the beef in a hot pan, breaking it up, and season with garlic powder, smoked paprika and salt. Press it flat, lay the cheese on top, and cover for a minute to melt.'],
          ],
        },
        { to: 3, says: 'All-yogurt sauce, and no sugar on the onions', kcal: -170, protein: 3,
          swap: [
            ['Sauce: 2 tbsp mayo, 3 tbsp whole-milk Greek yogurt, 1 tbsp ketchup, 1 tsp yellow mustard, ½ tsp Worcestershire sauce, 1 tsp white vinegar, hot sauce to taste', 'Sauce: 5 tbsp whole-milk Greek yogurt, 1 tbsp ketchup, 1 tsp yellow mustard, ½ tsp Worcestershire sauce, 1 tsp white vinegar, hot sauce to taste'],
            ['1 tsp brown sugar', null],
            ['Meanwhile, cook the onion in the butter over medium-low with the brown sugar and a pinch of salt for about 15 minutes, until soft and deep golden. Stir in the balsamic for the last minute.', 'Meanwhile, cook the onion in the butter over medium-low with a pinch of salt for about 15 minutes, until soft and deep golden. Stir in the balsamic for the last minute.'],
          ],
        },
      ],
    },
    source: { name: 'Panacea Palm', url: 'https://www.youtube.com/shorts/1L2Ke_9VfnM' },
  },
  {
    slug: 'pepperoni-pizza', title: 'Pepperoni pizza night', category: 'meals', sticker: 'pizza',
    kcal: 930, protein: 39, time: '25 min',
    blurb: 'Three slices of a big pepperoni pie. Store-bought dough works fine.',
    ingredients: ['Pizza dough', '½ cup pizza sauce', '1½ cups mozzarella', '2 oz pepperoni', 'Olive oil'],
    steps: ['Heat the oven as hot as it goes.', 'Stretch the dough, add sauce, cheese and pepperoni.', 'Bake until bubbling and spotted. Eat three slices.'],
    boost: ['oil', 'milk'],
    clean: {
      score: 2,
      why: 'Processed pepperoni and a lot of cheese on white dough.',
      cleaner: [
        { to: 3, says: 'Chicken and onion instead of pepperoni', kcal: -75, protein: 24,
          swap: [
            ['2 oz pepperoni', '4 oz cooked chicken breast, sliced, and ½ red onion'],
            ['Stretch the dough, add sauce, cheese and pepperoni.', 'Stretch the dough, add sauce, cheese, chicken and onion.'],
          ],
        },
        { to: 4, says: 'Whole-wheat dough, part-skim mozzarella and a side salad', kcal: 70, protein: 6,
          swap: [
            ['Pizza dough', 'Whole-wheat pizza dough'],
            ['1½ cups mozzarella', '1½ cups part-skim mozzarella'],
            ['Bake until bubbling and spotted. Eat three slices.', 'Bake until bubbling and spotted. Eat three slices with the salad.'],
          ],
          add: ['A big side salad with olive oil and vinegar'],
        },
      ],
      dirtier: [
        { to: 1, says: 'Double pepperoni and a stuffed crust', kcal: 440, protein: 25,
          swap: [
            ['2 oz pepperoni', '4 oz pepperoni'],
            ['Stretch the dough, add sauce, cheese and pepperoni.', 'Stretch the dough, roll the cheese sticks into the edge, then add sauce, cheese and pepperoni.'],
          ],
          add: ['2 mozzarella sticks, for the crust'],
        },
      ],
    },
  },
  {
    slug: 'chicken-alfredo', title: 'Chicken alfredo', category: 'meals', sticker: 'pasta',
    palette: { sauce: '#FFF6DE', meatball: '#C7783A', pasta: '#FFE07A' },
    kcal: 1070, protein: 65, time: '25 min',
    blurb: 'Creamy, rich and easy to eat a lot of. Probably the best calorie-per-effort dinner there is.',
    ingredients: ['4 oz dry fettuccine', '5 oz chicken breast', '½ cup alfredo sauce', '2 tbsp parmesan', 'Black pepper and parsley'],
    steps: ['Season and sear the chicken, then slice it.', 'Cook the fettuccine and toss it with the warm sauce.', 'Top with chicken, parmesan, pepper and parsley.'],
    boost: ['cream', 'butter', 'cheese'],
    clean: {
      score: 2,
      why: 'Great protein, but the sauce is cream, butter and cheese over white pasta.',
      cleaner: [
        { to: 4, says: 'Blended cottage cheese alfredo', kcal: 40, protein: 24,
          swap: [
            ['½ cup alfredo sauce', 'Sauce: ¾ cup cottage cheese, 2 tbsp parmesan, ¼ cup whole milk and 1 clove garlic, blended smooth'],
            ['Cook the fettuccine and toss it with the warm sauce.', 'Blend the sauce until silky and warm it gently without boiling. Cook the fettuccine and toss it with the sauce.'],
          ],
        },
        { to: 5, says: 'Whole-wheat fettuccine and broccoli', kcal: 50, protein: 8,
          swap: [
            ['4 oz dry fettuccine', '4 oz dry whole-wheat fettuccine'],
            ['Blend the sauce until silky and warm it gently without boiling. Cook the fettuccine and toss it with the sauce.', 'Blend the sauce until silky and warm it gently without boiling. Cook the fettuccine, adding the broccoli for the last 3 minutes, and toss it all with the sauce.'],
          ],
          add: ['2 cups broccoli florets'],
        },
      ],
      dirtier: [
        { to: 1, says: 'Bacon and double the sauce', kcal: 350, protein: 13,
          swap: [
            ['½ cup alfredo sauce', '1 cup alfredo sauce'],
            ['Season and sear the chicken, then slice it.', 'Crisp the bacon, then season and sear the chicken in the fat and slice it.'],
          ],
          add: ['3 strips bacon, chopped'],
        },
      ],
    },
  },
  {
    slug: 'chicken-pad-thai', title: 'Chicken pad thai', category: 'meals', sticker: 'noodles',
    kcal: 1390, protein: 70, time: '25 min, plus soaking',
    blurb: 'A takeout-sized plate of sweet, salty, spicy noodles with chicken, egg, tofu and a lot of peanuts.',
    ingredients: ['120 g dry pad thai rice noodles', '6 oz chicken thigh, sliced thin', '¼ tsp baking soda', '2 eggs', '2 oz firm or smoked tofu, cubed', '1 shallot, sliced', '1 cup bean sprouts', 'A small bunch of chives, cut long', '3 tbsp chopped roasted peanuts', '2 tbsp neutral oil', 'Chili flakes, as much as you like', 'Sauce: 1½ tbsp brown sugar, 1 tbsp fish sauce, 1 tbsp soy sauce, 1 tbsp rice vinegar, 1 tbsp lime juice, 2 tbsp water'],
    steps: ['Soak the noodles in warm water for an hour, or boil them for 3 to 4 minutes until just bendy. Drain and rinse.', 'Toss the chicken with the baking soda and a pinch of salt and leave it 10 minutes. It stays juicy that way. Stir the sauce together.', 'Get a wok or big pan very hot with half the oil. Sear the chicken and tofu until golden, add the shallot for a minute, then push it all to one side.', 'Add the rest of the oil and scramble the eggs in the space.', 'Add the noodles and sauce and toss for 2 to 3 minutes until the sauce is soaked up. Fold in the bean sprouts and chives.', 'Pile it up and finish with the peanuts and chili flakes.'],
    boost: ['pb', 'nuts', 'oil'],
    clean: {
      score: 3,
      why: 'Chicken, tofu, eggs, peanuts and sprouts, with a sugary sauce and plenty of oil.',
      cleaner: [
        { to: 4, says: 'Less sugar and oil, more vegetables', kcal: -110, protein: 4,
          swap: [
            ['Sauce: 1½ tbsp brown sugar, 1 tbsp fish sauce, 1 tbsp soy sauce, 1 tbsp rice vinegar, 1 tbsp lime juice, 2 tbsp water', 'Sauce: 2 tsp brown sugar, 1 tbsp fish sauce, 1 tbsp soy sauce, 1 tbsp rice vinegar, 1 tbsp lime juice, 2 tbsp water'],
            ['1 cup bean sprouts', '2 cups bean sprouts and 1 cup shredded cabbage'],
            ['2 tbsp neutral oil', '1 tbsp neutral oil'],
            ['Add the noodles and sauce and toss for 2 to 3 minutes until the sauce is soaked up. Fold in the bean sprouts and chives.', 'Add the noodles and sauce and toss for 2 to 3 minutes until the sauce is soaked up. Fold in the bean sprouts, cabbage and chives.'],
          ],
        },
      ],
      dirtier: [
        { to: 2, says: 'More oil, sugar and peanuts', kcal: 290, protein: 5,
          swap: [
            ['Sauce: 1½ tbsp brown sugar, 1 tbsp fish sauce, 1 tbsp soy sauce, 1 tbsp rice vinegar, 1 tbsp lime juice, 2 tbsp water', 'Sauce: 2½ tbsp brown sugar, 1 tbsp fish sauce, 1 tbsp soy sauce, 1 tbsp rice vinegar, 1 tbsp lime juice, 2 tbsp water'],
            ['3 tbsp chopped roasted peanuts', '⅓ cup chopped roasted peanuts'],
            ['2 tbsp neutral oil', '3 tbsp neutral oil'],
          ],
        },
      ],
    },
    source: { name: 'Panacea Palm', url: 'https://www.youtube.com/shorts/UCoZdTQeeHA' },
  },
  {
    slug: 'beef-rice-bowl', title: 'Ground beef and rice bowl', category: 'meals', sticker: 'bowl',
    palette: { chicken: '#7A4128', avocado: '#5BC25A', bowl: '#FF5A36', corn: '#FFC21A' },
    kcal: 870, protein: 47, time: '15 min',
    blurb: 'Sweet soy beef over rice with a fried egg. Fast enough for a weeknight.',
    ingredients: ['1½ cups cooked rice', '5 oz 80/20 ground beef', '1 egg', '2 tbsp soy sauce', '1 tbsp honey', '1 tsp sesame oil', 'Green onion'],
    steps: ['Brown the beef, then stir in soy, honey and sesame oil until sticky.', 'Fry the egg.', 'Spoon the beef over rice and top with the egg and green onion.'],
    boost: ['oil', 'avocado', 'butter'],
    clean: {
      score: 3,
      why: 'Beef, egg and rice. The 80/20 beef and the honey-soy glaze are the dirty part.',
      cleaner: [
        { to: 4, says: '90/10 beef, brown rice and broccoli', kcal: -80, protein: 8,
          swap: [
            ['5 oz 80/20 ground beef', '5 oz 90/10 ground beef'],
            ['1½ cups cooked rice', '1½ cups cooked brown rice'],
            ['Spoon the beef over rice and top with the egg and green onion.', 'Spoon the beef over rice with the broccoli and top with the egg and green onion.'],
          ],
          add: ['1 cup steamed broccoli'],
        },
        { to: 5, says: 'A third of the honey', kcal: -45, protein: 0,
          swap: [
            ['1 tbsp honey', '1 tsp honey'],
          ],
        },
      ],
      dirtier: [
        { to: 2, says: 'More glaze and two eggs fried in butter', kcal: 235, protein: 6,
          swap: [
            ['1 tbsp honey', '2 tbsp honey'],
            ['1 egg', '2 eggs, fried crisp in butter'],
            ['Fry the egg.', 'Fry the eggs in plenty of butter until the edges are crisp.'],
          ],
        },
      ],
    },
    ahead: {
      keeps: 'freezer', makes: 5, unit: 'bowls',
      batch: {
        ingredients: ['2½ cups dry rice (7½ cups cooked)', '1½ lb 80/20 ground beef', '⅔ cup soy sauce', '⅓ cup honey', '5 tsp sesame oil'],
        steps: ['Cook the rice and spread it on a tray so it cools quickly.', 'Brown all the beef, then stir in the soy, honey and sesame oil until sticky.', 'Split between five containers and let them cool before the fridge or freezer.'],
      },
      lasts: '4 days in the fridge, or up to 3 months in the freezer.',
      eat: 'Microwave 3 minutes from the fridge or 5 to 6 from frozen, with a splash of water over the rice.',
      fresh: ['A fried egg', 'Green onion'],
    },
  },
  {
    slug: 'beef-bean-burritos', title: 'Spicy beef and bean freezer burritos', category: 'meals', sticker: 'burrito',
    palette: { chicken: '#7A4128', lettuce: '#E8352B', foil: '#FFD447' },
    kcal: 870, protein: 42, time: '45 min',
    blurb: 'One afternoon, eight dinners. Each goes from the freezer to your hand in three minutes.',
    ingredients: ['2 lb 80/20 ground beef', '1 large onion, diced', '2 chipotle peppers in adobo, chopped', '2 tbsp chili powder, 2 tsp cumin, 1 tsp smoked paprika and salt', 'Two 16-oz cans refried beans', '2 cups cooked rice', '2 cups shredded cheddar', '8 large (12-inch) flour tortillas'],
    steps: ['Brown the beef with the onion, then stir in the chipotles and spices.', 'Add the beans and a splash of water and simmer until thick, about 5 minutes. Stir in the rice.', 'Let the filling cool completely. Fill each tortilla with it and a handful of cheese, then roll tightly.', 'Wrap each burrito in foil and freeze them together in a bag.'],
    boost: ['avocado', 'cheese', 'milk'],
    clean: {
      score: 3,
      why: 'Beans and rice add fiber, but it’s fatty beef, cheese and a huge white tortilla.',
      cleaner: [
        { to: 4, says: '90/10 beef or turkey', kcal: -90, protein: 3,
          swap: [
            ['2 lb 80/20 ground beef', '2 lb 90/10 ground beef or ground turkey'],
          ],
        },
        { to: 5, says: 'Whole-wheat tortillas, fat-free beans and half the cheese', kcal: -110, protein: 0,
          swap: [
            ['8 large (12-inch) flour tortillas', '8 large whole-wheat tortillas'],
            ['Two 16-oz cans refried beans', 'Two 16-oz cans fat-free refried beans'],
            ['2 cups shredded cheddar', '1 cup shredded cheddar'],
          ],
        },
      ],
      dirtier: [
        { to: 2, says: 'Queso and sour cream inside', kcal: 105, protein: 3,
          swap: [
            ['Let the filling cool completely. Fill each tortilla with it and a handful of cheese, then roll tightly.', 'Let the filling cool completely. Fill each tortilla with it, a handful of cheese and a spoonful each of queso and sour cream, then roll tightly.'],
          ],
          add: ['1 cup queso', '1 cup sour cream'],
        },
      ],
    },
    ahead: {
      keeps: 'freezer', makes: 8, unit: 'burritos',
      lasts: 'Up to 3 months in the freezer.',
      eat: 'Unwrap, wrap in a damp paper towel and microwave about 3 minutes, turning once. Crisp it in a dry pan if you like.',
      fresh: ['Sour cream', 'Hot sauce', 'Avocado'],
    },
  },
  {
    slug: 'beef-chili', title: 'Big pot of beef chili', category: 'meals', sticker: 'bowl',
    palette: { rice: '#D8402B', chicken: '#7A4128', avocado: '#FFF6DE', corn: '#FFC72C', bowl: '#FFD447' },
    kcal: 950, protein: 49, time: '1 hr',
    blurb: 'Spicy, beefy and better on day three. Freeze it in bags laid flat and it thaws fast.',
    ingredients: ['2 lb 80/20 ground beef', '2 onions, diced', '4 cloves garlic, minced', '3 tbsp chili powder, 1 tbsp cumin and 1 tsp smoked paprika', '1 or 2 chipotle peppers in adobo, chopped', '2 tbsp tomato paste', 'One 28-oz can crushed tomatoes', 'Two 15-oz cans kidney beans, drained', '1 cup beef broth', 'To serve: 6 cups cooked rice, 1½ cups shredded cheddar and sour cream'],
    steps: ['Brown the beef in a big pot. Add the onions and garlic and cook until soft.', 'Stir in the spices, chipotle and tomato paste for a minute, then add the tomatoes, beans and broth.', 'Simmer uncovered for about 40 minutes, stirring now and then, until thick. Salt to taste.', 'Cool, then pack into six containers, or freezer bags laid flat.'],
    boost: ['cheese', 'avocado', 'butter'],
    clean: {
      score: 4,
      why: 'Beef, beans, tomatoes and onions. The cheese and sour cream are toppings, not the meal.',
      cleaner: [
        { to: 5, says: '90/10 beef, brown rice and Greek yogurt on top', kcal: -150, protein: 5,
          swap: [
            ['2 lb 80/20 ground beef', '2 lb 90/10 ground beef'],
            ['To serve: 6 cups cooked rice, 1½ cups shredded cheddar and sour cream', 'To serve: 6 cups cooked brown rice, 1½ cups shredded cheddar and Greek yogurt'],
          ],
        },
      ],
      dirtier: [
        { to: 3, says: 'Double cheese and plenty of sour cream', kcal: 175, protein: 8,
          swap: [
            ['To serve: 6 cups cooked rice, 1½ cups shredded cheddar and sour cream', 'To serve: 6 cups cooked rice, 3 cups shredded cheddar and plenty of sour cream'],
          ],
        },
        { to: 2, says: 'Buttered cornbread on the side', kcal: 250, protein: 4,
          add: ['A big square of cornbread with butter, for each bowl'],
        },
      ],
    },
    ahead: {
      keeps: 'freezer', makes: 6, unit: 'bowls',
      lasts: '4 days in the fridge, or up to 3 months in the freezer.',
      eat: 'Microwave covered, 3 minutes from the fridge or 6 to 8 from frozen, stirring halfway. Or thaw a bag overnight and warm it in a pan.',
      fresh: ['Rice', 'Cheddar', 'Sour cream'],
    },
  },
  {
    slug: 'baked-ziti', title: 'Baked ziti tray', category: 'meals', sticker: 'tray',
    kcal: 890, protein: 50, time: '1 hr',
    blurb: 'Pasta, beef and ricotta under a lid of melted mozzarella. Cut it into six and freeze the squares.',
    ingredients: ['1 lb dry ziti or penne', '1 lb 80/20 ground beef', '1 onion, diced', 'One 24-oz jar marinara', '15 oz whole-milk ricotta', '1 egg', '½ cup grated parmesan', '3 cups shredded mozzarella', 'Salt, pepper and dried oregano'],
    steps: ['Heat the oven to 375°F. Cook the pasta 2 minutes short of done and drain.', 'Brown the beef with the onion, season, and stir in the marinara.', 'Mix the ricotta, egg, parmesan and half the mozzarella. Toss the pasta with the meat sauce, then fold in the ricotta mix.', 'Spread it in a 9×13 dish, top with the rest of the mozzarella and bake about 25 minutes, until bubbling.', 'Cool, cut into six, and wrap or box each square.'],
    boost: ['cheese', 'oil', 'milk'],
    clean: {
      score: 2,
      why: 'Decent protein, but three cheeses over white pasta.',
      cleaner: [
        { to: 3, says: 'Blended cottage cheese for the ricotta, part-skim mozzarella', kcal: -75, protein: 2,
          swap: [
            ['15 oz whole-milk ricotta', '16 oz cottage cheese, blended smooth'],
            ['3 cups shredded mozzarella', '3 cups shredded part-skim mozzarella'],
            ['Mix the ricotta, egg, parmesan and half the mozzarella. Toss the pasta with the meat sauce, then fold in the ricotta mix.', 'Mix the blended cottage cheese, egg, parmesan and half the mozzarella. Toss the pasta with the meat sauce, then fold in the cheese mix.'],
          ],
        },
        { to: 4, says: 'Whole-wheat pasta, 90/10 beef and spinach', kcal: -60, protein: 4,
          swap: [
            ['1 lb dry ziti or penne', '1 lb dry whole-wheat ziti or penne'],
            ['1 lb 80/20 ground beef', '1 lb 90/10 ground beef'],
            ['Brown the beef with the onion, season, and stir in the marinara.', 'Brown the beef with the onion, season, wilt in the spinach and stir in the marinara.'],
          ],
          add: ['5 oz baby spinach'],
        },
      ],
      dirtier: [
        { to: 1, says: 'Italian sausage and an extra cup of mozzarella', kcal: 105, protein: 2,
          swap: [
            ['1 lb 80/20 ground beef', '1 lb Italian sausage'],
            ['3 cups shredded mozzarella', '4 cups shredded mozzarella'],
            ['Brown the beef with the onion, season, and stir in the marinara.', 'Brown the sausage with the onion, season, and stir in the marinara.'],
          ],
        },
      ],
    },
    ahead: {
      keeps: 'freezer', makes: 6, unit: 'squares',
      lasts: '4 days in the fridge, or up to 3 months in the freezer.',
      eat: 'Microwave covered, 2 to 3 minutes from the fridge or 5 to 6 from frozen. Or 20 minutes in a 350°F oven.',
    },
  },
  {
    slug: 'bacon-mac-cheese', title: 'Bacon mac and cheese', category: 'meals', sticker: 'tray',
    palette: { dish: '#FF5A36', sauce: '#D45A3C' },
    kcal: 1030, protein: 49, time: '45 min',
    blurb: 'Sharp cheddar sauce, a pound of bacon and a crunchy top. It freezes better than you’d think.',
    ingredients: ['1 lb dry elbow macaroni', '1 lb bacon, chopped', '4 tbsp butter', '¼ cup flour', '4 cups whole milk', '4 cups shredded sharp cheddar', '1 cup shredded mozzarella', '1 tsp mustard powder, salt and pepper', '1 cup panko tossed with 2 tbsp melted butter'],
    steps: ['Heat the oven to 375°F. Cook the macaroni 2 minutes short of done and drain.', 'Fry the bacon until crisp and scoop it out.', 'Melt the butter, whisk in the flour for a minute, then slowly whisk in the milk. Simmer until it coats a spoon. Off the heat, stir in the cheeses and mustard powder.', 'Fold in the macaroni and bacon, spread it in a 9×13 dish, top with the panko and bake 20 minutes.', 'Cool, then scoop into six containers.'],
    boost: ['cheese', 'butter', 'milk'],
    clean: {
      score: 1,
      why: 'Bacon, butter, a pound of cheddar and white pasta. Filthy, on purpose.',
      cleaner: [
        { to: 2, says: 'Half the bacon and cheddar, with blended cottage cheese', kcal: -150, protein: -6,
          swap: [
            ['1 lb bacon, chopped', '½ lb bacon, chopped'],
            ['4 cups shredded sharp cheddar', '2 cups shredded sharp cheddar'],
            ['Melt the butter, whisk in the flour for a minute, then slowly whisk in the milk. Simmer until it coats a spoon. Off the heat, stir in the cheeses and mustard powder.', 'Melt the butter, whisk in the flour for a minute, then slowly whisk in the milk. Simmer until it coats a spoon. Off the heat, stir in the blended cottage cheese, the cheeses and mustard powder.'],
          ],
          add: ['2 cups cottage cheese, blended smooth'],
        },
        { to: 3, says: 'An all-cottage-cheese sauce, no butter, and broccoli', kcal: -200, protein: -4,
          swap: [
            ['4 tbsp butter', null],
            ['¼ cup flour', null],
            ['4 cups whole milk', '1 cup whole milk'],
            ['1 cup panko tossed with 2 tbsp melted butter', '½ cup panko'],
            ['Heat the oven to 375°F. Cook the macaroni 2 minutes short of done and drain.', 'Heat the oven to 375°F. Cook the macaroni 2 minutes short of done, adding the broccoli for the last 2 minutes, and drain.'],
            ['Melt the butter, whisk in the flour for a minute, then slowly whisk in the milk. Simmer until it coats a spoon. Off the heat, stir in the blended cottage cheese, the cheeses and mustard powder.', 'Blend the cottage cheese with the milk until smooth, warm it gently, then stir in the cheeses and mustard powder until melted.'],
            ['Fold in the macaroni and bacon, spread it in a 9×13 dish, top with the panko and bake 20 minutes.', 'Fold in the macaroni, broccoli and bacon, spread it in a 9×13 dish, top with the panko and bake 20 minutes.'],
          ],
          add: ['3 cups broccoli florets'],
        },
      ],
    },
    ahead: {
      keeps: 'freezer', makes: 6, unit: 'portions',
      lasts: '4 days in the fridge, or up to 2 months in the freezer.',
      eat: 'Add a splash of milk and microwave covered, 2 to 3 minutes from the fridge or 5 to 6 from frozen, stirring halfway.',
    },
  },
  {
    slug: 'gochujang-chicken-bowl', title: 'Spicy gochujang chicken rice bowl', category: 'meals', sticker: 'bowl',
    palette: { rice: '#EBD3A0', chicken: '#D8402B', corn: '#CDE88E', bowl: '#5BC25A' },
    kcal: 1060, protein: 64, time: '25 min',
    blurb: 'Sticky, spicy chicken over brown rice with a whole avocado. Clean, and still over a thousand calories.',
    ingredients: ['8 oz chicken breast, in chunks', '1 tbsp gochujang', '1 tbsp soy sauce', '1 clove garlic, grated', '1 tbsp sesame or olive oil', '1½ cups cooked brown rice', '1 avocado, sliced', '½ cucumber, sliced', 'Green onion and 1 tbsp sesame seeds'],
    steps: ['Stir the gochujang, soy and garlic together and toss the chicken in half of it.', 'Sear the chicken in the oil over high heat until charred at the edges and cooked through, then toss it with the rest of the sauce.', 'Pile it over the rice with the avocado, cucumber, green onion and sesame seeds.'],
    boost: ['avocado', 'oil', 'milk'],
    clean: {
      score: 5,
      why: 'Lean chicken, brown rice, avocado and vegetables. The extra calories come from good fats.',
      dirtier: [
        { to: 4, says: 'Chicken thighs and white rice', kcal: 70, protein: -7,
          swap: [
            ['8 oz chicken breast, in chunks', '8 oz chicken thighs, in chunks'],
            ['1½ cups cooked brown rice', '1½ cups cooked white rice'],
          ],
        },
        { to: 3, says: 'Crispy fried with a honey glaze', kcal: 325, protein: 0,
          swap: [
            ['1 tbsp sesame or olive oil', '3 tbsp neutral oil, for shallow-frying'],
            ['Sear the chicken in the oil over high heat until charred at the edges and cooked through, then toss it with the rest of the sauce.', 'Toss the chicken in the cornstarch and shallow-fry it in the oil until crisp, then toss it with the rest of the sauce and the honey.'],
          ],
          add: ['¼ cup cornstarch', '1 tbsp honey'],
        },
      ],
    },
    ahead: {
      keeps: 'fridge', makes: 4, unit: 'bowls',
      batch: {
        ingredients: ['2 lb chicken breast', '¼ cup gochujang', '¼ cup soy sauce', '4 cloves garlic', '2 cups dry brown rice (6 cups cooked)', '2 cucumbers'],
        steps: ['Cook all the rice and spread it out so it cools quickly.', 'Make the sauce and cook the chicken in two batches so it browns.', 'Split the rice and chicken between four containers. Keep the cucumber in its own box.'],
      },
      lasts: 'Up to 4 days in the fridge.',
      eat: 'Microwave the rice and chicken 2 to 3 minutes, then add the cold toppings.',
      fresh: ['Avocado', 'Cucumber', 'Green onion and sesame seeds'],
    },
  },
  {
    slug: 'steak-potatoes', title: 'Steak, potatoes and green beans', category: 'meals', sticker: 'steak',
    kcal: 1060, protein: 61, time: '35 min',
    blurb: 'The classic clean bulk plate. Olive oil on the potatoes does the heavy lifting.',
    ingredients: ['8 oz sirloin steak', '1 lb baby potatoes, halved', '2 tbsp olive oil', 'A big handful of green beans', '2 cloves garlic, sliced', 'Salt, pepper and smoked paprika'],
    steps: ['Heat the oven to 425°F. Toss the potatoes with most of the oil, salt and paprika, and roast 25 to 30 minutes until crisp.', 'Pat the steak dry, season it well and sear in a very hot pan for 3 to 4 minutes a side. Rest it 5 minutes.', 'In the same pan, cook the green beans and garlic in the last of the oil for 3 minutes.', 'Slice the steak and serve it all together.'],
    boost: ['oil', 'butter', 'milk'],
    clean: {
      score: 5,
      why: 'Lean steak, potatoes and green beans, with olive oil for the extra calories.',
      dirtier: [
        { to: 4, says: 'Ribeye, basted in butter', kcal: 290, protein: -6,
          swap: [
            ['8 oz sirloin steak', '8 oz ribeye'],
            ['Pat the steak dry, season it well and sear in a very hot pan for 3 to 4 minutes a side. Rest it 5 minutes.', 'Pat the steak dry, season it well and sear in a very hot pan for 3 to 4 minutes a side, basting with the butter at the end. Rest it 5 minutes.'],
          ],
          add: ['1 tbsp butter, to baste'],
        },
        { to: 3, says: 'Loaded mashed potatoes', kcal: 235, protein: 8,
          swap: [
            ['1 lb baby potatoes, halved', '1 lb potatoes, peeled and chunked'],
            ['2 tbsp olive oil', '1 tsp olive oil'],
            ['Heat the oven to 425°F. Toss the potatoes with most of the oil, salt and paprika, and roast 25 to 30 minutes until crisp.', 'Boil the potatoes for 15 minutes until soft, then mash them with the butter, sour cream and cheddar.'],
          ],
          add: ['2 tbsp butter, ¼ cup sour cream and 1 oz shredded cheddar, for the mash'],
        },
      ],
    },
  },
  {
    slug: 'sheet-pan-chicken', title: 'Sheet-pan spicy chicken and sweet potatoes', category: 'meals', sticker: 'drumstick',
    kcal: 1030, protein: 76, time: '40 min',
    blurb: 'One tray, no babysitting. Spicy chicken thighs, sweet potato and broccoli, with a cool yogurt sauce.',
    ingredients: ['10 oz boneless, skinless chicken thighs', '1 large sweet potato, in chunks', '2 cups broccoli florets', '2 tbsp olive oil', '1 tsp each smoked paprika, garlic powder and chili powder, plus salt', 'Sauce: ½ cup whole-milk Greek yogurt, 1 tbsp sriracha and a pinch of salt'],
    steps: ['Heat the oven to 425°F. Toss the sweet potato with half the oil and spices and roast for 10 minutes.', 'Toss the chicken and broccoli with the rest of the oil and spices, add them to the tray and roast 20 to 25 minutes more, until the chicken is cooked through.', 'Stir the sauce together and spoon it over.'],
    boost: ['oil', 'avocado', 'nuts'],
    clean: {
      score: 5,
      why: 'Chicken, sweet potato and broccoli roasted in olive oil, with a yogurt sauce.',
      dirtier: [
        { to: 4, says: 'Honey glaze on the chicken', kcal: 130, protein: 0,
          swap: [
            ['Toss the chicken and broccoli with the rest of the oil and spices, add them to the tray and roast 20 to 25 minutes more, until the chicken is cooked through.', 'Toss the chicken and broccoli with the rest of the oil and spices, add them to the tray and roast 20 to 25 minutes more, brushing the chicken with honey for the last 5, until it’s cooked through.'],
          ],
          add: ['2 tbsp honey'],
        },
        { to: 3, says: 'Ranch instead of the yogurt sauce', kcal: 150, protein: -9,
          swap: [
            ['Sauce: ½ cup whole-milk Greek yogurt, 1 tbsp sriracha and a pinch of salt', 'Sauce: ¼ cup ranch dressing and 1 tbsp sriracha'],
          ],
        },
      ],
    },
    ahead: {
      keeps: 'fridge', makes: 4, unit: 'containers',
      batch: {
        ingredients: ['2½ lb boneless, skinless chicken thighs', '4 large sweet potatoes', '8 cups broccoli florets', '½ cup olive oil', 'Four times the spices'],
        steps: ['Use two trays so nothing steams, and swap them halfway through roasting.', 'Split everything between four containers once it’s cool.', 'Make the sauce in a jar.'],
      },
      lasts: 'Up to 4 days in the fridge.',
      eat: 'Microwave 2 to 3 minutes, then add the sauce cold.',
      fresh: ['The yogurt sauce'],
    },
  },
  {
    slug: 'vanilla-malt-shake', title: 'Thousand-calorie vanilla malt', category: 'shakes', sticker: 'shake',
    kcal: 980, protein: 52, time: '5 min',
    blurb: 'Tastes like a diner malt. Has a full meal’s worth of calories in it.',
    ingredients: ['2 cups whole milk', '1 cup vanilla ice cream', '1 scoop vanilla whey', '½ cup rolled oats', '2 tbsp malted milk powder', '1 tbsp honey'],
    steps: ['Blend the oats first so they turn to powder.', 'Add everything else and blend until smooth.', 'Pour into the biggest glass you own.'],
    boost: ['pb', 'cream', 'nuts'],
    clean: {
      score: 2,
      why: 'Whey and oats help, but it’s mostly ice cream, malt and honey.',
      cleaner: [
        { to: 3, says: 'Greek yogurt instead of ice cream', kcal: -50, protein: 15,
          swap: [
            ['1 cup vanilla ice cream', '1 cup whole-milk Greek yogurt and a handful of ice'],
          ],
        },
        { to: 4, says: 'No honey, half the malt', kcal: -105, protein: -1,
          swap: [
            ['1 tbsp honey', null],
            ['2 tbsp malted milk powder', '1 tbsp malted milk powder'],
          ],
        },
      ],
      dirtier: [
        { to: 1, says: 'Double ice cream and whipped cream', kcal: 320, protein: 5,
          swap: [
            ['1 cup vanilla ice cream', '2 cups vanilla ice cream'],
            ['Pour into the biggest glass you own.', 'Pour into the biggest glass you own and top with whipped cream.'],
          ],
          add: ['Whipped cream'],
        },
      ],
    },
    ahead: {
      keeps: 'kit', makes: 7, unit: 'kits',
      batch: {
        ingredients: ['3½ cups rolled oats', '7 scoops vanilla whey', '1 scant cup malted milk powder'],
        steps: ['Blend all the oats to a powder in one go.', 'Split the oat powder, whey and malt powder between seven bags or jars.'],
      },
      lasts: 'Several weeks in the cupboard.',
      eat: 'Tip a kit into the blender with the milk, ice cream and honey, and blend.',
      fresh: ['2 cups whole milk', '1 cup vanilla ice cream', '1 tbsp honey'],
    },
  },
  {
    slug: 'chocolate-pb-shake', title: 'Chocolate peanut butter shake', category: 'shakes', sticker: 'shake',
    palette: { shake: '#9A5A34', shakeLight: '#C08458', straw: '#FFB4C6', topper: '#FFF6DE' },
    kcal: 910, protein: 55, time: '5 min',
    blurb: 'Peanut butter, chocolate ice cream and chocolate whey. Drink it with breakfast or after training.',
    ingredients: ['2 cups whole milk', '1 scoop chocolate whey', '2 tbsp peanut butter', '½ cup chocolate ice cream', '½ cup rolled oats', '1 tbsp cocoa powder'],
    steps: ['Blend the oats into a powder.', 'Add the rest and blend until thick.', 'Add ice if you like it colder and thicker.'],
    boost: ['pb', 'nuts', 'milk'],
    clean: {
      score: 3,
      why: 'Whey, oats, peanut butter and milk, plus a scoop of ice cream.',
      cleaner: [
        { to: 4, says: 'Greek yogurt instead of ice cream', kcal: -35, protein: 7,
          swap: [
            ['½ cup chocolate ice cream', '½ cup whole-milk Greek yogurt and a handful of ice'],
          ],
        },
      ],
      dirtier: [
        { to: 2, says: 'Triple the ice cream', kcal: 290, protein: 5,
          swap: [
            ['½ cup chocolate ice cream', '1½ cups chocolate ice cream'],
          ],
        },
        { to: 1, says: 'Two peanut butter cups blended in', kcal: 210, protein: 5,
          add: ['2 peanut butter cups'],
        },
      ],
    },
    ahead: {
      keeps: 'kit', makes: 7, unit: 'kits',
      batch: {
        ingredients: ['3½ cups rolled oats', '7 scoops chocolate whey', '7 tbsp cocoa powder'],
        steps: ['Blend all the oats to a powder in one go.', 'Split the oat powder, whey and cocoa between seven bags or jars.'],
      },
      lasts: 'Several weeks in the cupboard.',
      eat: 'Tip a kit into the blender with the milk, peanut butter and ice cream, and blend.',
      fresh: ['2 cups whole milk', '2 tbsp peanut butter', '½ cup chocolate ice cream'],
    },
  },
  {
    slug: 'snack-plate', title: 'Cheese and salami snack plate', category: 'snacks', sticker: 'cheese',
    kcal: 850, protein: 37, time: '5 min',
    blurb: 'Something to pick at while watching TV. It adds up quickly.',
    ingredients: ['2 oz cheddar', '2 oz salami', '15 crackers', '¼ cup salted almonds'],
    steps: ['Slice the cheese and salami.', 'Pile it on a board with the crackers and almonds.', 'Keep it within reach.'],
    boost: ['nuts', 'avocado'],
    clean: {
      score: 2,
      why: 'Salami is processed and the crackers are white flour. The almonds are the clean part.',
      cleaner: [
        { to: 3, says: 'Turkey or roast beef instead of salami', kcal: -140, protein: 5,
          swap: [
            ['2 oz salami', '3 oz sliced turkey or roast beef'],
            ['Slice the cheese and salami.', 'Slice the cheese and roll up the meat.'],
          ],
        },
        { to: 4, says: 'Whole-grain crackers, double almonds and vegetables', kcal: 250, protein: 10,
          swap: [
            ['15 crackers', '15 whole-grain crackers'],
            ['¼ cup salted almonds', '½ cup salted almonds'],
            ['Pile it on a board with the crackers and almonds.', 'Pile it on a board with the crackers, almonds and vegetables.'],
          ],
          add: ['Baby carrots and snap peas'],
        },
      ],
      dirtier: [
        { to: 1, says: 'Chips instead of almonds, plus pepperoni', kcal: 240, protein: 2,
          swap: [
            ['¼ cup salted almonds', '2 oz potato chips'],
            ['Pile it on a board with the crackers and almonds.', 'Pile it on a board with the crackers, chips and pepperoni.'],
          ],
          add: ['1 oz pepperoni'],
        },
      ],
    },
    ahead: {
      keeps: 'fridge', makes: 5, unit: 'snack boxes',
      batch: {
        ingredients: ['10 oz cheddar', '10 oz salami', 'A box of crackers', '1¼ cups salted almonds'],
        steps: ['Cube the cheese and slice the salami.', 'Pack them into five containers with ¼ cup almonds in each.', 'Leave the crackers in their box so they stay crisp.'],
      },
      lasts: 'Up to 5 days in the fridge.',
      eat: 'Straight from the fridge, with a handful of crackers.',
      fresh: ['Crackers'],
    },
  },
  {
    slug: 'fluffernutter-milk', title: 'Fluffernutter and a glass of milk', category: 'snacks', sticker: 'milk',
    kcal: 540, protein: 23, time: '3 min',
    blurb: 'Peanut butter and marshmallow creme on soft bread. The easiest snack there is. Make two.',
    ingredients: ['2 slices soft white bread', '2 tbsp peanut butter', '2 tbsp marshmallow creme', '1 cup whole milk'],
    steps: ['Spread peanut butter on one slice and marshmallow creme on the other.', 'Close it up and cut it diagonally.', 'Drink the milk with it.'],
    boost: ['pb', 'honey', 'milk'],
    clean: {
      score: 1,
      why: 'Marshmallow creme on white bread. Fun, filthy and low in protein.',
      cleaner: [
        { to: 2, says: 'Whole-grain bread', kcal: 20, protein: 3,
          swap: [
            ['2 slices soft white bread', '2 slices whole-grain bread'],
          ],
        },
        { to: 3, says: 'No marshmallow: double peanut butter and whey in the milk', kcal: 270, protein: 31,
          swap: [
            ['2 tbsp marshmallow creme', null],
            ['2 tbsp peanut butter', '4 tbsp peanut butter'],
            ['1 cup whole milk', '1 cup whole milk with a scoop of whey stirred in'],
            ['Spread peanut butter on one slice and marshmallow creme on the other.', 'Spread the peanut butter on both slices.'],
            ['Drink the milk with it.', 'Drink the whey milk with it.'],
          ],
        },
      ],
    },
  },
  {
    slug: 'yogurt-parfait', title: 'Granola yogurt parfait', category: 'snacks', sticker: 'jar',
    palette: { oats: '#D9A55B', spoon: '#FFB4C6' },
    kcal: 730, protein: 31, time: '5 min',
    blurb: 'Whole-milk Greek yogurt layered with crunchy granola, nuts, chocolate chips and honey.',
    ingredients: ['1 cup whole-milk Greek yogurt', '½ cup plain or nut granola', '2 tbsp chopped nuts', '1 tbsp chocolate chips', '1 tbsp honey'],
    steps: ['Spoon half the yogurt into a jar or bowl.', 'Add half the granola, nuts and chocolate chips, then repeat.', 'Finish with honey.'],
    boost: ['honey', 'nuts', 'pb'],
    clean: {
      score: 3,
      why: 'Greek yogurt and nuts are great. The granola, honey and chocolate chips are sugar.',
      cleaner: [
        { to: 4, says: 'Low-sugar granola, no chocolate chips', kcal: -130, protein: 0,
          swap: [
            ['½ cup plain or nut granola', '½ cup low-sugar granola or toasted oats'],
            ['1 tbsp chocolate chips', null],
            ['Add half the granola, nuts and chocolate chips, then repeat.', 'Add half the granola and nuts, then repeat.'],
          ],
        },
        { to: 5, says: 'No honey', kcal: -65, protein: 0,
          swap: [
            ['1 tbsp honey', null],
            ['Finish with honey.', 'Finish with a pinch of cinnamon.'],
          ],
        },
      ],
      dirtier: [
        { to: 2, says: 'Triple the chips, double the honey', kcal: 205, protein: 1,
          swap: [
            ['1 tbsp chocolate chips', '3 tbsp chocolate chips'],
            ['1 tbsp honey', '2 tbsp honey'],
          ],
        },
      ],
    },
    ahead: {
      keeps: 'fridge', makes: 4, unit: 'jars',
      batch: {
        ingredients: ['4 cups whole-milk Greek yogurt', '¼ cup honey', '2 cups plain or nut granola', '½ cup chopped nuts', '¼ cup chocolate chips'],
        steps: ['Spoon the yogurt into four jars and drizzle in the honey.', 'Mix the granola, nuts and chocolate chips and split them into four small bags, so they stay crunchy.'],
      },
      lasts: 'Up to 4 days in the fridge.',
      eat: 'Tip a bag of crunch on top and eat.',
      fresh: ['The granola mix'],
    },
  },
  {
    slug: 'pb-protein-bars', title: 'Chocolate peanut butter protein bars', category: 'snacks', sticker: 'chocolate',
    palette: { chocWrap: '#C9813E' },
    kcal: 480, protein: 24, time: '15 min, plus 1 hr to set',
    blurb: 'No baking. A tray of these in the freezer means 500 calories are always within reach.',
    ingredients: ['2 cups rolled oats', '1 cup peanut butter', '⅓ cup honey', '4 scoops chocolate whey', '¼ cup whole milk', '1 cup chocolate chips', 'A pinch of salt'],
    steps: ['Warm the peanut butter and honey for 30 seconds so they stir easily.', 'Mix in the oats, whey, salt and half the chocolate chips. Add the milk a spoonful at a time until it holds together.', 'Press into a lined 8×8 pan. Melt the rest of the chips and spread them on top.', 'Chill for an hour, then cut into eight bars.'],
    boost: ['milk', 'nuts', 'pb'],
    clean: {
      score: 3,
      why: 'Oats, peanut butter and whey, held together with honey and chocolate.',
      cleaner: [
        { to: 4, says: 'Less honey, half the chocolate', kcal: -70, protein: -1,
          swap: [
            ['⅓ cup honey', '3 tbsp honey'],
            ['1 cup chocolate chips', '½ cup chocolate chips'],
          ],
        },
      ],
      dirtier: [
        { to: 2, says: 'More chocolate and peanut butter cups on top', kcal: 70, protein: 1,
          swap: [
            ['1 cup chocolate chips', '1½ cups chocolate chips'],
            ['Press into a lined 8×8 pan. Melt the rest of the chips and spread them on top.', 'Press into a lined 8×8 pan. Melt the rest of the chips, spread them on top and press in the peanut butter cups.'],
          ],
          add: ['8 mini peanut butter cups'],
        },
      ],
    },
    ahead: {
      keeps: 'freezer', makes: 8, unit: 'bars',
      lasts: 'A week in the fridge, or up to 3 months in the freezer.',
      eat: 'Straight from the fridge, or 10 minutes out of the freezer.',
    },
  },
]
