/**
 * The practice capability (Luyen code).
 *
 * `PracticeImportService` stores the teacher's problem folders as immutable versions; `PracticeReadService` serves the patterns,
 * the problems and the readiness (hidden tests and solutions never leave the server); `PracticeSubmissionService` runs (the
 * public example) and submits (every test) through the Judge0 gateway behind a bounded queue and a per-learner rate limit;
 * `PracticeHintService` opens the three hint steps in order. Without Premium each pattern opens its first
 * `freePerPattern` problems (1 by default). A graded submit is announced to the streak through `PracticeStreakPort`
 * (`StreakServiceClient` over `StreakService.recordStreakAction`, shard `practice`, kind `graded-attempt`, once per submission).
 */
export { PRACTICE_ERROR_KINDS } from "./errors/practice.error"
export { PRACTICE_MESSAGES } from "./messages/practice.messages"
export { parsePracticeConfig } from "./practice.config"
export { PracticeHintService } from "./practice-hint.service"
export { PracticeImportService } from "./practice-import.service"
export { PracticeModule } from "./practice.module"
export { PracticeReadService } from "./practice-read.service"
export { PracticeSubmissionService } from "./practice-submission.service"
export { toProblemItemWires, toProblemWire, toSubmissionWire } from "./practice-wire.mapper"
export { StreakServiceClient } from "./practice-streak.client"
export { practiceEntities, practiceMigrations } from "./persistence/connection"
export type {
    PracticeContent,
    PracticeDifficulty,
    PracticeHintText,
    PracticeLanguage,
    PracticeLocale,
    PracticePatternView,
    PracticeProblemItemView,
    PracticeProblemView,
    PracticeReadinessView,
    PracticeSourceFile,
    PracticeSubmissionView,
} from "./practice.contracts"
