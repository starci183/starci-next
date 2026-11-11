import { LessonAttemptEntity } from "./entities/lesson-attempt.entity"
import { LessonCompletionEntity } from "./entities/lesson-completion.entity"
import { LessonIncidentScoreEntity } from "./entities/lesson-incident-score.entity"
import { LessonOutcomeLevelEntity } from "./entities/lesson-outcome-level.entity"
import { LessonSimulationProgressEntity } from "./entities/lesson-simulation-progress.entity"
import { InitAttempt1795000000100 } from "./migrations/1795000000100-init-attempt"
import { IncidentMutationScore1798100000000 } from "./migrations/1798100000000-incident-mutation-score"
import { LessonCompletionSimulation1798200000000 } from "./migrations/1798200000000-lesson-completion-simulation"

/** The entities of the attempt capability. */
export const attemptEntities: Array<
    | typeof LessonAttemptEntity
    | typeof LessonCompletionEntity
    | typeof LessonIncidentScoreEntity
    | typeof LessonOutcomeLevelEntity
    | typeof LessonSimulationProgressEntity
> = [
    LessonAttemptEntity,
    LessonOutcomeLevelEntity,
    LessonIncidentScoreEntity,
    LessonCompletionEntity,
    LessonSimulationProgressEntity,
]

/** The migrations of the attempt capability, in the order they run. */
export const attemptMigrations: Array<
    | typeof IncidentMutationScore1798100000000
    | typeof InitAttempt1795000000100
    | typeof LessonCompletionSimulation1798200000000
> = [InitAttempt1795000000100, IncidentMutationScore1798100000000, LessonCompletionSimulation1798200000000]
