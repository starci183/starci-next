/**
 * The lesson attempts capability.
 *
 * `AttemptService.submit` stores the answer of a learner to a lesson activity once per revision, grades a choice and a
 * simulation on the spot and a written answer through the coach, and raises the outcome levels of the graded attempts;
 * `AttemptReadService` serves an attempt and the progress of a learner in a lesson. The coach is a port the app binds with
 * `AttemptModule.register({ coach })` (the app passes `AiCoachClient` when the AI pool is configured); without one a written answer
 * is saved and fails with ATTEMPT_COACH_UNCONFIGURED. A learner gets at most `dailyGradingLimit` coach gradings per UTC day (100 by default),
 * and the next one fails with ATTEMPT_COACH_LIMIT_REACHED with the answer saved. A graded attempt raises `understood` only; an outcome is
 * proved only by `AttemptProofService.recordMutationScore` (exported by `AttemptModule`), which keeps the best incident mutation score of a learner in a lesson and
 * proves the outcomes they fully understood when it reaches 80%.
 */
export { ATTEMPT_ERROR_KINDS, AttemptError, AttemptErrorCode } from "./errors/attempt.error"
export { ATTEMPT_MESSAGES } from "./messages/attempt.messages"
export { AiCoachClient } from "./ai-coach.client"
export { parseAttemptConfig } from "./attempt.config"
export { AttemptModule } from "./attempt.module"
export { AttemptReadService } from "./attempt-read.service"
export { AttemptService } from "./attempt.service"
export { AttemptSimulationService } from "./attempt-simulation.service"
export { attemptEntities, attemptMigrations } from "./persistence/connection"
export type {
    AttemptAnswer,
    AttemptKind,
    AttemptResult,
    AttemptStatus,
    AttemptView,
    CoachGrade,
    CoachGradeRequest,
    LessonProgressView,
    SimulationProgressView,
    StoredAttemptResult,
} from "./attempt.contracts"
