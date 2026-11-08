import { sql } from "@modules/platform/database"

/** Reads the calls a learner made on a UTC day ($1 learner, $2 day). */
export const SELECT_CALLS: ReturnType<typeof sql> = sql`SELECT calls::int AS calls
FROM agent_lab_usage
WHERE learner_id = $1::uuid AND usage_day = $2::date
LIMIT 1`

/**
 * Counts one model call for a learner and a UTC day unless the day's limit is reached; no row comes back at the limit
 * ($1 learner, $2 day, $3 now, $4 limit).
 */
export const CONSUME_CALL: ReturnType<typeof sql> =
    sql`INSERT INTO agent_lab_usage (learner_id, usage_day, calls, updated_at)
SELECT $1::uuid, $2::date, 1, $3::timestamptz
WHERE $4::int > 0
ON CONFLICT (learner_id, usage_day) DO UPDATE SET calls = agent_lab_usage.calls + 1, updated_at = EXCLUDED.updated_at
WHERE agent_lab_usage.calls < $4::int
RETURNING calls::int AS calls`
