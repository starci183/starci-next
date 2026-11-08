import { sql } from "@modules/platform/database"

/**
 * Opens one pairing and drops the pending ones that lapsed ($1 device code digest, $2 user code, $3 name, $4 platform,
 * $5 expiry, $6 now).
 */
export const INSERT_PAIRING: ReturnType<typeof sql> = sql`WITH purged AS (
    DELETE FROM relay_devices WHERE status = 'pending' AND expires_at < $6::timestamptz
) INSERT INTO relay_devices (device_code_digest, user_code, name, platform, status, created_at, expires_at)
VALUES ($1::varchar, $2::varchar, $3::text, $4::text, 'pending', $6::timestamptz, $5::timestamptz)`

/** The live pending pairing a user code names ($1 user code, $2 now). */
export const SELECT_PENDING_BY_USER_CODE: ReturnType<typeof sql> =
    sql`SELECT device_id, learner_id, name, platform, status, expires_at, confirmed_at, last_seen_at, online_since FROM relay_devices
WHERE user_code = $1::varchar AND status = 'pending' AND expires_at > $2::timestamptz LIMIT 1`

/** Serializes the pairing confirmations of one learner ($1 learner). */
export const LOCK_LEARNER_DEVICES: ReturnType<typeof sql> =
    sql`SELECT pg_advisory_xact_lock(hashtextextended('relay:' || $1::text, 0)) AS locked`

/** How many devices a learner holds paired ($1 learner). */
export const COUNT_PAIRED: ReturnType<typeof sql> = sql`SELECT count(*)::int AS n FROM relay_devices
WHERE learner_id = $1::uuid AND status IN ('confirmed', 'active')`

/** Confirms a live pending pairing for the learner ($1 user code, $2 learner, $3 now). */
export const CONFIRM_PAIRING: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE relay_devices SET status = 'confirmed', learner_id = $2::uuid, confirmed_at = $3::timestamptz
    WHERE user_code = $1::varchar AND status = 'pending' AND expires_at > $3::timestamptz
    RETURNING device_id, learner_id, name, platform, status, expires_at, confirmed_at, last_seen_at, online_since
) SELECT device_id, learner_id, name, platform, status, expires_at, confirmed_at, last_seen_at, online_since FROM changed`

/** Locks the pairing a device code digest names, whatever its state ($1 device code digest). */
export const LOCK_BY_DEVICE_CODE: ReturnType<typeof sql> =
    sql`SELECT device_id, learner_id, name, platform, status, expires_at, confirmed_at, last_seen_at, online_since FROM relay_devices
WHERE device_code_digest = $1::varchar LIMIT 1 FOR UPDATE`

/** Issues the token of a confirmed pairing, once ($1 device id, $2 token digest, $3 now). */
export const ISSUE_TOKEN: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE relay_devices SET status = 'active', token_digest = $2::varchar
    WHERE device_id = $1::uuid AND status = 'confirmed' AND $3::timestamptz IS NOT NULL
    RETURNING device_id
) SELECT device_id FROM changed`

/** The device a token digest proves, touching its last contact ($1 token digest, $2 now). */
export const TOUCH_BY_TOKEN: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE relay_devices SET last_seen_at = $2::timestamptz
    WHERE token_digest = $1::varchar AND status = 'active'
    RETURNING device_id, learner_id, name, platform, status, expires_at, confirmed_at, last_seen_at, online_since
) SELECT device_id, learner_id, name, platform, status, expires_at, confirmed_at, last_seen_at, online_since FROM changed`

/** Opens or closes a device's socket presence, touching its last activity ($1 device, $2 open, $3 now). */
export const SET_PRESENCE: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE relay_devices SET online_since = CASE WHEN $2::boolean THEN $3::timestamptz ELSE NULL END, last_seen_at = $3::timestamptz
    WHERE device_id = $1::uuid AND status = 'active'
    RETURNING device_id
) SELECT device_id FROM changed`

/** Closes every open presence: the relay starts with no socket open ($1 now). */
export const CLEAR_PRESENCE: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE relay_devices SET online_since = NULL WHERE online_since IS NOT NULL AND $1::timestamptz IS NOT NULL
    RETURNING device_id
) SELECT count(*)::int AS n FROM changed`

/** The paired devices of a learner, newest first ($1 learner, $2 row bound). */
export const SELECT_DEVICES: ReturnType<typeof sql> =
    sql`SELECT device_id, learner_id, name, platform, status, expires_at, confirmed_at, last_seen_at, online_since FROM relay_devices
WHERE learner_id = $1::uuid AND status IN ('confirmed', 'active') ORDER BY confirmed_at DESC, device_id LIMIT $2::int`

/** Revokes one paired device of the learner ($1 device, $2 learner, $3 now). */
export const REVOKE_DEVICE: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE relay_devices SET status = 'revoked', revoked_at = $3::timestamptz, token_digest = NULL
    WHERE device_id = $1::uuid AND learner_id = $2::uuid AND status IN ('confirmed', 'active')
    RETURNING device_id
) SELECT device_id FROM changed`
