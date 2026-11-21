import { EnvSource } from "@modules/platform/config"
import { PRIMARY_DATA_SOURCE } from "@modules/platform/database"
import { createCliAppOptions } from "../../../../apps/cli/src/cli.options"
import { readCliEnv } from "../../../../apps/cli/src/cli.env"

/** What a wiring proof hands the compiled root: public options and the infrastructure doubles. */
export interface WiringProof {
    readonly options: Readonly<Record<string, unknown>>
    readonly overrides: ReadonlyArray<{ readonly token: unknown; readonly value: unknown }>
}

/** The public fixture environment of the cli proof; the same values `hfs.json` declares for the cli boot entry. */
export const CLI_PROOF_ENV: Readonly<Record<string, string>> = {
    PRIMARY_DB_URL: "postgresql://app_be@127.0.0.1:5432/postgres",
    PRIMARY_DB_SCHEMA: "public",
}

/** Compiles the real cli root with the options its own environment parser reads from the fixture environment, and the database double. */
export const buildWiringProof = (): WiringProof => ({
    options: { ...createCliAppOptions(readCliEnv(new EnvSource(CLI_PROOF_ENV))) },
    overrides: [{ token: PRIMARY_DATA_SOURCE, value: { manager: {}, driver: {} } }],
})
