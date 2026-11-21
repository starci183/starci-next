import { LessonTopicEntity } from "./lesson-topic.entity"
import { LessonVersionEntity } from "./lesson-version.entity"

export { LessonTopicEntity, LessonVersionEntity }

/** The entities of the lesson capability, named in PRIMARY_ENTITIES of platform/database/entities.ts. */
export const lessonEntities: ReadonlyArray<new () => object> = [LessonVersionEntity, LessonTopicEntity]
