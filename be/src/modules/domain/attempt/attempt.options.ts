import type { Type } from "@nestjs/common"
import type { AttemptCoach } from "./attempt-coach.port"

/** Options of the attempt capability. */
export interface AttemptOptions {
    /** Whether this capability is available app-wide. */
    readonly isGlobal?: boolean
    /** The coach that grades written answers; absent, written answers are saved and fail with ATTEMPT_COACH_UNCONFIGURED. */
    readonly coach?: Type<AttemptCoach>
    /** How many written answers one learner may have graded by the coach per UTC day; absent, 100. */
    readonly dailyGradingLimit?: number
}
