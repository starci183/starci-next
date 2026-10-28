import type { EnvSource } from "@modules/platform/config"
import type { PayosOptions } from "./payos.options"

/** The public origin of the payOS merchant API. */
const DEFAULT_API_BASE = "https://api-merchant.payos.vn"

/** How long a payOS call may take unless the deployment says otherwise. */
const DEFAULT_TIMEOUT_MS = 10_000

/** The origin as written, minus one trailing slash, so request paths join cleanly. */
const withoutTrailingSlash = (origin: string): string => (origin.endsWith("/") ? origin.slice(0, -1) : origin)

/**
 * Every environment key that declares the payOS rail. Their presence together is what makes the channel declared: a partial
 * declaration refuses boot instead of trusting a channel nobody fully named, and the secrets accept their file-backed `_FILE`
 * companions under the custody rules of `EnvSource`.
 */
const PAYOS_KEYS: ReadonlyArray<string> = [
    "PAYOS_CHECKSUM_KEY",
    "PAYOS_CHECKSUM_KEY_FILE",
    "PAYOS_CLIENT_ID",
    "PAYOS_API_KEY",
    "PAYOS_API_KEY_FILE",
]

/**
 * Reads the payOS channel of an environment source. No declared key answers `null` — this instance serves no payOS rail —
 * while a declared key makes the checksum key, client id and API key required, with no default; only the public API origin
 * and the call deadline default.
 */
export const parsePayosConfig = (env: EnvSource): PayosOptions | null =>
    env.anyDeclared(PAYOS_KEYS)
        ? {
              checksumKey: env.secret("PAYOS_CHECKSUM_KEY"),
              clientId: env.string("PAYOS_CLIENT_ID"),
              apiKey: env.secret("PAYOS_API_KEY"),
              apiBase: withoutTrailingSlash(env.optional("PAYOS_API_BASE") ?? DEFAULT_API_BASE),
              timeoutMs: env.duration("PAYOS_TIMEOUT", DEFAULT_TIMEOUT_MS),
          }
        : null
