import type { EnvSource } from "@modules/platform/config"
import { parseServerConfig } from "@modules/platform/config"
import { parsePrimaryDatabaseConfig } from "@modules/platform/database"
import { parseHttpSecurityConfig } from "@modules/platform/http-security"
import { parseSepayConfig } from "@modules/integrations/sepay"
import { parsePayosConfig } from "@modules/integrations/payos"

/** The core environment values required before composition. */
export interface CoreEnv {
    /** The HTTP listener. */
    readonly server: ReturnType<typeof parseServerConfig>
    /** The origin allowlist and rate limits. */
    readonly httpSecurity: ReturnType<typeof parseHttpSecurityConfig>
    /** The primary database connection. */
    readonly database: ReturnType<typeof parsePrimaryDatabaseConfig>
    /** The SePay channel, or null when the environment declares none. */
    readonly sepay: ReturnType<typeof parseSepayConfig>
    /** The payOS channel, or null when the environment declares none. */
    readonly payos: ReturnType<typeof parsePayosConfig>
}

/** Reads the core environment; missing or invalid values fail boot, and secrets use `_FILE` first. */
export const readCoreEnv = (env: EnvSource): CoreEnv => ({
    server: parseServerConfig(env),
    httpSecurity: parseHttpSecurityConfig(env),
    database: parsePrimaryDatabaseConfig(env),
    sepay: parseSepayConfig(env),
    payos: parsePayosConfig(env),
})
