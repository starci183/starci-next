import { sql } from "@modules/platform/database"

/**
 * Stores one uploaded event once per (device, client event id); a resend inserts nothing and answers no row ($1 device,
 * $2 event, $3 learner, $4 kind, $5 task, $6 run, $7 check, $8 concept, $9 slot, $10 ref, $11 passed, $12 exit code,
 * $13 duration, $14 commit, $15 body, $16 now).
 */
export const INSERT_EVENT: ReturnType<typeof sql> = sql`INSERT INTO relay_events
    (device_id, event_id, learner_id, kind, task_id, run_id, check_id, concept_id, slot, ref, passed, exit_code, duration_ms,
     commit_sha, body, created_at)
VALUES ($1::uuid, $2::uuid, $3::uuid, $4::text, $5::text, $6::text, $7::text, $8::text, $9::text, $10::text, $11::boolean,
    $12::int, $13::int, $14::text, $15::text, $16::timestamptz)
ON CONFLICT (device_id, event_id) DO NOTHING
RETURNING event_id`

/** The check results of one task of the learner since a moment, oldest first ($1 learner, $2 task, $3 after or null, $4 bound). */
export const SELECT_TASK_RESULTS: ReturnType<typeof sql> =
    sql`SELECT event_id, run_id, concept_id, slot, ref, passed, commit_sha, created_at
FROM relay_events
WHERE learner_id = $1::uuid AND task_id = $2::text AND kind = 'check.result' AND concept_id IS NOT NULL AND slot IS NOT NULL
    AND ($3::timestamptz IS NULL OR created_at > $3::timestamptz)
ORDER BY created_at, event_id LIMIT $4::int`
