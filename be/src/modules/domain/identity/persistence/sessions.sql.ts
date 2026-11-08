import { sql } from "@modules/platform/database"

/**
 * Creates durable authentication without its raw credential ($1 reference digest, $2 subject, $3 roles json, $4 sealed
 * refresh token, $5 refresh expiry, $6 session expiry, $7 issue time, $8 display name or null, $9 email or null).
 */
export const INSERT_IDENTITY_SESSION: ReturnType<typeof sql> = sql`INSERT INTO identity_sessions
    (reference_digest, subject, roles, refresh_ciphertext, refresh_expires_at, expires_at, issued_at, revoked_at,
        display_name, email)
    VALUES ($1::varchar, $2::text, $3::jsonb, $4::text, $5::timestamptz, $6::timestamptz, $7::timestamptz, NULL,
        $8::text, $9::text)`

/** Looks up a unique credential only while current and unrevoked ($1 reference digest, $2 current time). */
export const FIND_IDENTITY_SESSION: ReturnType<typeof sql> =
    sql`SELECT subject, roles, display_name, email, refresh_ciphertext, refresh_expires_at, expires_at, issued_at FROM identity_sessions
    WHERE reference_digest = $1::varchar AND expires_at > $2::timestamptz AND revoked_at IS NULL LIMIT 1`

/**
 * Stores the refreshed tokens of one session when nobody rotated them first ($1 reference digest, $2 previous sealed
 * refresh token, $3 new sealed refresh token, $4 new refresh expiry, $5 new session expiry, $6 roles json, $7 current
 * time, $8 display name and $9 email the refresh asserted, each kept as it was when null); no row when the session was rotated, revoked or ended meanwhile.
 */
export const ROTATE_IDENTITY_SESSION: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE identity_sessions
    SET refresh_ciphertext = $3::text, refresh_expires_at = $4::timestamptz, expires_at = $5::timestamptz,
        roles = $6::jsonb, display_name = COALESCE($8::text, display_name), email = COALESCE($9::text, email)
    WHERE reference_digest = $1::varchar AND refresh_ciphertext = $2::text AND revoked_at IS NULL
        AND expires_at > $7::timestamptz
    RETURNING expires_at
) SELECT expires_at FROM changed`

/** Revokes a credential idempotently and answers its sealed refresh token once ($1 reference digest, $2 revocation time). */
export const REVOKE_IDENTITY_SESSION: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE identity_sessions SET revoked_at = $2::timestamptz
    WHERE reference_digest = $1::varchar AND revoked_at IS NULL
    RETURNING refresh_ciphertext
) SELECT refresh_ciphertext FROM changed`

/** Revokes every live session of one learner ($1 subject, $2 revocation time). */
export const REVOKE_IDENTITY_SESSIONS_OF_SUBJECT: ReturnType<typeof sql> = sql`UPDATE identity_sessions
    SET revoked_at = $2::timestamptz
    WHERE subject = $1::text AND revoked_at IS NULL`
