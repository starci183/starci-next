import { injector } from "@modules/platform/composition"
import type { TypedParameterDecorator } from "@modules/platform/composition"
import type { AiPoolOptions } from "./ai-pool.options"

/** Runtime token for validated lesson pool options. */
export const AI_POOL_OPTIONS: unique symbol = Symbol("integrations.ai-pool.options")

/** Injects validated lesson pool options. */
export const InjectAiPoolOptions = (): TypedParameterDecorator<AiPoolOptions> =>
    injector<AiPoolOptions>(AI_POOL_OPTIONS)
