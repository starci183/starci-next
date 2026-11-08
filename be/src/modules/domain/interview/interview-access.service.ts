import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectEntitlementService, type EntitlementService } from "@modules/domain/entitlement"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { freeMonthOf, nextResetOf, utcDayStartOf } from "./calendar.policy"
import { InterviewError, InterviewErrorCode } from "./errors/interview.error"
import { InjectInterviewResolvedOptions } from "./interview.decorators"
import type { InterviewAccessView } from "./interview.contracts"
import type { InterviewSettings } from "./interview.options"
import type { CountRow } from "./persistence/interview.rows"
import { COUNT_AI_CALLS, COUNT_FREE_SESSIONS } from "./persistence/interview.sql"

/** What a learner may do now, with the month the free session counts in. */
export interface InterviewAccess extends InterviewAccessView {
    /** The free-quota month, `YYYY-MM` in Asia/Ho_Chi_Minh. */
    readonly freeMonth: string
}

@Injectable()
/**
 * The two gates of the interview: Premium or the free quota of the month decides whether a session may start, and the fair-use cap
 * decides whether another AI call may be made today. A learner is never shown credits; the cap is a server-side bound only.
 */
export class InterviewAccessService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectEntitlementService() private readonly entitlement: EntitlementService,
        @InjectInterviewResolvedOptions() private readonly settings: InterviewSettings,
    ) {}

    /** Premium or not, the free sessions left this month, when they reset, and the length of the learner's sessions. */
    async accessOf(learnerId: string, manager: EntityManager = this.entityManager): Promise<InterviewAccess> {
        const now = this.clock.now()
        const freeMonth = freeMonthOf(now)
        const isPremium = await this.entitlement.isPremium(learnerId)
        const used: Array<CountRow> = await manager.query(COUNT_FREE_SESSIONS, [learnerId, freeMonth])
        return {
            isPremium,
            freeSessionsLeftThisMonth: Math.max(0, this.settings.freeSessionsPerMonth - (used[0]?.count ?? 0)),
            resetsAt: nextResetOf(now).toISOString(),
            length: isPremium ? this.settings.premiumLength : this.settings.freeLength,
            freeMonth,
        }
    }

    /** Refuses with INTERVIEW_AI_LIMIT_REACHED once the learner caused as many AI calls today as the cap allows. */
    async requireAiBudget(learnerId: string): Promise<void> {
        const rows: Array<CountRow> = await this.entityManager.query(COUNT_AI_CALLS, [
            learnerId,
            utcDayStartOf(this.clock.now()),
        ])
        if ((rows[0]?.count ?? 0) >= this.settings.dailyAiLimit) {
            throw new InterviewError({ code: InterviewErrorCode.AiLimitReached })
        }
    }
}
