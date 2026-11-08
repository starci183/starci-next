/** The stable error code a door answers when the plan of the signed-in reader does not include what they asked for (contract.essentials.api). */
const PREMIUM_REQUIRED_CODE = "LESSON_PREMIUM_REQUIRED"

/** A GraphQL refusal: the status the back end named, the stable error code (`extensions.code`) and how it travels (`extensions.kind`), if any. */
export class ApiFailure extends Error {
    /** The HTTP status; 0 when the request never got an answer. */
    readonly status: number
    /** The stable error code of the body, or undefined when the body carried none. */
    readonly code: string | undefined
    /** How the refusal travels (`unauthenticated`, `forbidden`, ...), or undefined when the answer carried none. */
    readonly kind: string | undefined

    constructor(status: number, code: string | undefined, kind?: string) {
        super(code ?? `request failed with status ${status}`)
        this.name = "ApiFailure"
        this.status = status
        this.code = code
        this.kind = kind
    }
}

/** The stable code a topic read answers when the segment names no topic. */
const TOPIC_NOT_FOUND_CODE = "LESSON_TOPIC_NOT_FOUND"

/** True when the failure says the topic does not exist (an old link may carry a lesson id there). */
export const isTopicNotFound = (error: unknown): boolean =>
    error instanceof ApiFailure && error.code === TOPIC_NOT_FOUND_CODE

/** The stable code a track read answers when the segment names no tool track of the agent lab. */
const AGENT_TRACK_NOT_FOUND_CODE = "AGENT_LAB_TRACK_NOT_FOUND"

/** True when the failure says the agent lab has no such track. */
export const isAgentTrackNotFound = (error: unknown): boolean =>
    error instanceof ApiFailure && error.code === AGENT_TRACK_NOT_FOUND_CODE

/** The stable code of an attempt whose revision already holds another answer. */
const REVISION_CONFLICT_CODE = "ATTEMPT_REVISION_CONFLICT"

/** True when the revision was already used by a different answer: bump it and send again. */
export const isRevisionConflict = (error: unknown): boolean =>
    error instanceof ApiFailure && error.code === REVISION_CONFLICT_CODE

/** True when the failure asks for Premium. It branches on the stable code and never on the status. */
export const isPremiumRequired = (error: unknown): boolean =>
    error instanceof ApiFailure && error.code === PREMIUM_REQUIRED_CODE

/** True when the back end refused the read to this reader (kind `forbidden`, or the Premium code): the slot draws its forbidden status. */
export const isForbidden = (error: unknown): boolean =>
    isPremiumRequired(error) || (error instanceof ApiFailure && error.kind === "forbidden")

/** The stable code every door answers when the request carries no valid session (contract.identity.session-contract). */
const SESSION_REQUIRED_CODE = "IDENTITY_SESSION_REQUIRED"

/** True when the failure says the reader has no valid session: the stable code or the kind `unauthenticated`, never the status. */
export const isUnauthenticated = (error: unknown): boolean =>
    error instanceof ApiFailure && (error.code === SESSION_REQUIRED_CODE || error.kind === "unauthenticated")
