import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Codes of the mcp capability. */
export enum McpErrorCode {
    /** The bearer access token is missing, unknown or revoked. */
    TokenInvalid = "MCP_TOKEN_INVALID",
    /** The learner already holds as many access tokens as allowed. */
    TokenLimit = "MCP_TOKEN_LIMIT",
    /** The token name is empty, too long or carries a control character. */
    TokenNameInvalid = "MCP_TOKEN_NAME_INVALID",
    /** No access token of the learner has this id. */
    TokenNotFound = "MCP_TOKEN_NOT_FOUND",
    /** The source, scenarios and run tools are Premium like the lesson workspace. */
    PremiumRequired = "MCP_PREMIUM_REQUIRED",
    /** The lesson ships no source checkout or scenario catalog on this server. */
    SourceUnavailable = "MCP_SOURCE_UNAVAILABLE",
    /** The path is outside the lesson repository or names something the learner's AI never reads. */
    PathForbidden = "MCP_PATH_FORBIDDEN",
    /** The file does not exist in the lesson repository. */
    FileNotFound = "MCP_FILE_NOT_FOUND",
    /** The scenario is not in the lesson's public catalog, or a guard is not one of its guards. */
    ScenarioUnknown = "MCP_SCENARIO_UNKNOWN",
    /** The learner has no paired device with an open relay socket to send the run to. */
    DeviceOffline = "MCP_DEVICE_OFFLINE",
}

/** How each mcp code travels. */
export const MCP_ERROR_KINDS: Record<McpErrorCode, ErrorKind> = {
    [McpErrorCode.TokenInvalid]: "unauthenticated",
    [McpErrorCode.TokenLimit]: "conflict",
    [McpErrorCode.TokenNameInvalid]: "invalid",
    [McpErrorCode.TokenNotFound]: "not-found",
    [McpErrorCode.PremiumRequired]: "forbidden",
    [McpErrorCode.SourceUnavailable]: "not-found",
    [McpErrorCode.PathForbidden]: "forbidden",
    [McpErrorCode.FileNotFound]: "not-found",
    [McpErrorCode.ScenarioUnknown]: "not-found",
    [McpErrorCode.DeviceOffline]: "conflict",
}

/** The one error class of the mcp capability. */
export class McpError extends DomainError<McpErrorCode> {}
