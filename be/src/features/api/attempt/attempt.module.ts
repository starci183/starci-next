import { Module } from "@nestjs/common"
import { ClaimGuestProgressHandler } from "./application/claim-guest-progress.handler"
import { GetLessonAttemptHandler } from "./application/get-lesson-attempt.handler"
import { GetLessonProgressHandler } from "./application/get-lesson-progress.handler"
import { GetLessonOpenerScoresHandler } from "./application/get-lesson-opener-scores.handler"
import { GradeGuestOpenerHandler } from "./application/grade-guest-opener.handler"
import { MarkLessonSectionReadHandler } from "./application/mark-lesson-section-read.handler"
import { RevealLessonHintHandler } from "./application/reveal-lesson-hint.handler"
import { SaveLessonSimulationHandler } from "./application/save-lesson-simulation.handler"
import { SubmitLessonAttemptHandler } from "./application/submit-lesson-attempt.handler"
import { ConfigurableModuleClass } from "./attempt.module-definition"

@Module({
    providers: [
        SubmitLessonAttemptHandler,
        GetLessonAttemptHandler,
        GetLessonProgressHandler,
        GetLessonOpenerScoresHandler,
        SaveLessonSimulationHandler,
        RevealLessonHintHandler,
        MarkLessonSectionReadHandler,
        GradeGuestOpenerHandler,
        ClaimGuestProgressHandler,
    ],
})
/** Application handlers of the attempt feature: submitting an answer, reading an attempt and reading the progress of a lesson. */
export class AttemptApiModule extends ConfigurableModuleClass {}
