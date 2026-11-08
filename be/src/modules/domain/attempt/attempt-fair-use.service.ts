import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { DEFAULT_DAILY_GRADING_LIMIT } from "./attempt.config"
import { InjectAttemptOptions } from "./attempt.decorators"
import type { AttemptOptions } from "./attempt.options"
import { COUNT_COACH_GRADINGS } from "./persistence/attempt.sql"

@Injectable()
/** The fair-use cap of the AI coach: a learner gets a fixed number of coach gradings per UTC day and sees no credits. */
export class AttemptFairUseService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectAttemptOptions() private readonly options: AttemptOptions,
    ) {}

    /**
     * Whether the learner may have one more written answer graded: fewer graded since the start of the UTC day than the limit
     * (the app's `dailyGradingLimit`, else 100). Only graded answers count, so a failed grading never costs the learner a turn.
     */
    async isWithinDailyLimit(learnerId: string): Promise<boolean> {
        const now = this.clock.now()
        const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
        const rows: Array<{ gradings: number }> = await this.entityManager.query(COUNT_COACH_GRADINGS, [
            learnerId,
            dayStart,
        ])
        return (rows[0]?.gradings ?? 0) < (this.options.dailyGradingLimit ?? DEFAULT_DAILY_GRADING_LIMIT)
    }
}
