import { sql } from "@modules/platform/database"

/**
 * Opens a challenge and drops the ones that ended before $10 ($1 challenge digest, $2 purpose, $3 email, $4 locale,
 * $5 code digest, $6 attempts, $7 deliver, $8 sealed payload, $9 expiry, $10 purge cutoff).
 */
export const INSERT_CHALLENGE: ReturnType<typeof sql> = sql`WITH purged AS (
    DELETE FROM identity_challenges WHERE expires_at < $10::timestamptz
) INSERT INTO identity_challenges
    (challenge_digest, purpose, email, locale, code_digest, attempts_left, deliver, payload, expires_at, consumed_at)
    VALUES ($1::varchar, $2::varchar, $3::text, $4::varchar, $5::varchar, $6::integer, $7::boolean, $8::text,
        $9::timestamptz, NULL)`

/**
 * Judges one code in a single statement ($1 challenge digest, $2 purpose, $3 code digest, $4 current time): a right
 * code consumes the challenge, a wrong one spends an attempt, and a consumed, expired or exhausted challenge answers no
 * row, so concurrent verifies cannot both win (the live row is locked first, and a waiter finds it consumed). The sealed
 * payload comes back only when the code matched, and the same statement blanks it in the row, so a consumed challenge
 * keeps no sealed password or refresh token until its purge.
 */
export const ATTEMPT_CHALLENGE: ReturnType<typeof sql> = sql`WITH live AS (
    SELECT challenge_digest, payload FROM identity_challenges
    WHERE challenge_digest = $1::varchar AND purpose = $2::varchar AND consumed_at IS NULL
        AND expires_at > $4::timestamptz AND attempts_left > 0
    FOR UPDATE
), attempt AS (
    UPDATE identity_challenges AS c SET
        consumed_at = CASE WHEN c.code_digest = $3::varchar THEN $4::timestamptz ELSE c.consumed_at END,
        attempts_left = CASE WHEN c.code_digest = $3::varchar THEN c.attempts_left ELSE c.attempts_left - 1 END,
        payload = CASE WHEN c.code_digest = $3::varchar THEN '' ELSE c.payload END
    FROM live
    WHERE c.challenge_digest = live.challenge_digest AND c.consumed_at IS NULL
        AND c.expires_at > $4::timestamptz AND c.attempts_left > 0
    RETURNING (c.code_digest = $3::varchar) AS matched, c.attempts_left, c.email,
        CASE WHEN c.code_digest = $3::varchar THEN live.payload ELSE NULL END AS payload
) SELECT matched, attempts_left, email, payload FROM attempt`

/**
 * Replaces the code of a live challenge and gives it its attempts back, leaving the expiry alone ($1 challenge digest,
 * $2 new code digest, $3 attempts, $4 current time).
 */
export const ROTATE_CHALLENGE_CODE: ReturnType<typeof sql> = sql`WITH rotated AS (
    UPDATE identity_challenges SET code_digest = $2::varchar, attempts_left = $3::integer
    WHERE challenge_digest = $1::varchar AND consumed_at IS NULL AND expires_at > $4::timestamptz
    RETURNING purpose, email, locale, deliver, expires_at
) SELECT purpose, email, locale, deliver, expires_at FROM rotated`

/**
 * Stores one PKCE bundle and drops the ones that ended before $6 ($1 state digest, $2 nonce, $3 code verifier,
 * $4 return path, $5 expiry, $6 purge cutoff).
 */
export const INSERT_SOCIAL_BUNDLE: ReturnType<typeof sql> = sql`WITH purged AS (
    DELETE FROM identity_social_bundles WHERE expires_at < $6::timestamptz
) INSERT INTO identity_social_bundles (state_digest, nonce, code_verifier, return_to, expires_at, consumed_at)
    VALUES ($1::varchar, $2::varchar, $3::varchar, $4::text, $5::timestamptz, NULL)`

/** Consumes a live bundle exactly once ($1 state digest, $2 current time); no row when unknown, used or expired. */
export const CLAIM_SOCIAL_BUNDLE: ReturnType<typeof sql> = sql`WITH claimed AS (
    UPDATE identity_social_bundles SET consumed_at = $2::timestamptz
    WHERE state_digest = $1::varchar AND consumed_at IS NULL AND expires_at > $2::timestamptz
    RETURNING nonce, code_verifier, return_to
) SELECT nonce, code_verifier, return_to FROM claimed`
