import { createHash, randomBytes } from "node:crypto"

/** The prefix every access token carries, so a leaked one is recognised by a secret scanner. */
export const MCP_TOKEN_PREFIX = "scmcp_"

const TOKEN_SHAPE = /^scmcp_[A-Za-z0-9_-]{43}$/u
const NAME_MAX = 60

/** A fresh token: the prefix and 256 unpredictable bits. */
export const mcpTokenSecret = (): string => `${MCP_TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`

/** The one-way digest stored in place of a token. */
export const mcpTokenDigest = (secret: string): string => createHash("sha256").update(secret).digest("hex")

/** The last four characters of a token, shown so the learner tells tokens apart. */
export const mcpTokenHint = (secret: string): string => secret.slice(-4)

/** True when the text has the shape of a token this capability mints. */
export const mcpTokenShaped = (secret: string): boolean => TOKEN_SHAPE.test(secret)

/** The secret an `Authorization: Bearer <token>` header carries, or null when it carries none of the right shape. */
export const bearerTokenOf = (authorization: string | undefined): string | null => {
    const token = /^Bearer (\S+)$/u.exec(authorization ?? "")?.[1]
    return token !== undefined && mcpTokenShaped(token) ? token : null
}

/** The trimmed token name, or null when it is empty, too long or carries a control character. */
export const mcpTokenNameOf = (name: string): string | null => {
    const trimmed = name.trim()
    return trimmed.length === 0 || trimmed.length > NAME_MAX || /\p{Cc}/u.test(trimmed) ? null : trimmed
}
