import { sql } from "@modules/platform/database"

/** Inserts one pending purchase and returns its row ($1 learner, $2 plan, $3 amount, $4 rail, $5 order code, $6 created, $7 expiry). */
export const INSERT_PURCHASE = sql`WITH changed AS (
    INSERT INTO purchases (learner_id, plan, amount_vnd, currency, rail, order_code, provider_ref, status, created_at, updated_at, expires_at, confirmed_at)
    VALUES ($1::uuid, $2, $3::int, 'VND', $4, $5, NULL, 'pending', $6::timestamptz, $6::timestamptz, $7::timestamptz, NULL)
    RETURNING purchase_id, learner_id, plan, amount_vnd, currency, rail, order_code, provider_ref, status, created_at, updated_at, expires_at, confirmed_at
)
SELECT purchase_id, learner_id, plan, amount_vnd, currency, rail, order_code, provider_ref, status, created_at, updated_at, expires_at, confirmed_at
FROM changed`

/** Locks one purchase by its rail and order reference for the confirmation decision ($1 rail, $2 order code). */
export const LOCK_PURCHASE_BY_ORDER = sql`SELECT purchase_id, learner_id, plan, amount_vnd, currency, rail, order_code, provider_ref, status, created_at, updated_at, expires_at, confirmed_at
FROM purchases WHERE rail = $1 AND order_code = $2 LIMIT 1 FOR UPDATE`

/** Reads one purchase of one learner ($1 learner, $2 purchase). */
export const SELECT_PURCHASE = sql`SELECT purchase_id, learner_id, plan, amount_vnd, currency, rail, order_code, provider_ref, status, created_at, updated_at, expires_at, confirmed_at
FROM purchases WHERE learner_id = $1::uuid AND purchase_id = $2::uuid`

/** The rail of the learner's most recent purchase, for the default-rail policy ($1 learner). */
export const SELECT_LAST_RAIL = sql`SELECT rail FROM purchases WHERE learner_id = $1::uuid ORDER BY created_at DESC, purchase_id DESC LIMIT 1`

/** The next order code of the purchase sequence; the rail's own format is prefixed onto it. */
export const NEXT_ORDER_CODE = sql`SELECT nextval('purchase_order_codes')::bigint AS order_code`

/** Marks a purchase paid with the provider reference the confirmation carried ($1 purchase, $2 provider ref, $3 confirmation, $4 update time). */
export const MARK_PAID = sql`WITH changed AS (
    UPDATE purchases SET status = 'paid', provider_ref = $2, confirmed_at = $3::timestamptz, updated_at = $4::timestamptz
    WHERE purchase_id = $1::uuid AND status IN ('pending', 'canceled', 'expired')
    RETURNING purchase_id, learner_id, plan, amount_vnd, currency, rail, order_code, provider_ref, status, created_at, updated_at, expires_at, confirmed_at
)
SELECT purchase_id, learner_id, plan, amount_vnd, currency, rail, order_code, provider_ref, status, created_at, updated_at, expires_at, confirmed_at
FROM changed`

/** Moves a pending purchase to a closed state, returning nothing when it already left pending ($1 purchase, $2 state, $3 update time). */
export const CLOSE_PENDING = sql`WITH changed AS (
    UPDATE purchases SET status = $2, updated_at = $3::timestamptz
    WHERE purchase_id = $1::uuid AND status = 'pending'
    RETURNING purchase_id
)
SELECT purchase_id FROM changed`

/** Records one audit event of a purchase ($1 purchase, $2 kind, $3 rail, $4 provider ref, $5 created). */
export const INSERT_PURCHASE_EVENT = sql`INSERT INTO purchase_events (purchase_id, kind, rail, provider_ref, created_at)
VALUES ($1::uuid, $2, $3, $4, $5::timestamptz)`
