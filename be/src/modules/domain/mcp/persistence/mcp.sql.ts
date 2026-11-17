import { sql } from "@modules/platform/database"

/** Stores a new token ($1 learner, $2 name, $3 digest, $4 hint, $5 now); refuses nothing, the service counts first. */
export const INSERT_TOKEN: ReturnType<typeof sql> = sql`INSERT INTO mcp_access_tokens
    (learner_id, name, token_digest, hint, created_at)
VALUES ($1::uuid, $2::text, $3::text, $4::text, $5::timestamptz)
RETURNING token_id, learner_id, name, hint, created_at, last_used_at`

/** The learner's working tokens, newest first ($1 learner, $2 bound). */
export const SELECT_TOKENS: ReturnType<typeof sql> =
    sql`SELECT token_id, learner_id, name, hint, created_at, last_used_at
FROM mcp_access_tokens WHERE learner_id = $1::uuid AND revoked_at IS NULL ORDER BY created_at DESC, token_id LIMIT $2::int`

/** Revokes one of the learner's tokens ($1 token, $2 learner, $3 now); no row means it is not theirs or already revoked. */
export const REVOKE_TOKEN: ReturnType<typeof sql> = sql`UPDATE mcp_access_tokens SET revoked_at = $3::timestamptz
WHERE token_id = $1::uuid AND learner_id = $2::uuid AND revoked_at IS NULL RETURNING token_id`

/** Touches and answers the learner of a working token by its digest ($1 digest, $2 now). */
export const TOUCH_BY_DIGEST: ReturnType<typeof sql> = sql`UPDATE mcp_access_tokens SET last_used_at = $2::timestamptz
WHERE token_digest = $1::text AND revoked_at IS NULL RETURNING learner_id`

/** The synced chunks of a scope among the hashes ($1 kind, $2 source, $3 locale, $4 hashes). */
export const SELECT_KNOWN_POINTS: ReturnType<typeof sql> = sql`SELECT content_hash, access FROM mcp_vector_points
WHERE kind = $1::text AND source_id = $2::text AND locale = $3::text AND content_hash = ANY($4::text[]) AND synced_at IS NOT NULL`

/** Records the chunks to write, pending until Qdrant has them ($1 kind, $2 source, $3 locale, $4 access, $5 point ids, $6 hashes, $7 parts). */
export const UPSERT_POINT_ROWS: ReturnType<typeof sql> = sql`INSERT INTO mcp_vector_points
    (point_id, kind, source_id, locale, content_hash, part, access, synced_at)
SELECT item.point_id, $1::text, $2::text, $3::text, item.hash, item.part, $4::text, NULL
FROM unnest($5::uuid[], $6::text[], $7::text[]) AS item(point_id, hash, part)
ON CONFLICT (kind, source_id, locale, content_hash)
DO UPDATE SET part = EXCLUDED.part, access = EXCLUDED.access, synced_at = NULL`

/** Marks points as written to Qdrant ($1 point ids, $2 now). */
export const MARK_POINTS_SYNCED: ReturnType<typeof sql> =
    sql`UPDATE mcp_vector_points SET synced_at = $2::timestamptz WHERE point_id = ANY($1::uuid[])`

/** Re-labels the access class of chunks and answers their point ids ($1 kind, $2 source, $3 locale, $4 hashes, $5 access). */
export const UPDATE_POINT_ACCESS: ReturnType<typeof sql> = sql`UPDATE mcp_vector_points SET access = $5::text
WHERE kind = $1::text AND source_id = $2::text AND locale = $3::text AND content_hash = ANY($4::text[]) RETURNING point_id`

/** The content hash of each point a search returned ($1 point ids). */
export const SELECT_POINT_HASHES: ReturnType<typeof sql> =
    sql`SELECT point_id, content_hash FROM mcp_vector_points WHERE point_id = ANY($1::uuid[])`

/** The points of a scope whose hash is not in the corpus any more ($1 kind, $2 source, $3 locale, $4 hashes to keep). */
export const SELECT_STALE_POINTS: ReturnType<typeof sql> = sql`SELECT point_id FROM mcp_vector_points
WHERE kind = $1::text AND source_id = $2::text AND locale = $3::text AND NOT (content_hash = ANY($4::text[]))`

/** Deletes point rows ($1 point ids). */
export const DELETE_POINT_ROWS: ReturnType<typeof sql> =
    sql`DELETE FROM mcp_vector_points WHERE point_id = ANY($1::uuid[])`
