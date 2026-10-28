import { sql } from "@modules/platform/database"

/** Writes one immutable published version ($1 content id, $2 version, $3 source hash, $4 payload, $5 published at). */
export const INSERT_LESSON_VERSION = sql`INSERT INTO lesson_content_versions (content_id, version, source_hash, payload, created_at) VALUES ($1, $2, $3, $4::jsonb, $5)`

/** Writes the server-only grading of one version ($1 content id, $2 version, $3 payload, $4 stored at). */
export const INSERT_LESSON_GRADING = sql`INSERT INTO lesson_content_grading (content_id, version, payload, created_at) VALUES ($1, $2, $3::jsonb, $4)`
