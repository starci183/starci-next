import { sql } from "@modules/platform/database"

/** The stored versions of one lesson, oldest first ($1 = lesson id). */
export const LESSON_VERSIONS: ReturnType<typeof sql> =
    sql`SELECT version, status, content_hash, imported_at FROM lesson_versions WHERE lesson_id = $1 ORDER BY imported_at, version`

/** The text of one stored version's content ($1 = lesson id, $2 = version). */
export const LESSON_CONTENT_TEXT: ReturnType<typeof sql> =
    sql`SELECT content::text AS content FROM lesson_versions WHERE lesson_id = $1 AND version = $2`
