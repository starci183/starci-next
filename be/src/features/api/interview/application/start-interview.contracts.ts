import type { InterviewLocale, InterviewTier } from "@modules/domain/interview"

/** Starts a session: the quota is checked, the questions are drawn and the first prompt is stored. It makes no AI call. */
export interface StartInterviewRequest {
    /** The track. */
    readonly track: string
    /** The bankIds. */
    readonly bankIds: ReadonlyArray<string> | null
    /** The tier. */
    readonly tier: InterviewTier
    /** The locale. */
    readonly locale: InterviewLocale
    /** The language. */
    readonly language: string | null
    /** The clientRequestId. */
    readonly clientRequestId: string
}
