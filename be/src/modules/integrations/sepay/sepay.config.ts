import type { EnvSource } from "@modules/platform/config"
import type { SepayOptions } from "./sepay.options"

/** The production checkout-form endpoint of the SePay Payment Gateway; a deployment may point at the sandbox instead. */
const DEFAULT_CHECKOUT_URL = "https://pay.sepay.vn/v1/checkout/init"

/**
 * Every environment key that declares the SePay rail. Their presence together is what makes the channel declared: a partial
 * declaration refuses boot instead of trusting a channel nobody fully named, and the secrets accept their file-backed
 * `_FILE` companions under the custody rules of `EnvSource`.
 */
const SEPAY_KEYS: ReadonlyArray<string> = [
    "SEPAY_IPN_SECRET_KEY",
    "SEPAY_IPN_SECRET_KEY_FILE",
    "SEPAY_MERCHANT_ID",
    "SEPAY_SIGNING_SECRET_KEY",
    "SEPAY_SIGNING_SECRET_KEY_FILE",
]

/**
 * Reads the SePay channel of an environment source. No declared key answers `null` — this instance serves no SePay rail —
 * while a declared key makes the IPN secret key, the merchant id and the form signing secret required, with no default;
 * only the public checkout endpoint defaults.
 */
export const parseSepayConfig = (env: EnvSource): SepayOptions | null =>
    env.anyDeclared(SEPAY_KEYS)
        ? {
              secretKey: env.secret("SEPAY_IPN_SECRET_KEY"),
              merchantId: env.string("SEPAY_MERCHANT_ID"),
              signingKey: env.secret("SEPAY_SIGNING_SECRET_KEY"),
              checkoutUrl: env.optional("SEPAY_CHECKOUT_URL") ?? DEFAULT_CHECKOUT_URL,
          }
        : null
