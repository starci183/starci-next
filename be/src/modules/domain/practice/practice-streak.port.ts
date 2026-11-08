import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { PracticeStreakAction } from "./practice.contracts"

/**
 * The port through which a graded attempt is announced to the streak of the hub. The streak capability owns the streak
 * (`StreakService.recordStreakAction`); practice only says that a graded attempt happened. The app binds
 * `StreakServiceClient`, the adapter over it; an app without the streak binds the no-op client.
 */
export interface PracticeStreakPort {
    /** Records that the learner made a graded attempt in the practice shard. */
    recordStreakAction(action: PracticeStreakAction): Promise<void>
}

/** Token of the streak port. */
export const PRACTICE_STREAK: unique symbol = Symbol("domain.practice.streak")

/** Injects the streak port. Parameter type: PracticeStreakPort. */
export const InjectPracticeStreak = (): TypedParameterDecorator<PracticeStreakPort> =>
    injector<PracticeStreakPort>(PRACTICE_STREAK)
