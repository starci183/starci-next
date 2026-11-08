import type { InterviewTier } from "@modules/domain/interview"

/** Reads the hiring readiness at a track and tier: ready when both pillars passed. */
export interface GetInterviewReadinessRequest {
    /** The track. */
    readonly track: string
    /** The tier. */
    readonly tier: InterviewTier
}
