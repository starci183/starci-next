import type { EnvSource } from "@modules/platform/config"
import type { PayosOptions } from "./payos.options"

/**
 * Every environment key that declares the payOS rail. Their presence together is what makes the channel declared: a partial
 * declaration refuses boot instead of trusting a channel nobody fully named, and the secret accepts its file-backed `_FILE`
 * companion under the custody rules of `EnvSource`.
 */
const PAYOS_KEYS: ReadonlyArray<string> = ["PAYOS_CHECKSUM_KEY", "PAYOS_CHECKSUM_KEY_FILE"]

/**
 * Reads the payOS channel of an environment source. No declared key answers `null` — this instance serves no payOS rail —
 * while a declared key makes the checksum key required, with no default.
 */
export const parsePayosConfig = (env: EnvSource): PayosOptions | null =>
    env.anyDeclared(PAYOS_KEYS) ? { checksumKey: env.secret("PAYOS_CHECKSUM_KEY") } : null
