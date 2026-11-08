/** One prompt to complete: the instructions, the quoted data and the opaque id of the request. */
export interface AiGatewayRequest {
    /** An opaque id that names no learner; the provider sees it as the idempotency key. */
    readonly requestId: string
    /** The instructions of the model. */
    readonly system: string
    /** The data the instructions work on, already delimited by the caller. */
    readonly user: string
    /** The deadline of the whole completion in milliseconds, retries and fallbacks included. */
    readonly timeoutMs: number
    /** The routing profile; the coach profile when absent. */
    readonly profile?: "coach" | "interview"
    /** The most tokens this completion may produce; the pool ceiling when absent. */
    readonly maxOutputTokens?: number
}

/** What the model answered. */
export interface AiGatewayReply {
    /** The text of the first choice; never empty. */
    readonly text: string
    /** The configured model id that answered. */
    readonly model: string
    /** True when a fallback model answered instead of the one the profile prefers. */
    readonly usedFallback: boolean
}

/** The AI gateway: completes one prompt as a JSON object through the provider pool. Fails with an `AiGatewayError`. */
export interface AiGateway {
    /** Completes the prompt and answers the text of the model. */
    complete(request: AiGatewayRequest): Promise<AiGatewayReply>
}
