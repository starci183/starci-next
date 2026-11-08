import type { InterviewLocale } from "@modules/domain/interview"

/** Reads the tracks, the live banks, the access of the learner and the session in progress. */
export interface GetInterviewOptionsRequest {
    /** The locale. */
    readonly locale: InterviewLocale
    /** The track. */
    readonly track: string | null
}
