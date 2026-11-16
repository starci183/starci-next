import type { EnvSource } from "@modules/platform/config"
import { AiGatewayError, AiGatewayErrorCode } from "./errors/ai-gateway.error"
import type { AiGatewayOptions } from "./ai-gateway.options"

/** The OpenRouter API every deployment calls unless it points at a compatible endpoint. */
const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1"

/** Every AI call uses deepseek-v4.1-flash (the owner's rule, 2026-11-09); a fallback equal to the model means no fallback. The owner names others with the environment. */
const DEFAULT_MODEL = "deepseek/deepseek-v4.1-flash"
const DEFAULT_FALLBACK_MODEL = DEFAULT_MODEL

/** The tokens one grading may produce: a level and a quote for each of a handful of criteria. */
const DEFAULT_MAX_OUTPUT_TOKENS = 2048

/** One attempt of a call and the whole call, in milliseconds; the grading deadline of the attempt capability is 60 s. */
const ATTEMPT_TIMEOUT_MS = 30_000
const CALL_DEADLINE_MS = 60_000
const MAX_ATTEMPTS = 3

/** The environment key of the upstream OpenRouter key, held by this gateway alone (tests seed it through this name). */
export const AI_GATEWAY_KEY_ENV = "OPENROUTER_API_KEY"

/** The environment keys that declare the OpenRouter key: their presence is what makes the gateway declared. */
const KEY_VARIABLES: ReadonlyArray<string> = [AI_GATEWAY_KEY_ENV, `${AI_GATEWAY_KEY_ENV}_FILE`]

const invalid = (key: string): AiGatewayError =>
    new AiGatewayError({ code: AiGatewayErrorCode.ConfigInvalid, params: { key } })

const modelOf = (env: EnvSource, key: string, fallback: string): string => {
    const model = env.optional(key) ?? fallback
    if (/\s/u.test(model)) throw invalid(key)
    return model
}

/**
 * Reads the AI gateway of an environment source. No declared OpenRouter key answers `null` (this instance has no AI pool);
 * a declared key is read as a `Secret` (its `_FILE` companion works) and resolved at each attempt, so a rotated key needs
 * no restart. The models, the endpoint and the output ceiling are non-secret settings with defaults.
 */
export const parseAiGatewayConfig = (env: EnvSource): AiGatewayOptions | null => {
    if (!env.anyDeclared(KEY_VARIABLES)) return null
    const key = env.secret(AI_GATEWAY_KEY_ENV)
    const model = modelOf(env, "AI_GATEWAY_MODEL", DEFAULT_MODEL)
    const fallback = modelOf(env, "AI_GATEWAY_FALLBACK_MODEL", DEFAULT_FALLBACK_MODEL)
    const maxOutputTokens = env.int("AI_GATEWAY_MAX_OUTPUT_TOKENS", DEFAULT_MAX_OUTPUT_TOKENS)
    if (maxOutputTokens <= 0) throw invalid("AI_GATEWAY_MAX_OUTPUT_TOKENS")
    const models = fallback === model ? [model] : [model, fallback]
    return {
        maxOutputTokens,
        pool: {
            providers: [
                {
                    id: "openrouter",
                    kind: "openrouter",
                    baseUrl: env.optional("AI_GATEWAY_BASE_URL") ?? DEFAULT_BASE_URL,
                    keys: [{ alias: "openrouter-primary", resolve: () => key.reveal() }],
                    models: models.map((id) => ({ id })),
                },
            ],
            profiles: {
                coach: {
                    model,
                    fallbacks: models.slice(1),
                    allowFallback: true,
                    maxAttempts: MAX_ATTEMPTS,
                    timeoutMs: ATTEMPT_TIMEOUT_MS,
                    deadlineMs: CALL_DEADLINE_MS,
                },
            },
            telemetry: { includeContent: false },
        },
    }
}
