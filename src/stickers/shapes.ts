// Every sticker is a list of simple shapes in a 200×200 box. <Sticker> draws
// them twice: once fat and white for the die-cut border, then filled with an
// ink outline. Colors are named roles, so a sticker can be recolored by
// overriding roles (a chocolate shake is the shake with a brown `shake`).

export const PALETTE = {
  ink: '#1B1A17', white: '#FFFFFF', cream: '#FFF6DE',
  plate: '#FFB4C6', plateWhite: '#FFFFFF',
  cake: '#E39A3B', cakeLight: '#F6B94E', syrup: '#8A3B12', butter: '#FFE45C',
  bun: '#F3A847', patty: '#7A4128', cheese: '#FFC72C', cheeseLight: '#FFDC6B', cheeseHole: '#E9A800', lettuce: '#5BC25A', seed: '#FFF6DE',
  shake: '#F2C98B', shakeLight: '#FFE2B0', whip: '#FFFFFF', topper: '#7A4128', straw: '#2B45E0',
  bowl: '#2B45E0', rice: '#FFFFFF', chicken: '#C7783A', beans: '#4A2C2A', corn: '#FFD447', avocado: '#7DBE5A',
  pasta: '#FFD447', sauce: '#D8402B', meatball: '#8A3B12', basil: '#5BC25A',
  bread: '#E8B46A', pb: '#C9813E', honey: '#F2B02E',
  egg: '#FFFFFF', yolk: '#FFC21A', bacon: '#D45A3C',
  tortilla: '#F2D29B', filling: '#FFF3D6', foil: '#CFD7E0',
  jar: '#DDF2FF', oats: '#EBD3A0', chip: '#5A3420', nut: '#C98A4B', spoon: '#CFD7E0',
  crust: '#E3973D', pepperoni: '#D8402B',
  lid: '#FF5A36', peanut: '#B8642B', milkBlue: '#2B45E0',
  avoSkin: '#3E7A2E', avoFlesh: '#CDE88E', avoPit: '#9A5B2E',
  oil: '#C8D85A', olive: '#5C7A2B',
  butterTop: '#FFF0A0', butterSide: '#FFD95C', wrapper: '#FFFFFF',
  almond: '#C98A4B', cashew: '#F0D6A0', almondLine: '#9A5B2E',
}

export type Role = keyof typeof PALETTE
export type Palette = Partial<Record<Role, string>>

type Attrs = Record<string, string | number>
export interface Shape {
  el: 'rect' | 'circle' | 'ellipse' | 'path'
  a: Attrs
  fill?: Role
  line?: Role // stroke-only shape in this color
  w?: number
  dash?: string
  flat?: boolean // no outline and no die-cut (highlights, small dots)
}

const r = (x: number, y: number, width: number, height: number, rx: number, fill: Role, extra: Attrs = {}): Shape =>
  ({ el: 'rect', a: { x, y, width, height, rx, ...extra }, fill })
const c = (cx: number, cy: number, rad: number, fill: Role, extra: Attrs = {}, flat = false): Shape =>
  ({ el: 'circle', a: { cx, cy, r: rad, ...extra }, fill, flat })
const e = (cx: number, cy: number, rx: number, ry: number, fill: Role, extra: Attrs = {}, flat = false): Shape =>
  ({ el: 'ellipse', a: { cx, cy, rx, ry, ...extra }, fill, flat })
const p = (d: string, fill: Role, extra: Attrs = {}): Shape => ({ el: 'path', a: { d, ...extra }, fill })
const line = (d: string, color: Role, w = 5, dash?: string, extra: Attrs = {}): Shape =>
  ({ el: 'path', a: { d, ...extra }, line: color, w, dash })

const sprinkle = (x: number, y: number, angle: number, fill: Role): Shape =>
  ({ el: 'rect', a: { x: x - 6, y: y - 2.5, width: 12, height: 5, rx: 2.5, transform: `rotate(${angle} ${x} ${y})` }, fill, flat: true })
const salt = (x: number, y: number): Shape =>
  ({ el: 'rect', a: { x: x - 3, y: y - 3, width: 6, height: 6, rx: 1, transform: `rotate(20 ${x} ${y})` }, fill: 'white', flat: true })

const seeds = (y: number) => [
  e(70, y + 14, 5, 3, 'seed', { transform: `rotate(-30 70 ${y + 14})` }),
  e(93, y, 5, 3, 'seed', { transform: `rotate(-10 93 ${y})` }),
  e(116, y, 5, 3, 'seed', { transform: `rotate(12 116 ${y})` }),
  e(138, y + 12, 5, 3, 'seed', { transform: `rotate(30 138 ${y + 12})` }),
]

const tilt = { transform: 'rotate(-20 100 104)' }

export const STICKERS = {
  pancakes: [
    e(100, 176, 90, 16, 'plate'),
    r(28, 140, 144, 30, 15, 'cake'),
    r(34, 114, 132, 30, 15, 'cakeLight'),
    r(28, 88, 144, 30, 15, 'cake'),
    r(36, 62, 128, 30, 15, 'cakeLight'),
    p('M44 70 Q100 50 156 70 L157 88 Q152 100 147 88 L145 80 Q126 86 108 82 L106 108 Q100 120 94 108 L92 82 Q72 82 58 78 L56 96 Q51 106 46 96 Z', 'syrup'),
    r(82, 40, 36, 26, 5, 'butter', { transform: 'rotate(-8 100 53)' }),
  ],
  burger: [
    r(30, 148, 140, 28, 13, 'bun'),
    r(22, 116, 156, 32, 16, 'patty'),
    p('M26 110 H174 V122 H156 L146 140 L136 122 H88 L76 138 L64 122 H26 Z', 'cheese'),
    p('M20 106 Q30 92 40 104 Q50 92 60 104 Q70 92 80 104 Q90 92 100 104 Q110 92 120 104 Q130 92 140 104 Q150 92 160 104 Q170 92 180 106 L180 114 H20 Z', 'lettuce'),
    p('M28 100 C28 50 62 32 100 32 C138 32 172 50 172 100 Z', 'bun'),
    ...seeds(46),
  ],
  shake: [
    r(118, 4, 13, 88, 6.5, 'straw', { transform: 'rotate(16 124 48)' }),
    p('M56 74 H144 L132 188 H68 Z', 'shake'),
    p('M59 100 H141 L139 118 H61 Z', 'shakeLight'),
    p('M50 80 Q40 54 68 54 Q72 30 98 36 Q120 22 134 46 Q162 46 152 80 Z', 'whip'),
    c(100, 34, 12, 'topper'),
    sprinkle(68, 62, 20, 'lid'), sprinkle(122, 50, -30, 'milkBlue'), sprinkle(136, 66, 60, 'lettuce'), sprinkle(84, 46, -50, 'butter'),
  ],
  bowl: [
    c(70, 94, 22, 'rice'), c(102, 80, 24, 'rice'), c(136, 88, 22, 'rice'),
    r(42, 68, 50, 22, 10, 'chicken', { transform: 'rotate(-12 67 79)' }),
    r(116, 64, 56, 24, 10, 'chicken', { transform: 'rotate(14 144 76)' }),
    p('M88 70 Q106 38 128 62 Q108 76 88 70 Z', 'avocado'),
    c(154, 92, 8, 'corn'), c(50, 92, 7, 'beans'),
    p('M16 98 H184 Q178 172 100 176 Q22 172 16 98 Z', 'bowl'),
    line('M40 120 H160', 'cream', 5, '2 14'),
  ],
  pasta: [
    e(100, 128, 96, 42, 'plateWhite'),
    p('M34 120 C50 66 150 66 166 120 C140 148 60 148 34 120 Z', 'pasta'),
    line('M52 116 C72 92 92 136 112 108 C132 82 142 128 158 112', 'ink', 4),
    line('M58 130 C82 112 102 140 126 120 C142 106 148 132 154 126', 'ink', 4),
    p('M68 98 Q100 76 134 96 Q140 114 112 116 Q82 120 68 98 Z', 'sauce'),
    c(88, 96, 16, 'meatball'), c(122, 92, 14, 'meatball'), c(106, 112, 13, 'meatball'),
    p('M118 72 Q130 50 148 58 Q136 76 118 72 Z', 'basil'),
  ],
  toast: [
    p('M34 178 V90 C10 86 14 32 62 32 H138 C186 32 190 86 166 90 V178 Z', 'bread'),
    p('M48 164 V96 C32 90 34 52 66 52 H134 C166 52 168 90 152 96 V164 Z', 'pb'),
    line('M60 80 Q74 96 88 80 T116 80 T142 82', 'honey', 7),
    line('M58 114 Q72 130 86 114 T114 114 T144 116', 'honey', 7),
    line('M62 146 Q76 158 90 146 T118 146 T140 148', 'honey', 7),
    salt(76, 98), salt(124, 98), salt(100, 132), salt(132, 132), salt(72, 132),
  ],
  sandwich: [
    r(36, 146, 128, 28, 13, 'bun'),
    p('M28 136 Q43 124 58 136 Q73 148 88 136 Q103 124 118 136 Q133 148 148 136 Q163 124 174 134 L174 146 Q160 154 146 146 Q131 138 116 146 Q101 154 86 146 Q71 138 56 146 Q41 154 28 146 Z', 'bacon'),
    p('M30 120 H170 V130 H150 L142 146 L134 130 H78 L70 144 L62 130 H30 Z', 'cheese'),
    p('M26 112 Q34 98 60 102 Q80 94 100 100 Q124 92 146 102 Q170 98 174 114 Q170 124 100 124 Q30 124 26 112 Z', 'egg'),
    e(100, 106, 20, 12, 'yolk'),
    p('M30 104 C30 58 62 40 100 40 C138 40 170 58 170 104 Z', 'bun'),
    ...seeds(54),
  ],
  burrito: [
    r(62, 22, 76, 166, 38, 'tortilla', tilt),
    e(100, 42, 32, 16, 'filling', tilt),
    c(86, 40, 6, 'beans', tilt, true), c(101, 47, 6, 'lettuce', tilt, true), c(113, 38, 6, 'chicken', tilt, true), c(98, 34, 4, 'sauce', tilt, true),
    p('M62 112 L72 104 L82 112 L92 104 L102 112 L112 104 L122 112 L132 104 L138 110 V150 Q138 188 100 188 Q62 188 62 150 Z', 'foil', tilt),
    line('M80 130 V166', 'white', 5, undefined, tilt),
  ],
  jar: [
    r(124, 6, 14, 74, 7, 'spoon', { transform: 'rotate(18 131 43)' }),
    r(46, 52, 108, 134, 24, 'jar'),
    r(54, 112, 92, 66, 16, 'oats'),
    r(54, 92, 92, 24, 6, 'whip'),
    c(78, 86, 10, 'chip'), c(100, 82, 11, 'nut'), c(124, 86, 10, 'chip'),
    r(40, 42, 120, 18, 9, 'foil'),
    line('M64 128 V164', 'white', 6),
  ],
  pizza: [
    p('M100 188 L30 56 Q100 24 170 56 Z', 'cheese'),
    p('M26 54 Q100 16 174 54 L168 72 Q100 38 32 72 Z', 'crust'),
    c(84, 88, 13, 'pepperoni'), c(118, 96, 12, 'pepperoni'), c(98, 128, 11, 'pepperoni'), c(104, 160, 7, 'pepperoni'),
  ],
  egg: [
    p('M30 100 C10 50 70 18 110 34 C160 18 196 66 172 104 C192 150 134 184 96 168 C46 188 6 150 30 100 Z', 'egg'),
    c(102, 98, 34, 'yolk'),
    e(90, 86, 10, 6, 'white', {}, true),
  ],
  pbJar: [
    r(44, 56, 112, 128, 26, 'pb'),
    r(56, 92, 88, 60, 12, 'cream'),
    c(90, 122, 14, 'peanut'), c(110, 122, 14, 'peanut'),
    r(52, 28, 96, 34, 9, 'lid'),
    line('M68 36 V54 M84 36 V54 M100 36 V54 M116 36 V54 M132 36 V54', 'ink', 3),
  ],
  milk: [
    r(66, 20, 68, 16, 4, 'white'),
    p('M52 76 L72 34 H128 L148 76 Z', 'cream'),
    r(52, 74, 96, 112, 6, 'white'),
    r(52, 110, 96, 46, 0, 'milkBlue'),
    p('M100 118 Q114 136 100 148 Q86 136 100 118 Z', 'white'),
  ],
  avocado: [
    p('M100 16 C136 16 154 70 164 112 C176 162 140 190 100 190 C60 190 24 162 36 112 C46 70 64 16 100 16 Z', 'avoSkin'),
    p('M100 34 C126 34 140 76 148 112 C156 152 132 174 100 174 C68 174 44 152 52 112 C60 76 74 34 100 34 Z', 'avoFlesh'),
    c(100, 128, 26, 'avoPit'),
    c(92, 118, 6, 'white', {}, true),
  ],
  cheese: [
    p('M20 100 L140 40 L184 100 Z', 'cheeseLight'),
    p('M20 100 H184 V156 Q184 164 176 164 H28 Q20 164 20 156 Z', 'cheese'),
    e(58, 130, 12, 9, 'cheeseHole'), e(122, 142, 9, 7, 'cheeseHole'), e(156, 120, 11, 8, 'cheeseHole'), e(118, 76, 9, 5, 'cheeseHole'),
  ],
  oil: [
    r(86, 8, 28, 22, 4, 'lid'),
    r(90, 26, 20, 36, 4, 'oil'),
    p('M68 84 Q68 62 90 60 H110 Q132 62 132 84 V180 Q132 190 122 190 H78 Q68 190 68 180 Z', 'oil'),
    r(76, 110, 48, 54, 6, 'cream'),
    e(98, 138, 10, 14, 'olive', { transform: 'rotate(-20 98 138)' }),
    p('M104 124 Q118 110 122 124 Q112 132 104 124 Z', 'lettuce'),
  ],
  butter: [
    p('M24 120 L120 70 L180 98 L84 148 Z', 'butterTop'),
    p('M24 120 L84 148 V176 L24 148 Z', 'butter'),
    p('M84 148 L180 98 V126 L84 176 Z', 'butterSide'),
    p('M84 148 L136 121 V149 L84 176 Z', 'wrapper'),
    line('M96 152 L124 138', 'milkBlue', 4),
    line('M96 162 L118 151', 'milkBlue', 4),
  ],
  nuts: [
    e(66, 128, 30, 20, 'almond', { transform: 'rotate(-30 66 128)' }),
    e(132, 132, 30, 20, 'almond', { transform: 'rotate(25 132 132)' }),
    p('M76 92 C60 60 92 34 112 52 C126 40 152 56 138 82 C150 108 118 122 104 104 C90 120 66 112 76 92 Z', 'cashew'),
    e(102, 160, 28, 18, 'almond', { transform: 'rotate(-6 102 160)' }),
    line('M52 120 Q66 128 80 136', 'almondLine', 3),
    line('M120 140 Q132 132 146 124', 'almondLine', 3),
    line('M84 158 Q102 164 120 160', 'almondLine', 3),
  ],
} satisfies Record<string, Shape[]>

export type StickerName = keyof typeof STICKERS
