import type { EnvSource } from "@modules/platform/config"
import { parsePrimaryDatabaseConfig } from "@modules/platform/database"
import { parseCareerConfig } from "@modules/domain/career"
import { parseEntitlementConfig } from "@modules/domain/entitlement"
import { parseContentConfig } from "@modules/domain/content"
import { parseAiGatewayConfig } from "@modules/integrations/ai-gateway"
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
    /** The AI pool the bank calibration grades through, or null when the environment declares none. */
    readonly aiGateway: ReturnType<typeof parseAiGatewayConfig>
    /** The career settings: whether the development seed of experience items may run. */
    readonly career: ReturnType<typeof parseCareerConfig>
    /** The entitlement settings: whether the development grant of Premium may run. */
    readonly entitlement: ReturnType<typeof parseEntitlementConfig>
    /** The git mount of the content repositories, or null when the environment declares none. */
    readonly content: ReturnType<typeof parseContentConfig>
}

/** Reads the required cli environment before composition; its secrets use `_FILE` first and have no default. */
export const readCliEnv = (env: EnvSource): CliEnv => ({
    database: parsePrimaryDatabaseConfig(env),
    sepay: parseSepayConfig(env),
    payos: parsePayosConfig(env),
    aiGateway: parseAiGatewayConfig(env),
    career: parseCareerConfig(env),
    entitlement: parseEntitlementConfig(env),
    content: parseContentConfig(env),
})
