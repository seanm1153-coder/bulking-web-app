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
export const ideaText = (i: Idea) => [i.title, i.blurb, ...i.ingredients, ...i.steps].join('\n')
export const boosterText = (b: Booster) => [b.name, b.amount, b.tip].join('\n')

export const IDEAS: Idea[] = [
  {
    slug: 'protein-pancakes', title: 'Protein pancake stack', category: 'breakfast', sticker: 'pancakes',
    kcal: 1110, protein: 48, time: '20 min',
    blurb: 'A diner-sized stack with whey in the batter, so it counts as a real meal.',
    ingredients: ['¾ cup pancake mix', '1 scoop vanilla whey', '1 cup whole milk', '1 egg', '1 tbsp butter', '3 tbsp maple syrup', '2 tbsp chocolate chips'],
    steps: ['Whisk the mix, whey, milk and egg until just combined.', 'Cook four or five pancakes in butter over medium heat, scattering chocolate chips on each.', 'Stack them up and finish with more butter and syrup.'],
    boost: ['butter', 'pb', 'nuts'],
  },
  {
    slug: 'overnight-oats', title: 'Loaded overnight oats', category: 'breakfast', sticker: 'jar',
    kcal: 960, protein: 50, time: '5 min, then overnight',
    blurb: 'Make it before bed and breakfast is waiting in the fridge.',
    ingredients: ['1 cup rolled oats', '1 cup whole milk', '1 scoop whey', '2 tbsp peanut butter', '1 tbsp honey', '2 tbsp chocolate chips'],
    steps: ['Stir the oats, milk and whey together in a jar.', 'Swirl in the peanut butter and honey.', 'Refrigerate overnight. Top with chocolate chips in the morning.'],
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
    slug: 'pb-honey-toast', title: 'Peanut butter honey toast', category: 'breakfast', sticker: 'toast',
    kcal: 770, protein: 23, time: '5 min',
    blurb: 'Thick buttered toast, a lot of peanut butter, honey and flaky salt. Fast and hard to beat.',
    ingredients: ['2 thick slices sourdough', '1 tbsp butter', '3 tbsp peanut butter', '1 tbsp honey', 'Flaky salt'],
    steps: ['Toast the bread well and butter it.', 'Spread on the peanut butter while it’s hot so it melts a little.', 'Drizzle with honey and finish with flaky salt.'],
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
    blurb: 'Two thin crispy patties, melty cheese, raw onion and sauce.',
    ingredients: ['6 oz 80/20 ground beef, as two balls', '2 slices American cheese', '1 brioche bun', '1 tbsp burger sauce', 'Lettuce and thinly sliced onion'],
    steps: ['Get a pan or griddle very hot.', 'Smash each ball flat, season, and cook 2 minutes. Flip and add cheese.', 'Stack on a toasted bun with sauce, lettuce and onion.'],
    boost: ['cheese', 'milk', 'avocado'],
  },
  {
    slug: 'animal-style-fries', title: 'Animal-style loaded fries', category: 'meals', sticker: 'fries',
    kcal: 1450, protein: 55, time: '35 min',
    blurb: 'Crispy fries buried under cheesy beef, sweet browned onions and a tangy burger sauce. A whole meal on one tray.',
    ingredients: ['1 large russet potato (about 300 g), cut into thin fries', '1 tbsp olive oil', '6 oz 80/20 ground beef', '2 slices American cheese', '¼ cup shredded cheddar', '1 onion, finely diced', '1 tbsp butter', '1 tsp brown sugar', '2 tsp balsamic vinegar', 'Smoked paprika, garlic powder and salt', 'Sauce: 2 tbsp mayo, 3 tbsp whole-milk Greek yogurt, 1 tbsp ketchup, 1 tsp yellow mustard, ½ tsp Worcestershire sauce, 1 tsp white vinegar, hot sauce to taste'],
    steps: ['Heat the oven to 425°F (or the air fryer to 400°F). Toss the fries with the oil, a pinch of smoked paprika and salt, and cook 25 to 30 minutes (18 to 20 in the air fryer), shaking halfway, until crisp.', 'Meanwhile, cook the onion in the butter over medium-low with the brown sugar and a pinch of salt for about 15 minutes, until soft and deep golden. Stir in the balsamic for the last minute.', 'Stir the sauce together.', 'Brown the beef in a hot pan, breaking it up, and season with garlic powder, smoked paprika and salt. Press it flat, lay the cheese slices on top, and cover for a minute to melt.', 'Pile the fries on a plate, scatter the cheddar over them, then add the cheesy beef, the onions and plenty of sauce.'],
    boost: ['cheese', 'butter', 'milk'],
    source: { name: 'Panacea Palm', url: 'https://www.youtube.com/shorts/1L2Ke_9VfnM' },
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
    slug: 'chicken-pad-thai', title: 'Chicken pad thai', category: 'meals', sticker: 'noodles',
    kcal: 1390, protein: 70, time: '25 min, plus soaking',
    blurb: 'A takeout-sized plate of sweet, salty, spicy noodles with chicken, egg, tofu and a lot of peanuts.',
    ingredients: ['120 g dry pad thai rice noodles', '6 oz chicken thigh, sliced thin', '¼ tsp baking soda', '2 eggs', '2 oz firm or smoked tofu, cubed', '1 shallot, sliced', '1 cup bean sprouts', 'A small bunch of chives, cut long', '3 tbsp chopped roasted peanuts', '2 tbsp neutral oil', 'Chili flakes, as much as you like', 'Sauce: 1½ tbsp brown sugar, 1 tbsp fish sauce, 1 tbsp soy sauce, 1 tbsp rice vinegar, 1 tbsp lime juice, 2 tbsp water'],
    steps: ['Soak the noodles in warm water for an hour, or boil them for 3 to 4 minutes until just bendy. Drain and rinse.', 'Toss the chicken with the baking soda and a pinch of salt and leave it 10 minutes. It stays juicy that way. Stir the sauce together.', 'Get a wok or big pan very hot with half the oil. Sear the chicken and tofu until golden, add the shallot for a minute, then push it all to one side.', 'Add the rest of the oil and scramble the eggs in the space.', 'Add the noodles and sauce and toss for 2 to 3 minutes until the sauce is soaked up. Fold in the bean sprouts and chives.', 'Pile it up and finish with the peanuts and chili flakes.'],
    boost: ['pb', 'nuts', 'oil'],
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
  },
  {
    slug: 'vanilla-malt-shake', title: 'Thousand-calorie vanilla malt', category: 'shakes', sticker: 'shake',
    kcal: 980, protein: 52, time: '5 min',
    blurb: 'Tastes like a diner malt. Has a full meal’s worth of calories in it.',
    ingredients: ['2 cups whole milk', '1 cup vanilla ice cream', '1 scoop vanilla whey', '½ cup rolled oats', '2 tbsp malted milk powder', '1 tbsp honey'],
    steps: ['Blend the oats first so they turn to powder.', 'Add everything else and blend until smooth.', 'Pour into the biggest glass you own.'],
    boost: ['pb', 'cream', 'nuts'],
  },
  {
    slug: 'chocolate-pb-shake', title: 'Chocolate peanut butter shake', category: 'shakes', sticker: 'shake',
    palette: { shake: '#9A5A34', shakeLight: '#C08458', straw: '#FFB4C6', topper: '#FFF6DE' },
    kcal: 910, protein: 55, time: '5 min',
    blurb: 'Peanut butter, chocolate ice cream and chocolate whey. Drink it with breakfast or after training.',
    ingredients: ['2 cups whole milk', '1 scoop chocolate whey', '2 tbsp peanut butter', '½ cup chocolate ice cream', '½ cup rolled oats', '1 tbsp cocoa powder'],
    steps: ['Blend the oats into a powder.', 'Add the rest and blend until thick.', 'Add ice if you like it colder and thicker.'],
    boost: ['pb', 'nuts', 'milk'],
  },
  {
    slug: 'snack-plate', title: 'Cheese and salami snack plate', category: 'snacks', sticker: 'cheese',
    kcal: 850, protein: 37, time: '5 min',
    blurb: 'Something to pick at while watching TV. It adds up quickly.',
    ingredients: ['2 oz cheddar', '2 oz salami', '15 crackers', '¼ cup salted almonds'],
    steps: ['Slice the cheese and salami.', 'Pile it on a board with the crackers and almonds.', 'Keep it within reach.'],
    boost: ['nuts', 'avocado'],
  },
  {
    slug: 'fluffernutter-milk', title: 'Fluffernutter and a glass of milk', category: 'snacks', sticker: 'milk',
    kcal: 540, protein: 23, time: '3 min',
    blurb: 'Peanut butter and marshmallow creme on soft bread. The easiest snack there is. Make two.',
    ingredients: ['2 slices soft white bread', '2 tbsp peanut butter', '2 tbsp marshmallow creme', '1 cup whole milk'],
    steps: ['Spread peanut butter on one slice and marshmallow creme on the other.', 'Close it up and cut it diagonally.', 'Drink the milk with it.'],
    boost: ['pb', 'honey', 'milk'],
  },
  {
    slug: 'yogurt-parfait', title: 'Granola yogurt parfait', category: 'snacks', sticker: 'jar',
    palette: { oats: '#D9A55B', spoon: '#FFB4C6' },
    kcal: 730, protein: 31, time: '5 min',
    blurb: 'Whole-milk Greek yogurt layered with crunchy granola, nuts, chocolate chips and honey.',
    ingredients: ['1 cup whole-milk Greek yogurt', '½ cup plain or nut granola', '2 tbsp chopped nuts', '1 tbsp chocolate chips', '1 tbsp honey'],
    steps: ['Spoon half the yogurt into a jar or bowl.', 'Add half the granola, nuts and chocolate chips, then repeat.', 'Finish with honey.'],
    boost: ['honey', 'nuts', 'pb'],
  },
]
