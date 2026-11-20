import { readFileSync } from "node:fs"
import type { SqlText } from "@modules/platform/database"

/** The statements of one tracked dev seed file (`.starcistacks/dev/seeds/sql/<connection>-<name>.sql`) as the text a spec runs on its connection. */
export const seedSqlOf = (path: string): SqlText => readFileSync(path, "utf8") as SqlText
