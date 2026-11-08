import { sql } from "@modules/platform/database"

/** How many practice events a device stored ($1 device). */
export const COUNT_RELAY_EVENTS: ReturnType<typeof sql> =
    sql`SELECT count(*)::int AS n FROM relay_events WHERE device_id = $1::uuid`

/** The presence and last activity of a device ($1 device). */
export const RELAY_DEVICE_PRESENCE: ReturnType<typeof sql> =
    sql`SELECT online_since IS NOT NULL AS online, last_seen_at IS NOT NULL AS seen
FROM relay_devices WHERE id = $1::uuid`
