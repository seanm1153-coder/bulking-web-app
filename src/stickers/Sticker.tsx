import { createElement, type CSSProperties } from 'react'
import { PALETTE, STICKERS, type Palette, type Shape, type StickerName } from './shapes'

const DIE_CUT = 22 // width of the white border, in sticker units

function paint(s: Shape, pal: typeof PALETTE, key: number) {
  if (s.line) {
    return createElement(s.el, { key, ...s.a, fill: 'none', stroke: pal[s.line], strokeWidth: s.w ?? 5, strokeDasharray: s.dash })
  }
  return createElement(s.el, { key, ...s.a, fill: pal[s.fill ?? 'white'], ...(s.flat ? { stroke: 'none' } : {}) })
}

export function Sticker({ name, palette, tilt = 0, title, className = '' }: {
  name: StickerName
  palette?: Palette
  tilt?: number
  title?: string
  className?: string
}) {
  const shapes: Shape[] = STICKERS[name]
  const pal = { ...PALETTE, ...palette }
  return (
    <svg
      className={`sticker ${className}`}
      viewBox="-18 -18 236 236"
      style={{ '--tilt': `${tilt}deg` } as CSSProperties}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <g fill="#fff" stroke="#fff" strokeWidth={DIE_CUT} strokeLinejoin="round" strokeLinecap="round">
        {shapes.filter((s) => !s.flat).map((s, i) => createElement(s.el, { key: i, ...s.a, ...(s.line ? { fill: 'none' } : {}) }))}
      </g>
      <g stroke={pal.ink} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round">
        {shapes.map((s, i) => paint(s, pal, i))}
      </g>
    </svg>
  )
}
