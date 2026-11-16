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
