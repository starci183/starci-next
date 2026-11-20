import { readdirSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

interface PgClient {
    connect(): Promise<void>
    query(text: string): Promise<unknown>
    end(): Promise<void>
}
const { Client } = require("pg") as { Client: new (config: { connectionString: string }) => PgClient }

/** What the world hands the migrate step: the run's database. */
export interface MigrateOptions {
    readonly url: string
}

/** The repository root: this file is `be/src/tests/world/migrate.ts`. */
const ROOT = resolve(__dirname, "../../../..")

/** The migrate step of the world: the bootstrap and every migration of `db/migrations`, in file order, over the run's database (the same files `starci app db migrate` applies). */
export const bootstrap = async (options: MigrateOptions): Promise<void> => {
    const files = [
        resolve(ROOT, "db/bootstrap.sql"),
        ...readdirSync(resolve(ROOT, "db/migrations"))
            .filter((name) => name.endsWith(".sql"))
            .sort()
            .map((name) => resolve(ROOT, "db/migrations", name)),
    ]
    const client = new Client({ connectionString: options.url })
    await client.connect()
    try {
        for (const file of files) await client.query(readFileSync(file, "utf8"))
    } finally {
        await client.end()
    }
}
