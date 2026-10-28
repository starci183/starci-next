import { injector } from "@modules/platform/composition"
import type { TypedParameterDecorator } from "@modules/platform/composition"
import type { LessonContentService } from "./lesson-content.service"

/** Token of the LessonContentService of this capability, for the capabilities that use it. */
export const LESSON_CONTENT_SERVICE: unique symbol = Symbol("domain.lesson-content.service")

/** Injects the LessonContentService. Parameter type: LessonContentService. */
export const InjectLessonContentService = (): TypedParameterDecorator<LessonContentService> =>
    injector<LessonContentService>(LESSON_CONTENT_SERVICE)
