import type { PoolConfig } from "@starci/ai-router"

/** The routing profiles the gateway calls: the coach of lesson answers and the interview grader. */
export type AiGatewayProfile = "coach" | "interview"

/** The declared AI pool this instance completes prompts through. */
export interface AiGatewayOptions {
    /** The provider pool: one OpenRouter provider, its key resolved from custody at each attempt, the models and the coach profile. */
    readonly pool: PoolConfig<AiGatewayProfile>
    /** The most tokens one completion may produce. */
    readonly maxOutputTokens: number
}

/** What the app root hands the AI gateway capability. */
export interface AiGatewayModuleOptions {
    /** Whether this capability is available app-wide; only an app composition root may pass `true`. */
    readonly isGlobal?: boolean
    /** The declared pool; `null` still composes the gateway so every completion refuses with AI_GATEWAY_NOT_CONFIGURED. */
    readonly gateway: AiGatewayOptions | null
}
