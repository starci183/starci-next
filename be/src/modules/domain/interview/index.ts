/**
 * The mock interview capability.
 *
 * A learner starts a session on an outcome track and tier; the questions are drawn once from the teacher's published banks and fixed.
 * `InterviewTurnService` stores every candidate turn first, then asks the interviewer (a follow-up, a probe, or the next question; at
 * most two follow-ups per question). Nothing used for grading (ideal answer, rubric, checklist, keywords, samples) reaches the
 * browser or the interviewer. `InterviewGradingService.submit` grades the whole session once through the coach; the server computes
 * every score. Without Premium a learner gets `freeSessionsPerMonth` short sessions a month from the questions the teacher left free.
 * The coach is a port the app binds with `InterviewModule.register({ coach })`; without one the AI steps fail with
 * INTERVIEW_COACH_UNCONFIGURED and the answers stay saved.
 *
 * Hiring readiness for the profile and hiring layer: `InterviewHistoryService.readiness(learnerId, track, tier)` (a pass on both
 * pillars at a tier) and `.evidence(learnerId)`. A submitted session reports `StreakService.recordStreakAction(learner, "interview",
 * "interview-submitted", { actionId: sessionId })`.
 */
export { INTERVIEW_ERROR_KINDS } from "./errors/interview.error"
export { INTERVIEW_MESSAGES } from "./messages/interview.messages"
export { AiInterviewClient } from "./ai-interview.client"
export { parseInterviewConfig } from "./interview.config"
export { InterviewModule } from "./interview.module"
export { InterviewCalibrationService } from "./interview-calibration.service"
export { InterviewCatalogService } from "./interview-catalog.service"
export { InterviewGradingService } from "./interview-grading.service"
export { InterviewHistoryService } from "./interview-history.service"
export { InterviewImportService } from "./interview-import.service"
export { toModuleLessons } from "./interview-session.mapper"
export { InterviewSessionService } from "./interview-session.service"
export { InterviewTurnService } from "./interview-turn.service"
export type { HintView } from "./interview-turn.service"
export { interviewEntities, interviewMigrations } from "./persistence/connection"
export type {
    AbandonView,
    AnswerView,
    BankDraft,
    EvidenceItem,
    GradedQuestion,
    GradingMaterial,
    GradingView,
    HistoryView,
    InterviewLocale,
    InterviewOptionsView,
    InterviewSourceFile,
    InterviewTier,
    QuestionDraft,
    ReadinessView,
    SessionQuestion,
    SessionView,
    QuestionPublicRow,
    SessionRow,
    TurnRow,
} from "./interview.contracts"
