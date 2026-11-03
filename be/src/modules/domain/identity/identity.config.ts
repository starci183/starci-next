import type { EnvSource } from "@modules/platform/config"
import type { IdentitySessionOptions } from "./identity.options"
import { validateIdentityLifetimes } from "./session.policy"

/** Reads only the local lifetime tunables before boot and applies identity's pure bounds policy. */
export const parseIdentityConfig = (env: EnvSource): IdentitySessionOptions =>
    validateIdentityLifetimes({
        sessionMaxSeconds: env.int("IDENTITY_SESSION_MAX_SECONDS", 28800),
        transactionTtlSeconds: env.int("IDENTITY_TRANSACTION_TTL_SECONDS", 300),
    })
