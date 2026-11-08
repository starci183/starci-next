import { sql } from "@modules/platform/database"

/**
 * Stores the state of a learner who was last seen some days ago ($1 learner, $2 current, $3 longest, $4 last closed day,
 * $5 week of the last freeze grant, $6 freezes held).
 */
export const STORE_STREAK_STATE: ReturnType<typeof sql> = sql`INSERT INTO streak_states (
    learner_id, current_streak, longest_streak, last_closed_day, last_grant_week, weekly_goal, freezes_held,
    shard_counters, freeze_days, badges, reminder, updated_at
) VALUES ($1::uuid, $2::int, $3::int, $4::date, $5::date, 4, $6::smallint, '{}'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, now())`

/** The actions of a learner as stored, oldest first ($1 learner). */
export const STORED_STREAK_ACTIONS: ReturnType<typeof sql> = sql`SELECT action_id, shard, kind, day::text AS day
FROM streak_actions WHERE learner_id = $1::uuid ORDER BY recorded_at, action_id`
