import { sql } from "@modules/platform/database"

/** Stores one notification ($1 learner, $2 kind, $3 params as json, $4 link or null, $5 created at). */
export const INSERT_NOTIFICATION: ReturnType<typeof sql> =
    sql`INSERT INTO notifications (learner_id, kind, params, link, created_at)
VALUES ($1::uuid, $2::text, $3::jsonb, $4::text, $5::timestamptz)`

/**
 * Reads one page of a learner, newest first, after a cursor ($1 learner, $2 cursor instant or null, $3 cursor id or null,
 * $4 row bound).
 */
export const SELECT_NOTIFICATION_PAGE: ReturnType<typeof sql> =
    sql`SELECT id, kind, params, link, created_at, read_at FROM notifications
WHERE learner_id = $1::uuid AND ($2::timestamptz IS NULL OR (created_at, id) < ($2::timestamptz, $3::uuid))
ORDER BY created_at DESC, id DESC
LIMIT $4::int`

/** Counts the notifications a learner has not read ($1 learner). */
export const COUNT_UNREAD_NOTIFICATIONS: ReturnType<typeof sql> =
    sql`SELECT count(*)::int AS total FROM notifications WHERE learner_id = $1::uuid AND read_at IS NULL`

/** Marks the named unread notifications of a learner read and counts them ($1 learner, $2 ids, $3 read at). */
export const MARK_NOTIFICATIONS_READ: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE notifications SET read_at = $3::timestamptz
    WHERE learner_id = $1::uuid AND id = ANY($2::uuid[]) AND read_at IS NULL
    RETURNING id
)
SELECT count(*)::int AS total FROM changed`

/** Marks every unread notification of a learner read and counts them ($1 learner, $2 read at). */
export const MARK_ALL_NOTIFICATIONS_READ: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE notifications SET read_at = $2::timestamptz
    WHERE learner_id = $1::uuid AND read_at IS NULL
    RETURNING id
)
SELECT count(*)::int AS total FROM changed`
