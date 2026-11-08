import { LessonAttemptEntity } from "./entities/lesson-attempt.entity"
import { LessonOutcomeLevelEntity } from "./entities/lesson-outcome-level.entity"
import { InitAttempt1795000000100 } from "./migrations/1795000000100-init-attempt"

/** The entities of the attempt capability. */
export const attemptEntities: Array<typeof LessonAttemptEntity | typeof LessonOutcomeLevelEntity> = [
    LessonAttemptEntity,
    LessonOutcomeLevelEntity,
]

/** The migrations of the attempt capability, in the order they run. */
export const attemptMigrations: Array<typeof InitAttempt1795000000100> = [InitAttempt1795000000100]
