import type { PoolConfig } from "@starci/ai-router"

/** Immutable runtime guardrails for lesson requests. */
export interface AiPoolLimits {
    /** The positive output-token ceiling applied to every unary and stream call. */
    readonly maxOutputTokens: number
    /** Tokens reserved for the prompt around the grounding when it is measured against the model window. */
    readonly reservedPromptTokens: number
}

/** The typed pool boundary consumed by the configured module. */
export interface AiPoolOptions {
    /** The data-only router pool: providers, key references, models and the lesson profile. */
    readonly pool: PoolConfig<"lesson">
    /** The guardrails the lesson port enforces before the router is called. */
    readonly limits: AiPoolLimits
}
