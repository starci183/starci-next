import type { EnvSource } from "@modules/platform/config"
import { parseServerConfig } from "@modules/platform/config"
import { parsePrimaryDatabaseConfig } from "@modules/platform/database"
import { parseHttpConfig } from "@modules/platform/http"
import { parseHttpSecurityConfig } from "@modules/platform/http-security"
import { parseIdentityConfig } from "@modules/domain/identity"
import { parseKeycloakConfig } from "@modules/integrations/keycloak"
import { parseSepayConfig } from "@modules/integrations/sepay"
import { parsePayosConfig } from "@modules/integrations/payos"

/** The core environment values required before composition. */
export interface CoreEnv {
    /** The HTTP listener. */
    readonly server: ReturnType<typeof parseServerConfig>
    /** The origin allowlist and rate limits. */
    readonly httpSecurity: ReturnType<typeof parseHttpSecurityConfig>
    /** What the outbound HTTP client trusts beyond Node's bundled certificate authorities. */
    readonly http: ReturnType<typeof parseHttpConfig>
    /** The primary database connection. */
    readonly database: ReturnType<typeof parsePrimaryDatabaseConfig>
    /** The SePay channel, or null when the environment declares none. */
    readonly sepay: ReturnType<typeof parseSepayConfig>
    /** The payOS channel, or null when the environment declares none. */
    readonly payos: ReturnType<typeof parsePayosConfig>
    /** Durable application session lifetimes. */
    readonly identity: ReturnType<typeof parseIdentityConfig>
    /** Registered provider and mounted confidential-client custody. */
    readonly keycloak: ReturnType<typeof parseKeycloakConfig>
}

/** Reads the core environment; missing or invalid values fail boot, and secrets use `_FILE` first. */
export const readCoreEnv = (env: EnvSource): CoreEnv => ({
    server: parseServerConfig(env),
    httpSecurity: parseHttpSecurityConfig(env),
    http: parseHttpConfig(env),
    database: parsePrimaryDatabaseConfig(env),
    sepay: parseSepayConfig(env),
    payos: parsePayosConfig(env),
    identity: parseIdentityConfig(env),
    keycloak: parseKeycloakConfig(env),
})
