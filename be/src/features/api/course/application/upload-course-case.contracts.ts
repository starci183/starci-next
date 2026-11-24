import type { CaseEventMutation } from "@modules/platform/relay-protocol"

/** One case upload of a paired device: the learner the device token proved and the upload input, still to be read with the relay protocol's schema. */
export interface UploadCourseCaseRequest {
    /** The learner the device belongs to. */
    readonly learnerId: string
    /** The upload mutation that carried the input (`relayLabCaseResult`, `relayLabCaseHint` or `relayLabCaseReset`). */
    readonly mutation: CaseEventMutation
    /** The mutation's input: the queue envelope (`eventId`, `taskId`) and the event's fields. */
    readonly input: Readonly<Record<string, unknown>>
}

/** What an upload answers: the client event id and that it is stored (a resend included). */
export interface CourseCaseUpload {
    /** The client event id. */
    readonly eventId: string
    /** True once stored, a resend included. */
    readonly accepted: boolean
}
