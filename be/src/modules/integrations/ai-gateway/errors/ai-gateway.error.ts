import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Codes of the AI gateway. */
export enum AiGatewayErrorCode {
    /** A declared gateway setting names a value the pool cannot run with. */
    ConfigInvalid = "AI_GATEWAY_CONFIG_INVALID",
    /** The provider pool did not answer: every key and model failed, the deadline passed or the network was down. */
    Unavailable = "AI_GATEWAY_UNAVAILABLE",
    /** The provider answered without any text. */
    ReplyEmpty = "AI_GATEWAY_REPLY_EMPTY",
    /** This instance declares no OpenRouter key, so there is no pool to complete a prompt. */
    NotConfigured = "AI_GATEWAY_NOT_CONFIGURED",
}

/** How each AI gateway code travels. */
export const AI_GATEWAY_ERROR_KINDS: Record<AiGatewayErrorCode, ErrorKind> = {
    [AiGatewayErrorCode.ConfigInvalid]: "internal",
    [AiGatewayErrorCode.Unavailable]: "unavailable",
    [AiGatewayErrorCode.ReplyEmpty]: "unavailable",
    [AiGatewayErrorCode.NotConfigured]: "unavailable",
}

/** The one error class of the AI gateway. */
export class AiGatewayError extends DomainError<AiGatewayErrorCode> {}
