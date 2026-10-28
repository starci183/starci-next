import type { EnvSource } from "@modules/platform/config"
import { parseServerConfig } from "@modules/platform/config"
import { parseAiPoolConfig } from "@modules/integrations/ai-pool"
import { parsePrimaryDatabaseConfig } from "@modules/platform/database"
import { parseHttpSecurityConfig } from "@modules/platform/http-security"

/** The core environment values required before composition. */
export interface CoreEnv {
    /** The HTTP listener. */
    readonly server: ReturnType<typeof parseServerConfig>
    /** The origin allowlist and rate limits. */
    readonly httpSecurity: ReturnType<typeof parseHttpSecurityConfig>
    /** The primary database connection. */
    readonly database: ReturnType<typeof parsePrimaryDatabaseConfig>
    /** The lesson AI pool, with its key references bound to the environment. */
    readonly aiPool: ReturnType<typeof parseAiPoolConfig>
}

/** Reads the core environment; missing or invalid values fail boot, and secrets use `_FILE` first. */
export const readCoreEnv = (env: EnvSource): CoreEnv => ({
    server: parseServerConfig(env),
    httpSecurity: parseHttpSecurityConfig(env),
    database: parsePrimaryDatabaseConfig(env),
    aiPool: parseAiPoolConfig(env),
})
