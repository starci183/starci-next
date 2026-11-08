import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { LessonTopicCatalog } from "./lesson-topic.contracts"

/** Token of the topic catalog the import places lessons with. */
export const LESSON_TOPIC_CATALOG: unique symbol = Symbol("domain.lesson.topic-catalog")

/** Injects the topic catalog. Parameter type: LessonTopicCatalog. */
export const InjectLessonTopicCatalog = (): TypedParameterDecorator<LessonTopicCatalog> =>
    injector<LessonTopicCatalog>(LESSON_TOPIC_CATALOG)
