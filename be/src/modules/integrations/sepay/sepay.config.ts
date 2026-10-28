import type { EnvSource } from "@modules/platform/config"
import type { SepayOptions } from "./sepay.options"

/**
 * Every environment key that declares the SePay rail. Their presence together is what makes the channel declared: a partial
 * declaration refuses boot instead of trusting a channel nobody fully named, and the secret accepts its file-backed `_FILE`
 * companion under the custody rules of `EnvSource`.
 */
const SEPAY_KEYS: ReadonlyArray<string> = ["SEPAY_IPN_SECRET_KEY", "SEPAY_IPN_SECRET_KEY_FILE"]

/**
 * Reads the SePay channel of an environment source. No declared key answers `null` — this instance serves no SePay rail —
 * while a declared key makes the IPN secret key required, with no default.
 */
export const parseSepayConfig = (env: EnvSource): SepayOptions | null =>
    env.anyDeclared(SEPAY_KEYS) ? { secretKey: env.secret("SEPAY_IPN_SECRET_KEY") } : null
