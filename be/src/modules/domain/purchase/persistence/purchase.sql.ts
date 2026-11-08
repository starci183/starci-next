import { sql } from "@modules/platform/database"

/** Inserts one pending purchase and returns its row ($1 learner, $2 plan, $3 amount, $4 rail, $5 order code, $6 created, $7 expiry). */
export const INSERT_PURCHASE: ReturnType<typeof sql> = sql`WITH changed AS (
    INSERT INTO purchases (learner_id, plan, amount_vnd, currency, rail, order_code, provider_ref, status, created_at, updated_at, expires_at, confirmed_at)
    VALUES ($1::uuid, $2, $3::int, 'VND', $4, $5, NULL, 'pending', $6::timestamptz, $6::timestamptz, $7::timestamptz, NULL)
    RETURNING purchase_id, learner_id, plan, amount_vnd, currency, rail, order_code, provider_ref, status, created_at, updated_at, expires_at, confirmed_at
)
SELECT purchase_id, learner_id, plan, amount_vnd, currency, rail, order_code, provider_ref, status, created_at, updated_at, expires_at, confirmed_at
FROM changed`

/** Locks one purchase by its rail and order reference for the confirmation decision ($1 rail, $2 order code). */
export const LOCK_PURCHASE_BY_ORDER: ReturnType<typeof sql> =
    sql`SELECT purchase_id, learner_id, plan, amount_vnd, currency, rail, order_code, provider_ref, status, created_at, updated_at, expires_at, confirmed_at
FROM purchases WHERE rail = $1 AND order_code = $2 LIMIT 1 FOR UPDATE`

/** Reads one purchase of one learner ($1 learner, $2 purchase). */
export const SELECT_PURCHASE: ReturnType<typeof sql> =
    sql`SELECT purchase_id, learner_id, plan, amount_vnd, currency, rail, order_code, provider_ref, status, created_at, updated_at, expires_at, confirmed_at
FROM purchases WHERE learner_id = $1::uuid AND purchase_id = $2::uuid`

/** The rail of the learner's most recent purchase, for the default-rail policy ($1 learner). */
export const SELECT_LAST_RAIL: ReturnType<typeof sql> =
    sql`SELECT rail FROM purchases WHERE learner_id = $1::uuid ORDER BY created_at DESC, purchase_id DESC LIMIT 1`

/** The next order code of the purchase sequence; the rail's own format is prefixed onto it. */
export const NEXT_ORDER_CODE: ReturnType<typeof sql> = sql`SELECT nextval('purchase_order_codes')::bigint AS order_code`

/** Marks a purchase paid with the provider reference the confirmation carried ($1 purchase, $2 provider ref, $3 confirmation, $4 update time). */
export const MARK_PAID: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE purchases SET status = 'paid', provider_ref = $2, confirmed_at = $3::timestamptz, updated_at = $4::timestamptz
    WHERE purchase_id = $1::uuid AND status IN ('pending', 'canceled', 'expired')
    RETURNING purchase_id, learner_id, plan, amount_vnd, currency, rail, order_code, provider_ref, status, created_at, updated_at, expires_at, confirmed_at
)
SELECT purchase_id, learner_id, plan, amount_vnd, currency, rail, order_code, provider_ref, status, created_at, updated_at, expires_at, confirmed_at
FROM changed`

/** Marks a paid purchase voided by its provider, keeping its confirmation instant ($1 purchase, $2 update time). */
export const MARK_VOIDED: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE purchases SET status = 'voided', updated_at = $2::timestamptz
    WHERE purchase_id = $1::uuid AND status = 'paid'
    RETURNING purchase_id
)
SELECT purchase_id FROM changed`

/** Serializes every Premium change of one learner inside the calling transaction ($1 learner). */
export const LOCK_LEARNER_PREMIUM: ReturnType<typeof sql> =
    sql`SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0)) AS locked`

/** The paid purchases of one learner that still stand, oldest confirmation first ($1 learner, $2 row bound). */
export const SELECT_STANDING_GRANTS: ReturnType<typeof sql> =
    sql`SELECT plan, confirmed_at FROM purchases WHERE learner_id = $1::uuid AND status = 'paid'
ORDER BY confirmed_at, purchase_id LIMIT $2::int`

/** Moves a pending purchase to a closed state, returning nothing when it already left pending ($1 purchase, $2 state, $3 update time). */
export const CLOSE_PENDING: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE purchases SET status = $2, updated_at = $3::timestamptz
    WHERE purchase_id = $1::uuid AND status = 'pending'
    RETURNING purchase_id
)
SELECT purchase_id FROM changed`

/**
 * Records one verified delivery the capability did not apply, once per (rail, provider ref, kind, reason): a provider
 * retry of the same refusal adds no second row ($1 purchase or null, $2 kind, $3 rail, $4 provider ref, $5 order code,
 * $6 amount, $7 currency, $8 reason, $9 created).
 */
export const INSERT_CONFIRMATION_REFUSAL: ReturnType<typeof sql> =
    sql`INSERT INTO purchase_events (purchase_id, kind, rail, provider_ref, order_code, amount_vnd, currency, reason, created_at)
VALUES ($1::uuid, $2, $3, $4, $5, $6::int, $7, $8, $9::timestamptz)
ON CONFLICT (rail, provider_ref, kind, reason) WHERE kind IN ('confirmation-refused', 'payment-voided') DO NOTHING`

/** Records one audit event of a purchase ($1 purchase, $2 kind, $3 rail, $4 provider ref, $5 created). */
export const INSERT_PURCHASE_EVENT: ReturnType<typeof sql> =
    sql`INSERT INTO purchase_events (purchase_id, kind, rail, provider_ref, created_at)
VALUES ($1::uuid, $2, $3, $4, $5::timestamptz)`
