import { StreakActionEntity } from "./entities/streak-action.entity"
import { StreakStateEntity } from "./entities/streak-state.entity"
import { InitStreak1796300000000 } from "./migrations/1796300000000-init-streak"
import { DropRetiredInterviewAgentLab1798600000000 } from "./migrations/1798600000000-drop-retired-interview-agent-lab"

/** The entities of the streak capability. */
export const streakEntities: Array<typeof StreakActionEntity | typeof StreakStateEntity> = [
    StreakActionEntity,
    StreakStateEntity,
]

/**
 * The migrations of the streak capability, in the order they run. The last one drops the tables of the retired mock interview
 * and agent lab, which have no owner left.
 */
export const streakMigrations: Array<
    typeof InitStreak1796300000000 | typeof DropRetiredInterviewAgentLab1798600000000
> = [InitStreak1796300000000, DropRetiredInterviewAgentLab1798600000000]
