/** Structured, content-free telemetry event identities for this integration. */
export enum AiPoolLogEvent {
    /** One content-free router attempt completed. */
    AttemptRecorded = "ai_pool.attempt_recorded",
    /** A routed lesson request completed. */
    RequestCompleted = "ai_pool.request_completed",
    /** A routed lesson request failed. */
    RequestFailed = "ai_pool.request_failed",
}
