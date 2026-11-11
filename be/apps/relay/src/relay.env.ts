import { type EnvSource, parseServerConfig } from "@modules/platform/config"
import { parsePrimaryDatabaseConfig } from "@modules/platform/database"
import { parseHttpConfig } from "@modules/platform/http"
import { parseHttpSecurityConfig } from "@modules/platform/http-security"
import { parseRealtimeConfig } from "@modules/platform/realtime"
import { parseIdentityConfig } from "@modules/domain/identity"
import { parseRelayConfig } from "@modules/domain/relay"
import { parseKeycloakConfig } from "@modules/integrations/keycloak"
import { parseMailConfig } from "@modules/integrations/mail"

/** The relay environment values required before composition. */
export interface RelayEnv {
    /** The HTTP listener (port 3003). */
    readonly server: ReturnType<typeof parseServerConfig>
    /** The origin allowlist and rate limits. */
    readonly httpSecurity: ReturnType<typeof parseHttpSecurityConfig>
    /** What the outbound HTTP client trusts. */
    readonly http: ReturnType<typeof parseHttpConfig>
    /** The primary database connection (device rows, practice events, entitlements). */
    readonly database: ReturnType<typeof parsePrimaryDatabaseConfig>
    /** Session lifetimes, for identity's default-deny guard. */
    readonly identity: ReturnType<typeof parseIdentityConfig>
    /** The registered provider client identity reads sessions through. */
    readonly keycloak: ReturnType<typeof parseKeycloakConfig>
    /** Outgoing mail, which identity composes. */
    readonly mail: ReturnType<typeof parseMailConfig>
    /** The relay capability: device limits and the manifest signing key. */
    readonly relay: ReturnType<typeof parseRelayConfig>
    /** The realtime hub (memory, one replica). */
    readonly realtime: ReturnType<typeof parseRealtimeConfig>
}

/** Reads the relay environment; missing or invalid values fail boot, and secrets use `_FILE` first. */
export const readRelayEnv = (env: EnvSource): RelayEnv => {
    const httpSecurity = parseHttpSecurityConfig(env)
    return {
        server: parseServerConfig(env),
        httpSecurity,
        http: parseHttpConfig(env),
        database: parsePrimaryDatabaseConfig(env),
        identity: parseIdentityConfig(env),
        keycloak: parseKeycloakConfig(env),
        mail: parseMailConfig(env),
        relay: parseRelayConfig(env, httpSecurity.allowedOrigins[0] ?? ""),
        realtime: parseRealtimeConfig(env),
    }
}
