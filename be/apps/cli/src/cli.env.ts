import type { EnvSource } from "@modules/platform/config"
import { parsePrimaryDatabaseConfig } from "@modules/platform/database"
import { parseSepayConfig } from "@modules/integrations/sepay"
import { parsePayosConfig } from "@modules/integrations/payos"

/** The cli environment values required before composition. */
export interface CliEnv {
    /** The primary database connection. */
    readonly database: ReturnType<typeof parsePrimaryDatabaseConfig>
    /** The SePay channel, or null when the environment declares none. */
    readonly sepay: ReturnType<typeof parseSepayConfig>
    /** The payOS channel, or null when the environment declares none. */
    readonly payos: ReturnType<typeof parsePayosConfig>
}

/** Reads the required cli environment before composition; its secrets use `_FILE` first and have no default. */
export const readCliEnv = (env: EnvSource): CliEnv => ({
    database: parsePrimaryDatabaseConfig(env),
    sepay: parseSepayConfig(env),
    payos: parsePayosConfig(env),
})
