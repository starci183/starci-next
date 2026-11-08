import { StreakActionEntity } from "./entities/streak-action.entity"
import { StreakStateEntity } from "./entities/streak-state.entity"
import { InitStreak1796300000000 } from "./migrations/1796300000000-init-streak"

/** The entities of the streak capability. */
export const streakEntities: Array<typeof StreakActionEntity | typeof StreakStateEntity> = [
    StreakActionEntity,
    StreakStateEntity,
]

/** The migrations of the streak capability, in the order they run. */
export const streakMigrations: Array<typeof InitStreak1796300000000> = [InitStreak1796300000000]
