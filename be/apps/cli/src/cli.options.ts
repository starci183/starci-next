import type { DatabaseConnectionConfig } from "@modules/platform/database"
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
}

/** Passes the parsed environment to composition without adding registrations. */
export const createCliAppOptions = (env: CliEnv): CliAppOptions => ({
    database: env.database,
    sepay: env.sepay,
    payos: env.payos,
})
