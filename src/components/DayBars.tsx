import { MACRO_NAMES, MACROS, type Goals, type Macro } from '../lib/preferences'

// What share of the day's goals some food covers, one bar per goal that's
// set. `values` adds the amounts ("2,580 of 2,600 kcal"). Without goals, a
// way to set them.
export function DayBars({ totals, goals, onGoals, title = 'Of your day', values = false, className = '' }: {
  totals: Record<Macro, number>
  goals: Goals
  onGoals: () => void
  title?: string
  values?: boolean
  className?: string
}) {
  const set = MACROS.filter((m) => goals[m])
  if (!set.length) {
    return (
      <div className={`day day-empty ${className}`}>
        <p>How much of your day is this?</p>
        <button type="button" className="btn btn-quiet" onClick={onGoals}>Set daily goals</button>
      </div>
    )
  }
  return (
    <div className={`day ${values ? 'day-values' : ''} ${className}`}>
      <p className="day-head"><b>{title}</b> <button type="button" className="link-btn" onClick={onGoals}>Edit goals</button></p>
      <ul className="day-rows">
        {set.map((m) => {
          const share = Math.round((totals[m] / goals[m]!) * 100)
          const amounts = `${totals[m].toLocaleString()} of ${goals[m]!.toLocaleString()} ${MACRO_NAMES[m].unit}`
          return (
            <li key={m} className={`day-row day-${m}`} title={amounts}>
              <span className="day-name">{MACRO_NAMES[m].label}</span>
              <span className="day-bar" aria-hidden="true"><i className={share > 0 ? 'has' : undefined} style={{ width: `${Math.min(share, 100)}%` }} /></span>
              <b className="day-pct">{share}%</b>
              {values ? <span className="day-amounts">{amounts}</span> : <span className="visually-hidden">: {amounts}</span>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
