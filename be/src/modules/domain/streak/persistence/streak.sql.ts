import { sql } from "@modules/platform/database"

/** Creates the state of a learner met for the first time and does nothing for one that has it ($1 learner, $2 yesterday, $3 this week's Monday, $4 goal, $5 freezes, $6 shard counters, $7 now). */
export const INSERT_STATE: ReturnType<typeof sql> = sql`INSERT INTO streak_states (
    learner_id, current_streak, longest_streak, last_closed_day, last_grant_week, weekly_goal, freezes_held,
    shard_counters, freeze_days, badges, reminder, updated_at
) VALUES ($1::uuid, 0, 0, $2::date, $3::date, $4::smallint, $5::smallint, $6::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, $7::timestamptz)
ON CONFLICT (learner_id) DO NOTHING`

/** Reads the state of a learner and locks it for the transaction ($1 learner). */
export const LOCK_STATE: ReturnType<typeof sql> =
    sql`SELECT current_streak, longest_streak, last_closed_day::text AS last_closed_day,
    last_grant_week::text AS last_grant_week, weekly_goal::int AS weekly_goal, freezes_held::int AS freezes_held,
    shard_counters, freeze_days, badges, reminder
FROM streak_states WHERE learner_id = $1::uuid FOR UPDATE`

/** Writes the state after the days were closed or an action changed it ($1 learner, $2 current, $3 longest, $4 last closed, $5 grant week, $6 goal, $7 freezes, $8 shard counters, $9 freeze days, $10 badges, $11 reminder, $12 now). */
export const UPDATE_STATE: ReturnType<typeof sql> = sql`UPDATE streak_states SET
    current_streak = $2::int, longest_streak = $3::int, last_closed_day = $4::date, last_grant_week = $5::date,
    weekly_goal = $6::smallint, freezes_held = $7::smallint, shard_counters = $8::jsonb, freeze_days = $9::jsonb,
    badges = $10::jsonb, reminder = $11::jsonb, updated_at = $12::timestamptz
WHERE learner_id = $1::uuid`

/** Lists the shards with an action on each day from a day through another ($1 learner, $2 from, $3 to, $4 row bound). */
export const SELECT_ACTION_DAYS: ReturnType<typeof sql> =
    sql`SELECT day::text AS day, array_agg(DISTINCT shard ORDER BY shard) AS shards
FROM streak_actions
WHERE learner_id = $1::uuid AND day >= $2::date AND day <= $3::date
GROUP BY day
ORDER BY day
LIMIT $4::int`

/** Stores an action once per learner and action id; no row comes back for a repeat ($1 learner, $2 action id (a new one when null), $3 shard, $4 kind, $5 source ref, $6 day, $7 now). */
export const INSERT_ACTION: ReturnType<typeof sql> =
    sql`INSERT INTO streak_actions (learner_id, action_id, shard, kind, source_ref, day, recorded_at)
VALUES ($1::uuid, COALESCE($2::text, gen_random_uuid()::text), $3::text, $4::text, $5::text, $6::date, $7::timestamptz)
ON CONFLICT (learner_id, action_id) DO NOTHING
RETURNING day::text AS day`
