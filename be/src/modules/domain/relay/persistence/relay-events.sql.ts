import { sql } from "@modules/platform/database"

/**
 * Stores one uploaded event once per (device, client event id); a resend inserts nothing and answers no row ($1 device,
 * $2 event, $3 learner, $4 kind, $5 task, $6 run, $7 check, $8 concept, $9 slot, $10 ref, $11 passed, $12 exit code,
 * $13 duration, $14 commit, $15 body, $16 now, $17 detail of a lesson scenario result or null).
 */
export const INSERT_EVENT: ReturnType<typeof sql> = sql`INSERT INTO relay_events
    (device_id, event_id, learner_id, kind, task_id, run_id, check_id, concept_id, slot, ref, passed, exit_code, duration_ms,
     commit_sha, body, created_at, detail)
VALUES ($1::uuid, $2::uuid, $3::uuid, $4::text, $5::text, $6::text, $7::text, $8::text, $9::text, $10::text, $11::boolean,
    $12::int, $13::int, $14::text, $15::text, $16::timestamptz, $17::jsonb)
ON CONFLICT (device_id, event_id) DO NOTHING
RETURNING event_id`

/** The check results of one task of the learner since a moment, oldest first ($1 learner, $2 task, $3 after or null, $4 bound). */
export const SELECT_TASK_RESULTS: ReturnType<typeof sql> =
    sql`SELECT event_id, run_id, concept_id, slot, ref, passed, commit_sha, created_at
FROM relay_events
WHERE learner_id = $1::uuid AND task_id = $2::text AND kind = 'check.result' AND concept_id IS NOT NULL AND slot IS NOT NULL
    AND ($3::timestamptz IS NULL OR created_at > $3::timestamptz)
ORDER BY created_at, event_id LIMIT $4::int`

/**
 * The newest state of every check of one task of the learner: the latest started or result event per check id, with the
 * newest log line of that run and check ($1 learner, $2 task, $3 bound). A started event newer than every result is a run in
 * flight.
 */
export const SELECT_TASK_CHECKS: ReturnType<typeof sql> =
    sql`SELECT DISTINCT ON (e.check_id) e.check_id, e.kind, e.run_id,
    e.slot, e.ref, e.passed, e.exit_code, e.duration_ms, e.commit_sha, e.created_at, e.detail,
    (SELECT l.body FROM relay_events l
        WHERE l.learner_id = e.learner_id AND l.task_id = e.task_id AND l.run_id = e.run_id AND l.check_id = e.check_id
            AND l.kind = 'log'
        ORDER BY l.created_at DESC, l.event_id DESC LIMIT 1) AS output
FROM relay_events e
WHERE e.learner_id = $1::uuid AND e.task_id = $2::text AND e.kind IN ('check.started', 'check.result') AND e.check_id IS NOT NULL
ORDER BY e.check_id, e.created_at DESC, e.event_id DESC
LIMIT $3::int`
