/** Content-free telemetry event identities of the AI gateway: ids, providers, models, timings and outcomes, never a prompt or an answer. */
export enum AiGatewayLogEvent {
    /** One attempt of the pool against a provider key and model finished. */
    AttemptRecorded = "ai_gateway.attempt_recorded",
    /** A completion failed after the pool exhausted its keys, models and deadline. */
    CompletionFailed = "ai_gateway.completion_failed",
}
