import { LessonContentGradingEntity, LessonContentVersionEntity } from "./entities/lesson-content.entity"
import { InitLessonContent1790000000001 } from "./migrations/1790000000001-init-lesson-content"

/** The entities of the lesson-content capability, for the connection that holds them. */
export const lessonContentEntities = [LessonContentVersionEntity, LessonContentGradingEntity]

/** The migrations of the lesson-content capability, in the order they run. */
export const lessonContentMigrations = [InitLessonContent1790000000001]
