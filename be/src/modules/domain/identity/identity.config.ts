import type { EnvSource } from "@modules/platform/config"
import type { IdentitySessionOptions } from "./identity.options"
import { validateIdentityOptions } from "./session.policy"

/**
 * Reads the identity tunables and the sealing secret before boot and applies identity's pure bounds policy. A session
 * maximum of 0, or no key, leaves only the provider's refresh lifetime limiting a session.
 */
export const parseIdentityConfig = (env: EnvSource): IdentitySessionOptions =>
    validateIdentityOptions({
        sessionMaxSeconds: env.int("IDENTITY_SESSION_MAX_SECONDS", 0) || null,
        challengeTtlSeconds: env.int("IDENTITY_CHALLENGE_TTL_SECONDS", 600),
        challengeMaxAttempts: env.int("IDENTITY_CHALLENGE_MAX_ATTEMPTS", 5),
        sessionEncryptionKey: env.secret("IDENTITY_SESSION_ENCRYPTION_KEY"),
    })
