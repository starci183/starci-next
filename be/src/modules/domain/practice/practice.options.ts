import type { Type } from "@nestjs/common"
import type { PracticeStreakPort } from "./practice-streak.port"

/** Options of the practice capability. */
export interface PracticeOptions {
    /** Whether this capability is available app-wide. */
    readonly isGlobal?: boolean
    /** The streak port a graded attempt is announced to; absent, the announcement goes nowhere. */
    readonly streak?: Type<PracticeStreakPort>
    /** How many problems of each pattern a learner without Premium may open; absent, 1. */
    readonly freePerPattern?: number
    /** How many submissions are judged at the same time on this instance; absent, 4. */
    readonly concurrency?: number
    /** How many submissions one learner may send per minute; absent, 10. */
    readonly submissionsPerMinute?: number
    /** The largest source a submission may carry in bytes; absent, 65536. */
    readonly maxSourceBytes?: number
    /** How long a run or submit waits for its verdict before answering a submission still running, in milliseconds; absent, 25000. */
    readonly waitMs?: number
}
