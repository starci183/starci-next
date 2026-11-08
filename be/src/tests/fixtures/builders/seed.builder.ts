import { readFileSync } from "node:fs"
import { seedText, type sql } from "@modules/platform/database"

/** The statements of one tracked seed file of a stack (`.starcistacks/<env>/seeds/sql/<connection>-<name>.sql`) as SQL text. */
export const seedSqlOf = (path: string): ReturnType<typeof sql> => seedText(readFileSync(path, "utf8"))
