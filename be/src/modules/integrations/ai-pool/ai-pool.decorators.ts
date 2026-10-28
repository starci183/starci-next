import { AiRouterService } from "@starci/ai-router"
import { injector } from "@modules/platform/composition"
import type { TypedParameterDecorator } from "@modules/platform/composition"
import type { LessonAi } from "./lesson-ai.port"

/** DI token for the guarded lesson-only AI capability. */
export const LESSON_AI: unique symbol = Symbol("integrations.ai-pool.lesson-ai")

/** Injects the guarded lesson AI capability. Parameter type: LessonAi. */
export const InjectLessonAi = (): TypedParameterDecorator<LessonAi> => injector<LessonAi>(LESSON_AI)

/** Injects the package router the pool guards. Parameter type: AiRouterService. */
export const InjectLessonRouter = (): TypedParameterDecorator<AiRouterService<"lesson">> =>
    injector<AiRouterService<"lesson">>(AiRouterService)
