import type { EnvSource } from "@modules/platform/config"
import type { DatabaseConnectionOptions } from "./database.options"
import { PRIMARY_CONNECTION } from "./primary.connection"

/** Reads the least-privilege PostgreSQL connection with no default. */
export const parsePrimaryDatabaseConfig = (env: EnvSource): DatabaseConnectionOptions => ({
    name: PRIMARY_CONNECTION,
    provider: "postgres",
    url: env.secret("PRIMARY_DB_URL"),
    schema: env.string("PRIMARY_DB_SCHEMA"),
    poolMax: env.int("PRIMARY_DB_POOL_MAX", 20),
    acquireTimeoutMs: env.duration("PRIMARY_DB_ACQUIRE_TIMEOUT", 10_000),
})
