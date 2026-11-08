import { sql } from "@modules/platform/database"

/** The identifier of the purchase persisted under a rail and an order code ($1 = rail, $2 = order code). */
export const PURCHASE_ID_BY_ORDER: ReturnType<typeof sql> =
    sql`SELECT purchase_id FROM purchases WHERE rail = $1 AND order_code = $2`
