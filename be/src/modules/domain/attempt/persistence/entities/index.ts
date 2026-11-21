import { LessonAttemptEntity } from "./lesson-attempt.entity"
import { LessonCompletionEntity } from "./lesson-completion.entity"
import { LessonHintUseEntity } from "./lesson-hint-use.entity"
import { LessonIncidentScoreEntity } from "./lesson-incident-score.entity"
import { LessonOutcomeLevelEntity } from "./lesson-outcome-level.entity"
import { LessonSectionReadEntity } from "./lesson-section-read.entity"
import { LessonSimulationProgressEntity } from "./lesson-simulation-progress.entity"

export {
    LessonAttemptEntity,
    LessonCompletionEntity,
    LessonHintUseEntity,
    LessonIncidentScoreEntity,
    LessonOutcomeLevelEntity,
    LessonSectionReadEntity,
    LessonSimulationProgressEntity,
}

/** The entities of the attempt capability, named in PRIMARY_ENTITIES of platform/database/entities.ts. */
export const attemptEntities: ReadonlyArray<new () => object> = [
    LessonAttemptEntity,
    LessonOutcomeLevelEntity,
    LessonIncidentScoreEntity,
    LessonCompletionEntity,
    LessonSimulationProgressEntity,
    LessonHintUseEntity,
    LessonSectionReadEntity,
]
