import { StreakActionEntity } from "./streak-action.entity"
import { StreakStateEntity } from "./streak-state.entity"

export { StreakActionEntity, StreakStateEntity }

/** The entities of the streak capability, named in PRIMARY_ENTITIES of platform/database/entities.ts. */
export const streakEntities: ReadonlyArray<new () => object> = [StreakActionEntity, StreakStateEntity]
