import { sql } from "@modules/platform/database"

/** Reads the path a learner follows ($1 learner). */
export const SELECT_CHOICE: ReturnType<typeof sql> = sql`SELECT active_path_id,
    to_char(chosen_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS chosen_at
FROM path_choices WHERE learner_id = $1::uuid`

/**
 * Stores the choice of a learner, the first or a switch ($1 learner, $2 path, $3 now). Choosing the path already followed changes
 * nothing, so the time of the first choice stays and the history gains no entry.
 */
export const UPSERT_CHOICE: ReturnType<typeof sql> =
    sql`INSERT INTO path_choices (learner_id, active_path_id, chosen_at, history)
VALUES ($1::uuid, $2::text, $3::timestamptz,
    jsonb_build_array(jsonb_build_object('pathId', $2::text, 'chosenAt', to_char($3::timestamptz AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))))
ON CONFLICT (learner_id) DO UPDATE SET
    active_path_id = EXCLUDED.active_path_id,
    chosen_at = CASE WHEN path_choices.active_path_id = EXCLUDED.active_path_id THEN path_choices.chosen_at ELSE EXCLUDED.chosen_at END,
    history = CASE WHEN path_choices.active_path_id = EXCLUDED.active_path_id THEN path_choices.history ELSE path_choices.history || EXCLUDED.history END
RETURNING active_path_id,
    to_char(chosen_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS chosen_at`
