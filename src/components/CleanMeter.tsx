import { CLEAN_LEVELS, type CleanScore } from '../data/ideas'

const STEPS: CleanScore[] = [1, 2, 3, 4, 5]

// Five pips from dirty to clean, filled up to the score.
export function CleanMeter({ score, big = false }: { score: CleanScore; big?: boolean }) {
  return (
    <span className={`clean-meter clean-${score}${big ? ' clean-meter-big' : ''}`} role="img" aria-label={`${CLEAN_LEVELS[score]}, ${score} of 5 from dirty to clean`}>
      {STEPS.map((n) => <i key={n} className={n <= score ? 'on' : undefined} />)}
    </span>
  )
}
