import { sql } from "@modules/platform/database"

/** Persists one browser transaction ($1 state digest, $2 binding digest, $3 nonce, $4 verifier, $5 expiry). */
export const INSERT_LOGIN_TRANSACTION = sql`INSERT INTO identity_login_transactions
    (state_digest, binding_digest, nonce, verifier, expires_at)
    VALUES ($1::varchar, $2::varchar, $3::varchar, $4::varchar, $5::timestamptz)`

/** Claims matching live state exactly once ($1 state digest, $2 binding digest, $3 current time). */
export const CLAIM_LOGIN_TRANSACTION = sql`WITH claimed AS (
    DELETE FROM identity_login_transactions
    WHERE state_digest = $1::varchar AND binding_digest = $2::varchar AND expires_at > $3::timestamptz
    RETURNING nonce, verifier
) SELECT nonce, verifier FROM claimed LIMIT 1`

/** Creates durable authentication without its raw credential ($1 digest, $2 issuer, $3 subject, $4 roles, $5 expiry). */
export const INSERT_IDENTITY_SESSION = sql`INSERT INTO identity_sessions
    (reference_digest, issuer, subject, roles, expires_at, revoked_at)
    VALUES ($1::varchar, $2::varchar, $3::varchar, $4::jsonb, $5::timestamptz, NULL)`

/** Looks up a unique credential only while current and unrevoked ($1 digest, $2 current time). */
export const FIND_IDENTITY_SESSION = sql`SELECT issuer, subject, roles, expires_at FROM identity_sessions
    WHERE reference_digest = $1::varchar AND expires_at > $2::timestamptz AND revoked_at IS NULL LIMIT 1`

/** Revokes a credential idempotently before external logout ($1 digest, $2 revocation time). */
export const REVOKE_IDENTITY_SESSION = sql`UPDATE identity_sessions SET revoked_at = $2::timestamptz
    WHERE reference_digest = $1::varchar AND revoked_at IS NULL`
