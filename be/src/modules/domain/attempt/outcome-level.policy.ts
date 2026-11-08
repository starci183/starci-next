import type { AttemptKind, AttemptResult, OutcomeLevels } from "./attempt.contracts"

/** The share of the points that earns level 2. */
const FULL_SHARE = 0.8

/** The share of the points that earns level 1. */
const PARTIAL_SHARE = 0.5

/** The levels of an attempt that raises nothing: a stored answer that is not graded yet, or a diagnostic. */
export const NO_OUTCOME_LEVELS: OutcomeLevels = { understood: 0, proved: 0 }

const strengthOf = (result: AttemptResult): number => {
    const share = result.maxScore === 0 ? 0 : result.score / result.maxScore
    if (share >= FULL_SHARE) return 2
    return share >= PARTIAL_SHARE ? 1 : 0
}

/**
 * The levels one graded attempt gives to the outcomes its activity trains. A diagnostic gives none, because it does not count
 * toward passing. An exercise proves what it shows; every other kind shows understanding only.
 */
export const levelsOf = (kind: AttemptKind, result: AttemptResult): OutcomeLevels => {
    if (result.isDiagnostic) return NO_OUTCOME_LEVELS
    const level = strengthOf(result)
    return { understood: level, proved: kind === "exercise" ? level : 0 }
}
