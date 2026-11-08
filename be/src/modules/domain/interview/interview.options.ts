import type { Type } from "@nestjs/common"
import type { InterviewCoach } from "./interview-coach.port"
import type { ScoringRules } from "./scoring.policy"
import type { PoolMode } from "./track.policy"

/** The settings of the interview that the owner may tune without code; every one has the value the research proposed. */
export interface InterviewSettings {
    /** How many free sessions a learner gets per calendar month (Asia/Ho_Chi_Minh). */
    readonly freeSessionsPerMonth: number
    /** How many questions a free session has. */
    readonly freeLength: number
    /** How many questions a Premium session has. */
    readonly premiumLength: number
    /** How many AI calls (interviewer replies and gradings) one learner may cause per UTC day. */
    readonly dailyAiLimit: number
    /** Minutes without an answer after which an active session is abandoned. */
    readonly idleMinutes: number
    /** Which pool of banks the tracks draw from. */
    readonly pool: PoolMode
    /** The numbers behind the scores and the verdict. */
    readonly scoring: ScoringRules
}

/** Options of the interview capability. */
export interface InterviewOptions extends Partial<InterviewSettings> {
    /** Whether this capability is available app-wide. */
    readonly isGlobal?: boolean
    /** The coach that asks and grades; absent, the interview starts and saves answers but the AI steps fail with INTERVIEW_COACH_UNCONFIGURED. */
    readonly coach?: Type<InterviewCoach>
}
