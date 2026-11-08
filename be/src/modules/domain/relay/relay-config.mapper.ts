import type { EnvSource, Secret } from "@modules/platform/config"
import { RelayError, RelayErrorCode } from "./errors/relay.error"
import type { RelayOptions } from "./relay.options"

/** The defaults of Q-R-2 (Premium 2 devices, free 1) and a ten-minute pairing code. */
const PREMIUM_DEVICE_LIMIT = 2
const FREE_DEVICE_LIMIT = 1
const PAIRING_TTL_SECONDS = 600

/** A sealed relay secret (`<key>` or `<key>_FILE`), or null in development and test; any other mode refuses to boot without it. */
const sealedFrom = (env: EnvSource, key: string): Secret | null => {
    if (env.has(key) || env.has(`${key}_FILE`)) return env.secret(key)
    const mode = env.optional("NODE_ENV") ?? "development"
    if (mode === "development" || mode === "test") return null
    throw new RelayError({ code: RelayErrorCode.Unavailable, params: { fields: key } })
}

/**
 * Reads the relay tunables; the confirm page is the learner web origin's /devices. The manifest signing key is the sealed
 * `RELAY_MANIFEST_SIGNING_KEY` (PEM); without it a development or test process signs with a key of its own. The service key is
 * the sealed `RELAY_SERVICE_KEY` the relay app calls core's internal relay doors with; without it in development or test
 * those doors refuse every call. Any other mode refuses to boot without either.
 */
export const parseRelayConfig = (env: EnvSource, webOrigin: string): RelayOptions => ({
    manifestSigningKey: sealedFrom(env, "RELAY_MANIFEST_SIGNING_KEY"),
    serviceKey: sealedFrom(env, "RELAY_SERVICE_KEY"),
    verifyUrl: `${webOrigin}/devices`,
    pairingTtlSeconds: env.int("RELAY_PAIRING_TTL_SECONDS", PAIRING_TTL_SECONDS),
    premiumDeviceLimit: env.int("RELAY_PREMIUM_DEVICE_LIMIT", PREMIUM_DEVICE_LIMIT),
    freeDeviceLimit: env.int("RELAY_FREE_DEVICE_LIMIT", FREE_DEVICE_LIMIT),
})
