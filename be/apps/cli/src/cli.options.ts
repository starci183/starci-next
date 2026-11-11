import type { DatabaseConnectionConfig } from "@modules/platform/database"
import type { AiGatewayOptions } from "@modules/integrations/ai-gateway"
import type { SepayOptions } from "@modules/integrations/sepay"
import type { PayosOptions } from "@modules/integrations/payos"
import type { CliEnv } from "./cli.env"

/** The parsed configuration handed to the cli composition root. */
export interface CliAppOptions {
    /** The primary connection before its owners' entities and migrations are bound. */
    readonly database: DatabaseConnectionConfig
    /** The SePay channel, or null when this instance serves no SePay rail. */
    readonly sepay: SepayOptions | null
    /** The payOS channel, or null when this instance serves no payOS rail. */
    readonly payos: PayosOptions | null
    /** The AI pool the bank calibration grades through, or null when this instance has none. */
    readonly aiGateway: AiGatewayOptions | null
    /** The career settings: whether the development seed of experience items may run. */
    readonly career: CliEnv["career"]
    /** The entitlement settings: whether the development grant of Premium may run. */
    readonly entitlement: CliEnv["entitlement"]
    /** The git mount of the content repositories, or null when this instance has none. */
    readonly content: CliEnv["content"]
}

/** Passes the parsed environment to composition without adding registrations. */
export const createCliAppOptions = (env: CliEnv): CliAppOptions => ({
    database: env.database,
    sepay: env.sepay,
    payos: env.payos,
    aiGateway: env.aiGateway,
    career: env.career,
    entitlement: env.entitlement,
    content: env.content,
})
