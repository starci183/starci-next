import type { AttemptResult, OutcomeLevels } from "./attempt.contracts"

/** The share of the points that earns level 2. */
const FULL_SHARE = 0.8

/** The share of the points that earns level 1. */
const PARTIAL_SHARE = 0.5

/** The incident mutation score, in percent, a concept needs to be proved; below it the concept is understood or applied, never proved. */
export const PROVED_MUTATION_SCORE = 80

/** The levels of an attempt that raises nothing: a stored answer that is not graded yet, or a diagnostic. */
export const NO_OUTCOME_LEVELS: OutcomeLevels = { understood: 0, proved: 0 }

const strengthOf = (result: AttemptResult): number => {
    const share = result.maxScore === 0 ? 0 : result.score / result.maxScore
    if (share >= FULL_SHARE) return 2
    return share >= PARTIAL_SHARE ? 1 : 0
}

/**
 * The levels one graded attempt gives to the outcomes its activity trains. A diagnostic gives none, because it does not count
 * toward passing. An attempt shows understanding or application only: an apply exercise scoring 80% or more reaches the level
 * below proved, never proved itself, because proof needs the incident mutation score (`provedLevelOf`).
 */
export const levelsOf = (result: AttemptResult): OutcomeLevels => {
    if (result.isDiagnostic) return NO_OUTCOME_LEVELS
    return { understood: strengthOf(result), proved: 0 }
}

/**
 * The proved level a concept earns from the mutation score of its incident run: 2 when a score exists and meets
 * `PROVED_MUTATION_SCORE`, else 0. No score, as before any incident run, proves nothing.
 */
export const provedLevelOf = (mutationScore: number | null): number =>
    mutationScore !== null && mutationScore >= PROVED_MUTATION_SCORE ? 2 : 0
