import data from "./ai-pool.data.json"
import type { AiPoolOptions } from "./ai-pool.options"
import type { PoolConfig } from "@starci/ai-router"
import { EnvSource } from "@modules/platform/config"
import { AiPoolError, AiPoolErrorCode } from "./errors/ai-pool.error"

type PoolData = PoolConfig<"lesson"> & { readonly limits: AiPoolOptions["limits"] }

/** Validates the data-only pool configuration and binds named keys to the supplied custody environment. */
export const parseAiPoolConfig = (env: EnvSource, source: PoolData = data): AiPoolOptions => {
    const { limits } = source
    const { limits: _limits, ...pool } = source
    if (!Number.isInteger(limits.maxOutputTokens) || limits.maxOutputTokens <= 0)
        throw new AiPoolError({ code: AiPoolErrorCode.ConfigInvalid, params: { key: "AI_POOL_MAX_OUTPUT_TOKENS" } })
    if (!Number.isInteger(limits.reservedPromptTokens) || limits.reservedPromptTokens < 0)
        throw new AiPoolError({
            code: AiPoolErrorCode.ConfigInvalid,
            params: { key: "AI_POOL_RESERVED_PROMPT_TOKENS" },
        })
    const models = pool.providers.flatMap((provider) => provider.models)
    const smallestWindow = Math.min(...models.map((model) => model.contextWindow ?? 0))
    if (!Number.isFinite(smallestWindow) || smallestWindow <= limits.maxOutputTokens + limits.reservedPromptTokens)
        throw new AiPoolError({ code: AiPoolErrorCode.ConfigInvalid, params: { key: "AI_POOL_MODEL_CONTEXT_WINDOW" } })
    if (
        !pool.profiles?.lesson?.model ||
        !pool.profiles.lesson.allowFallback ||
        pool.telemetry?.includeContent !== false
    )
        throw new AiPoolError({ code: AiPoolErrorCode.ConfigInvalid, params: { key: "AI_POOL_LESSON_PROFILE" } })

    const providers = pool.providers.map((provider) => ({
        ...provider,
        keys: provider.keys.map((key) => {
            if (!("env" in key))
                throw new AiPoolError({ code: AiPoolErrorCode.ConfigInvalid, params: { key: "AI_POOL_KEY_REFERENCE" } })
            const secret = env.secret(key.env)
            return {
                alias: key.alias,
                resolve: () => secret.reveal(),
                ...(key.maxConcurrency === undefined ? {} : { maxConcurrency: key.maxConcurrency }),
            }
        }),
    }))
    return { pool: { ...pool, providers, telemetry: { includeContent: false } }, limits }
}
