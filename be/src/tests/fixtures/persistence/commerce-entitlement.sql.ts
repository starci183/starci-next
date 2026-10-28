import { sql } from "@modules/platform/database"

/** One learner's persisted entitlement row ($1 = learner id). */
export const ENTITLEMENT_BY_LEARNER = sql`SELECT learner_id, premium_until, updated_at FROM entitlements WHERE learner_id = $1::uuid`
