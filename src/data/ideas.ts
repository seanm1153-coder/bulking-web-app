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
export const ideaText = (i: Idea) => [i.title, i.blurb, ...i.ingredients, ...i.steps, ...(i.ahead ? aheadText(i.ahead) : [])].join('\n')
export const boosterText = (b: Booster) => [b.name, b.amount, b.tip].join('\n')

export const IDEAS: Idea[] = [
  {
    slug: 'protein-pancakes', title: 'Protein pancake stack', category: 'breakfast', sticker: 'pancakes',
    kcal: 1110, protein: 48, time: '20 min',
    blurb: 'A diner-sized stack with whey in the batter, so it counts as a real meal.',
    ingredients: ['¾ cup pancake mix', '1 scoop vanilla whey', '1 cup whole milk', '1 egg', '1 tbsp butter', '3 tbsp maple syrup', '2 tbsp chocolate chips'],
    steps: ['Whisk the mix, whey, milk and egg until just combined.', 'Cook four or five pancakes in butter over medium heat, scattering chocolate chips on each.', 'Stack them up and finish with more butter and syrup.'],
    boost: ['butter', 'pb', 'nuts'],
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
  },
  {
    slug: 'bacon-egg-cheese', title: 'Bacon, egg and cheese', category: 'breakfast', sticker: 'sandwich',
    kcal: 650, protein: 35, time: '10 min',
    blurb: 'The deli classic on a toasted brioche bun.',
    ingredients: ['1 brioche bun', '2 eggs', '3 strips bacon', '1 slice cheddar', 'Butter for the pan'],
    steps: ['Cook the bacon until crisp.', 'Fry the eggs in butter and melt the cheese over them.', 'Toast the bun and stack it all up.'],
    boost: ['butter', 'avocado', 'milk'],
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
    slug: 'burrito-bowl', title: 'Chicken burrito bowl', category: 'meals', sticker: 'bowl',
    kcal: 1080, protein: 67, time: '25 min',
    blurb: 'Rice, chicken thighs, beans, cheese and avocado. Easy to scale up for meal prep.',
    ingredients: ['1½ cups cooked rice', '6 oz chicken thigh', '½ cup black beans', '¼ cup shredded cheese', '½ avocado', '2 tbsp sour cream', 'Corn salsa'],
    steps: ['Season the chicken with chili powder, cumin and salt. Sear until cooked through.', 'Warm the beans and fluff the rice.', 'Build the bowl and top with cheese, avocado, sour cream and salsa.'],
    boost: ['oil', 'cheese', 'avocado'],
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
    ahead: {
      keeps: 'freezer', makes: 6, unit: 'portions',
      lasts: '4 days in the fridge, or up to 2 months in the freezer.',
      eat: 'Add a splash of milk and microwave covered, 2 to 3 minutes from the fridge or 5 to 6 from frozen, stirring halfway.',
    },
  },
  {
    slug: 'vanilla-malt-shake', title: 'Thousand-calorie vanilla malt', category: 'shakes', sticker: 'shake',
    kcal: 980, protein: 52, time: '5 min',
    blurb: 'Tastes like a diner malt. Has a full meal’s worth of calories in it.',
    ingredients: ['2 cups whole milk', '1 cup vanilla ice cream', '1 scoop vanilla whey', '½ cup rolled oats', '2 tbsp malted milk powder', '1 tbsp honey'],
    steps: ['Blend the oats first so they turn to powder.', 'Add everything else and blend until smooth.', 'Pour into the biggest glass you own.'],
    boost: ['pb', 'cream', 'nuts'],
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
  },
  {
    slug: 'yogurt-parfait', title: 'Granola yogurt parfait', category: 'snacks', sticker: 'jar',
    palette: { oats: '#D9A55B', spoon: '#FFB4C6' },
    kcal: 730, protein: 31, time: '5 min',
    blurb: 'Whole-milk Greek yogurt layered with crunchy granola, nuts, chocolate chips and honey.',
    ingredients: ['1 cup whole-milk Greek yogurt', '½ cup plain or nut granola', '2 tbsp chopped nuts', '1 tbsp chocolate chips', '1 tbsp honey'],
    steps: ['Spoon half the yogurt into a jar or bowl.', 'Add half the granola, nuts and chocolate chips, then repeat.', 'Finish with honey.'],
    boost: ['honey', 'nuts', 'pb'],
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
    ahead: {
      keeps: 'freezer', makes: 8, unit: 'bars',
      lasts: 'A week in the fridge, or up to 3 months in the freezer.',
      eat: 'Straight from the fridge, or 10 minutes out of the freezer.',
    },
  },
]
