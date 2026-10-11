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

export type BoosterId = 'pb' | 'milk' | 'oil' | 'avocado' | 'cheese' | 'banana' | 'butter' | 'honey' | 'nuts' | 'cream'

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
  { id: 'banana', name: 'Banana', amount: '1 large', kcal: 120, protein: 1, sticker: 'banana', tip: 'Blend into shakes. Slice over oats and toast.' },
  { id: 'butter', name: 'Butter', amount: '1 tbsp', kcal: 100, protein: 0, sticker: 'butter', tip: 'Melt over rice, potatoes and vegetables. Fry eggs in plenty of it.' },
  { id: 'honey', name: 'Honey', amount: '1 tbsp', kcal: 64, protein: 0, sticker: 'pbJar', palette: { pb: '#F2B02E', lid: '#FFD447', peanut: '#FF8A3D' }, tip: 'Drizzle on oats, yogurt, toast and into shakes.' },
  { id: 'nuts', name: 'Mixed nuts', amount: '¼ cup', kcal: 210, protein: 6, sticker: 'nuts', tip: 'Keep a bag nearby. Chop over oats, salads and yogurt.' },
  { id: 'cream', name: 'Heavy cream', amount: '2 tbsp', kcal: 100, protein: 1, sticker: 'milk', palette: { milkBlue: '#FF6FA0' }, tip: 'Stir into eggs, sauces, coffee and mashed potatoes.' },
]

export const IDEAS: Idea[] = [
  {
    slug: 'protein-pancakes', title: 'Protein pancake stack', category: 'breakfast', sticker: 'pancakes',
    kcal: 1000, protein: 47, time: '20 min',
    blurb: 'A diner-sized stack with whey in the batter, so it counts as a real meal.',
    ingredients: ['¾ cup pancake mix', '1 scoop vanilla whey', '1 cup whole milk', '1 egg', '1 tbsp butter', '3 tbsp maple syrup', 'A handful of berries'],
    steps: ['Whisk the mix, whey, milk and egg until just combined.', 'Cook four or five pancakes in butter over medium heat.', 'Stack them up and finish with more butter, syrup and berries.'],
    boost: ['butter', 'pb', 'banana'],
  },
  {
    slug: 'overnight-oats', title: 'Loaded overnight oats', category: 'breakfast', sticker: 'jar',
    kcal: 930, protein: 50, time: '5 min, then overnight',
    blurb: 'Make it before bed and breakfast is waiting in the fridge.',
    ingredients: ['1 cup rolled oats', '1 cup whole milk', '1 scoop whey', '2 tbsp peanut butter', '1 banana, sliced', '1 tbsp honey'],
    steps: ['Stir the oats, milk and whey together in a jar.', 'Swirl in the peanut butter and honey.', 'Refrigerate overnight. Top with banana in the morning.'],
    boost: ['nuts', 'honey', 'pb'],
  },
  {
    slug: 'breakfast-burrito', title: 'Big breakfast burrito', category: 'breakfast', sticker: 'burrito',
    kcal: 1030, protein: 47, time: '15 min',
    blurb: 'Eggs, sausage, potatoes and cheese, rolled tight. Make a batch and freeze them.',
    ingredients: ['1 large flour tortilla', '3 eggs', '3 oz breakfast sausage', '½ cup hash browns', '¼ cup shredded cheddar', 'Salsa'],
    steps: ['Brown the sausage, then crisp the hash browns in the same pan.', 'Scramble the eggs softly and fold in the cheese.', 'Pile everything onto the tortilla, add salsa, and roll it up.'],
    boost: ['avocado', 'cheese', 'cream'],
  },
  {
    slug: 'pb-banana-toast', title: 'Peanut butter banana toast', category: 'breakfast', sticker: 'toast',
    kcal: 770, protein: 24, time: '5 min',
    blurb: 'Thick toast, a lot of peanut butter, banana and honey. Fast and hard to beat.',
    ingredients: ['2 thick slices sourdough', '3 tbsp peanut butter', '1 banana', '1 tbsp honey', 'A pinch of salt'],
    steps: ['Toast the bread well.', 'Spread on the peanut butter while it’s hot so it melts a little.', 'Top with sliced banana, honey and a pinch of salt.'],
    boost: ['honey', 'nuts', 'milk'],
  },
  {
    slug: 'bacon-egg-cheese', title: 'Bacon, egg and cheese', category: 'breakfast', sticker: 'sandwich',
    kcal: 650, protein: 35, time: '10 min',
    blurb: 'The deli classic on a toasted brioche bun.',
    ingredients: ['1 brioche bun', '2 eggs', '3 strips bacon', '1 slice cheddar', 'Butter for the pan'],
    steps: ['Cook the bacon until crisp.', 'Fry the eggs in butter and melt the cheese over them.', 'Toast the bun and stack it all up.'],
    boost: ['butter', 'avocado', 'milk'],
  },
  {
    slug: 'burrito-bowl', title: 'Chicken burrito bowl', category: 'meals', sticker: 'bowl',
    kcal: 1080, protein: 67, time: '25 min',
    blurb: 'Rice, chicken thighs, beans, cheese and avocado. Easy to scale up for meal prep.',
    ingredients: ['1½ cups cooked rice', '6 oz chicken thigh', '½ cup black beans', '¼ cup shredded cheese', '½ avocado', '2 tbsp sour cream', 'Corn salsa'],
    steps: ['Season the chicken with chili powder, cumin and salt. Sear until cooked through.', 'Warm the beans and fluff the rice.', 'Build the bowl and top with cheese, avocado, sour cream and salsa.'],
    boost: ['oil', 'cheese', 'avocado'],
  },
  {
    slug: 'spaghetti-meatballs', title: 'Spaghetti and meatballs', category: 'meals', sticker: 'pasta',
    kcal: 1030, protein: 53, time: '30 min',
    blurb: 'A big plate that reheats well. Make a double batch for later in the week.',
    ingredients: ['4 oz dry spaghetti', '6 oz beef meatballs', '1 cup marinara', '2 tbsp parmesan', 'Fresh basil'],
    steps: ['Brown the meatballs, then simmer them in the marinara for 15 minutes.', 'Cook the spaghetti and toss it with some of the sauce.', 'Top with meatballs, parmesan and basil.'],
    boost: ['oil', 'cheese', 'cream'],
  },
  {
    slug: 'smash-burger', title: 'Double smash burger', category: 'meals', sticker: 'burger',
    kcal: 880, protein: 53, time: '20 min',
    blurb: 'Two thin crispy patties, melty cheese, pickles and sauce.',
    ingredients: ['6 oz 80/20 ground beef, as two balls', '2 slices American cheese', '1 brioche bun', '1 tbsp burger sauce', 'Pickles and lettuce'],
    steps: ['Get a pan or griddle very hot.', 'Smash each ball flat, season, and cook 2 minutes. Flip and add cheese.', 'Stack on a toasted bun with sauce, pickles and lettuce.'],
    boost: ['cheese', 'milk', 'avocado'],
  },
  {
    slug: 'pepperoni-pizza', title: 'Pepperoni pizza night', category: 'meals', sticker: 'pizza',
    kcal: 930, protein: 39, time: '25 min',
    blurb: 'Three slices of a big pepperoni pie. Store-bought dough works fine.',
    ingredients: ['Pizza dough', '½ cup pizza sauce', '1½ cups mozzarella', '2 oz pepperoni', 'Olive oil'],
    steps: ['Heat the oven as hot as it goes.', 'Stretch the dough, add sauce, cheese and pepperoni.', 'Bake until bubbling and spotted. Eat three slices.'],
    boost: ['oil', 'milk'],
  },
  {
    slug: 'chicken-alfredo', title: 'Chicken alfredo', category: 'meals', sticker: 'pasta',
    palette: { sauce: '#FFF6DE', meatball: '#C7783A', pasta: '#FFE07A' },
    kcal: 1070, protein: 65, time: '25 min',
    blurb: 'Creamy, rich and easy to eat a lot of. Probably the best calorie-per-effort dinner there is.',
    ingredients: ['4 oz dry fettuccine', '5 oz chicken breast', '½ cup alfredo sauce', '2 tbsp parmesan', 'Black pepper and parsley'],
    steps: ['Season and sear the chicken, then slice it.', 'Cook the fettuccine and toss it with the warm sauce.', 'Top with chicken, parmesan, pepper and parsley.'],
    boost: ['cream', 'butter', 'cheese'],
  },
  {
    slug: 'beef-rice-bowl', title: 'Ground beef and rice bowl', category: 'meals', sticker: 'bowl',
    palette: { chicken: '#7A4128', avocado: '#5BC25A', bowl: '#FF5A36', corn: '#FFC21A' },
    kcal: 870, protein: 47, time: '15 min',
    blurb: 'Sweet soy beef over rice with a fried egg. Fast enough for a weeknight.',
    ingredients: ['1½ cups cooked rice', '5 oz 80/20 ground beef', '1 egg', '2 tbsp soy sauce', '1 tbsp honey', '1 tsp sesame oil', 'Green onion'],
    steps: ['Brown the beef, then stir in soy, honey and sesame oil until sticky.', 'Fry the egg.', 'Spoon the beef over rice and top with the egg and green onion.'],
    boost: ['oil', 'avocado', 'butter'],
  },
  {
    slug: 'strawberry-shake', title: 'Thousand-calorie strawberry shake', category: 'shakes', sticker: 'shake',
    kcal: 950, protein: 50, time: '5 min',
    blurb: 'Tastes like a diner milkshake. Has a full meal’s worth of calories in it.',
    ingredients: ['2 cups whole milk', '1 cup vanilla ice cream', '1 scoop whey', '½ cup rolled oats', '1 cup strawberries', '1 tbsp honey'],
    steps: ['Blend the oats first so they turn to powder.', 'Add everything else and blend until smooth.', 'Pour into the biggest glass you own.'],
    boost: ['pb', 'banana', 'cream'],
  },
  {
    slug: 'chocolate-pb-shake', title: 'Chocolate peanut butter shake', category: 'shakes', sticker: 'shake',
    palette: { shake: '#9A5A34', shakeLight: '#C08458', straw: '#FFB4C6', cherry: '#E8384F' },
    kcal: 880, protein: 54, time: '5 min',
    blurb: 'Banana, peanut butter and chocolate whey. Drink it with breakfast or after training.',
    ingredients: ['2 cups whole milk', '1 scoop chocolate whey', '2 tbsp peanut butter', '1 banana', '½ cup rolled oats', '1 tbsp cocoa powder'],
    steps: ['Blend the oats into a powder.', 'Add the rest and blend until thick.', 'Add ice if you like it colder and thicker.'],
    boost: ['pb', 'nuts', 'milk'],
  },
  {
    slug: 'snack-plate', title: 'Cheese and salami snack plate', category: 'snacks', sticker: 'cheese',
    kcal: 710, protein: 30, time: '5 min',
    blurb: 'Something to pick at while watching TV. It adds up quickly.',
    ingredients: ['2 oz cheddar', '2 oz salami', '15 crackers', 'A handful of grapes'],
    steps: ['Slice the cheese and salami.', 'Pile it on a board with the crackers and grapes.', 'Keep it within reach.'],
    boost: ['nuts', 'avocado'],
  },
  {
    slug: 'pbj-milk', title: 'PB&J and a glass of milk', category: 'snacks', sticker: 'milk',
    kcal: 550, protein: 23, time: '3 min',
    blurb: 'The easiest snack there is. Make two.',
    ingredients: ['2 slices bread', '2 tbsp peanut butter', '1 tbsp jam', '1 cup whole milk'],
    steps: ['Spread the peanut butter and jam.', 'Close it up and cut it diagonally.', 'Drink the milk with it.'],
    boost: ['banana', 'pb', 'honey'],
  },
  {
    slug: 'yogurt-parfait', title: 'Granola yogurt parfait', category: 'snacks', sticker: 'jar',
    palette: { oats: '#D9A55B', cherry: '#E8384F', berry: '#2B45E0', spoon: '#FFB4C6' },
    kcal: 700, protein: 30, time: '5 min',
    blurb: 'Whole-milk Greek yogurt layered with granola, honey and berries.',
    ingredients: ['1 cup whole-milk Greek yogurt', '½ cup granola', '2 tbsp chopped nuts', '1 tbsp honey', 'A handful of berries'],
    steps: ['Spoon half the yogurt into a jar or bowl.', 'Add half the granola, berries and nuts, then repeat.', 'Finish with honey.'],
    boost: ['honey', 'nuts', 'pb'],
  },
]
