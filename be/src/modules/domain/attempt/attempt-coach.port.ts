import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { CoachGrade, CoachGradeRequest } from "./attempt.contracts"

/**
 * The coach: the AI teacher that grades one written answer against its rubric. An object, not a bare function, so a unit
 * spec doubles it with `mock<AttemptCoach>()`. An implementation honours `timeoutMs`, sends the provider nothing that names
 * a learner, and fails with an `AttemptError`.
 */
export interface AttemptCoach {
    /** Grades the answer per rubric criterion; the answer is quoted data for the provider, never instructions. */
    grade(request: CoachGradeRequest): Promise<CoachGrade>
}

/** Token of the coach. */
export const ATTEMPT_COACH: unique symbol = Symbol("domain.attempt.coach")

/** Injects the coach. Parameter type: AttemptCoach. */
export const InjectAttemptCoach = (): TypedParameterDecorator<AttemptCoach> => injector<AttemptCoach>(ATTEMPT_COACH)
