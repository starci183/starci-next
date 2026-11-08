import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Codes of the agent lab capability. */
export enum AgentLabErrorCode {
    /** No track has this id. */
    TrackNotFound = "AGENT_LAB_TRACK_NOT_FOUND",
    /** The learner used every model call of the day on the proxy key; the lab stops until the next UTC day. */
    QuotaExhausted = "AGENT_LAB_QUOTA_EXHAUSTED",
    /** The daily limit the environment names is not a whole number of calls from 0 up. */
    ConfigInvalid = "AGENT_LAB_CONFIG_INVALID",
}

/** How each agent lab code travels. */
export const AGENT_LAB_ERROR_KINDS: Record<AgentLabErrorCode, ErrorKind> = {
    [AgentLabErrorCode.TrackNotFound]: "not-found",
    [AgentLabErrorCode.QuotaExhausted]: "rate-limited",
    [AgentLabErrorCode.ConfigInvalid]: "internal",
}

/** The one error class of the agent lab capability. */
export class AgentLabError extends DomainError<AgentLabErrorCode> {}
