import { DomainError } from "@modules/platform/errors"
import type { ErrorKind } from "@modules/platform/errors"

/** Codes of the ai-pool capability. */
export enum AiPoolErrorCode {
    /** The lesson pool configuration is missing a required guardrail or names an unsafe value. */
    ConfigInvalid = "AI_POOL_CONFIG_INVALID",
    /** The grounding cannot fit the smallest configured model window after reserving prompt and output tokens. */
    GroundingTooLarge = "AI_POOL_GROUNDING_TOO_LARGE",
    /** The caller asked for an output token limit that is not a positive integer. */
    OutputLimitInvalid = "AI_POOL_OUTPUT_LIMIT_INVALID",
}

/** How each ai-pool code travels. */
export const AI_POOL_ERROR_KINDS: Record<AiPoolErrorCode, ErrorKind> = {
    [AiPoolErrorCode.ConfigInvalid]: "internal",
    [AiPoolErrorCode.GroundingTooLarge]: "invalid",
    [AiPoolErrorCode.OutputLimitInvalid]: "invalid",
}

/** The one error class of the ai-pool capability. */
export class AiPoolError extends DomainError<AiPoolErrorCode> {}
