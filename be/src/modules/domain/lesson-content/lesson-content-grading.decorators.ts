import { injector } from "@modules/platform/composition"
import type { TypedParameterDecorator } from "@modules/platform/composition"
import type { LessonContentGradingService } from "./lesson-content-grading.service"

/** Token of the server-only grading reader for domain consumers. */
export const LESSON_CONTENT_GRADING_SERVICE: unique symbol = Symbol("domain.lesson-content.grading-service")

/** Injects the protected grading reader. Parameter type: LessonContentGradingService. */
export const InjectLessonContentGradingService = (): TypedParameterDecorator<LessonContentGradingService> =>
    injector<LessonContentGradingService>(LESSON_CONTENT_GRADING_SERVICE)
