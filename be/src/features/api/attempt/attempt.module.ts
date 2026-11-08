import { Module } from "@nestjs/common"
import { GetLessonAttemptHandler } from "./application/get-lesson-attempt.handler"
import { GetLessonProgressHandler } from "./application/get-lesson-progress.handler"
import { SubmitLessonAttemptHandler } from "./application/submit-lesson-attempt.handler"
import { ConfigurableModuleClass } from "./attempt.module-definition"

@Module({ providers: [SubmitLessonAttemptHandler, GetLessonAttemptHandler, GetLessonProgressHandler] })
/** Application handlers of the attempt feature: submitting an answer, reading an attempt and reading the progress of a lesson. */
export class AttemptApiModule extends ConfigurableModuleClass {}
