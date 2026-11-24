import { sql } from "@modules/platform/database"

/** Records the client event id of a lab upload once per (device, event); a resend answers no row ($1 device, $2 event, $3 now). */
export const INSERT_LAB_EVENT: ReturnType<typeof sql> =
    sql`INSERT INTO relay_lab_events (device_id, event_id, created_at)
VALUES ($1::uuid, $2::uuid, $3::timestamptz)
ON CONFLICT (device_id, event_id) DO NOTHING
RETURNING event_id`

/**
 * Reports one boot stage of a lab ($1 learner, $2 course, $3 lesson, $4 device, $5 the stage as a one-key object, $6 now, $7 true
 * when the stage starts the boot over: the machine stage running replaces every earlier stage).
 */
export const UPSERT_LAB_BOOT: ReturnType<typeof sql> = sql`INSERT INTO relay_lab_states
    (learner_id, course_id, lesson_id, device_id, boot, updated_at)
VALUES ($1::uuid, $2::text, $3::text, $4::uuid, $5::jsonb, $6::timestamptz)
ON CONFLICT (learner_id, course_id, lesson_id) DO UPDATE SET
    device_id = excluded.device_id,
    boot = CASE WHEN $7::boolean THEN excluded.boot ELSE relay_lab_states.boot || excluded.boot END,
    updated_at = excluded.updated_at`

/** Reports one run of the visible tests ($1 learner, $2 course, $3 lesson, $4 device, $5 run json, $6 chaos on json, $7 now). */
export const UPSERT_LAB_TESTS: ReturnType<typeof sql> = sql`INSERT INTO relay_lab_states
    (learner_id, course_id, lesson_id, device_id, tests, chaos_on, last_synced_at, updated_at)
VALUES ($1::uuid, $2::text, $3::text, $4::uuid, $5::jsonb, $6::jsonb, $7::timestamptz, $7::timestamptz)
ON CONFLICT (learner_id, course_id, lesson_id) DO UPDATE SET
    device_id = excluded.device_id, tests = excluded.tests, chaos_on = excluded.chaos_on,
    last_synced_at = excluded.last_synced_at, updated_at = excluded.updated_at`

/** Stores the merged mirrored files ($1 learner, $2 course, $3 lesson, $4 device, $5 files json, $6 now). */
export const UPSERT_LAB_FILES: ReturnType<typeof sql> = sql`INSERT INTO relay_lab_states
    (learner_id, course_id, lesson_id, device_id, files, last_synced_at, updated_at)
VALUES ($1::uuid, $2::text, $3::text, $4::uuid, $5::jsonb, $6::timestamptz, $6::timestamptz)
ON CONFLICT (learner_id, course_id, lesson_id) DO UPDATE SET
    device_id = excluded.device_id, files = excluded.files,
    last_synced_at = excluded.last_synced_at, updated_at = excluded.updated_at`

/** The mirrored files held for one lab of the learner, to merge an upload into them ($1 learner, $2 course, $3 lesson). */
export const SELECT_LAB_FILES: ReturnType<typeof sql> = sql`SELECT files FROM relay_lab_states
WHERE learner_id = $1::uuid AND course_id = $2::text AND lesson_id = $3::text LIMIT 1`

/** Serializes the state writes of one learner's lab, so two file uploads never lose each other's paths ($1 learner, $2 course, $3 lesson). */
export const LOCK_LAB_STATE: ReturnType<typeof sql> = sql`SELECT pg_advisory_xact_lock(
    hashtextextended('relay-lab-state:' || $1::text || ':' || $2::text || ':' || $3::text, 0)) AS locked`

/** The state of one lab of the learner ($1 learner, $2 course, $3 lesson). */
export const SELECT_LAB_STATE: ReturnType<typeof sql> =
    sql`SELECT boot, tests, files, chaos_on, last_synced_at, updated_at
FROM relay_lab_states WHERE learner_id = $1::uuid AND course_id = $2::text AND lesson_id = $3::text LIMIT 1`

/** The newest log chunks of one lab task, newest first ($1 learner, $2 task, $3 bound). */
export const SELECT_LAB_LOGS: ReturnType<typeof sql> = sql`SELECT check_id, body, created_at FROM relay_events
WHERE learner_id = $1::uuid AND task_id = $2::text AND kind = 'log' AND check_id IS NOT NULL AND body IS NOT NULL
ORDER BY created_at DESC, event_id DESC LIMIT $3::int`

/** The learner's newest submission of one lab ($1 learner, $2 course, $3 lesson). */
export const SELECT_LATEST_SUBMISSION: ReturnType<typeof sql> =
    sql`SELECT id, status, passed, reject_reason, commit_sha, tests,
    hints_opened, time_spent_ms, created_at, graded_at
FROM relay_lab_submissions WHERE learner_id = $1::uuid AND course_id = $2::text AND lesson_id = $3::text
ORDER BY created_at DESC, id LIMIT 1`

/** True once a submission of the learner's lab was graded and passed ($1 learner, $2 course, $3 lesson). */
export const SELECT_LAB_SOLVED: ReturnType<typeof sql> = sql`SELECT EXISTS (
    SELECT 1 FROM relay_lab_submissions
    WHERE learner_id = $1::uuid AND course_id = $2::text AND lesson_id = $3::text AND status = 'graded' AND passed
) AS solved`

/** The learner's submissions of one lab that are queued or running ($1 learner, $2 course, $3 lesson). */
export const SELECT_OPEN_SUBMISSIONS: ReturnType<typeof sql> = sql`SELECT id, created_at FROM relay_lab_submissions
WHERE learner_id = $1::uuid AND course_id = $2::text AND lesson_id = $3::text AND status IN ('queued', 'running')
ORDER BY created_at DESC, id FOR UPDATE`

/** Rejects one open submission with a reason ($1 id, $2 reason, $3 now). */
export const REJECT_OPEN_SUBMISSION: ReturnType<typeof sql> = sql`UPDATE relay_lab_submissions
SET status = 'rejected', reject_reason = $2::text, graded_at = $3::timestamptz
WHERE id = $1::uuid AND status IN ('queued', 'running')
RETURNING id`

/** Serializes the submissions of one learner's lab ($1 learner, $2 course, $3 lesson). */
export const LOCK_LAB_SUBMISSIONS: ReturnType<typeof sql> = sql`SELECT pg_advisory_xact_lock(
    hashtextextended('relay-lab:' || $1::text || ':' || $2::text || ':' || $3::text, 0)) AS locked`

/**
 * Creates a queued submission ($1 learner, $2 course, $3 lesson, $4 nonce, $5 seed order json, $6 hints opened, $7 time spent,
 * $8 design document json, $9 device, $10 now).
 */
export const INSERT_SUBMISSION: ReturnType<typeof sql> = sql`INSERT INTO relay_lab_submissions
    (learner_id, course_id, lesson_id, nonce, seed_order, status, hints_opened, time_spent_ms, design_doc, device_id, created_at)
VALUES ($1::uuid, $2::text, $3::text, $4::text, $5::jsonb, 'queued', $6::int, $7::int, $8::jsonb, $9::uuid, $10::timestamptz)
RETURNING id`

/** Marks a queued submission running, just before its manifest is pushed ($1 id). */
export const SET_SUBMISSION_RUNNING: ReturnType<typeof sql> = sql`UPDATE relay_lab_submissions SET status = 'running'
WHERE id = $1::uuid AND status = 'queued' RETURNING id`

/** Locks one submission, whatever its state ($1 id). */
export const LOCK_SUBMISSION: ReturnType<typeof sql> =
    sql`SELECT id, learner_id, course_id, lesson_id, nonce, status, device_id
FROM relay_lab_submissions WHERE id = $1::uuid LIMIT 1 FOR UPDATE`

/** Finishes a running submission as graded ($1 id, $2 commit, $3 tests json, $4 passed, $5 now). */
export const GRADE_SUBMISSION: ReturnType<typeof sql> = sql`UPDATE relay_lab_submissions
SET status = 'graded', commit_sha = $2::text, tests = $3::jsonb, passed = $4::boolean, graded_at = $5::timestamptz
WHERE id = $1::uuid AND status = 'running' RETURNING id`

/** Finishes a running submission as rejected ($1 id, $2 reason, $3 now). */
export const REJECT_RUNNING_SUBMISSION: ReturnType<typeof sql> = sql`UPDATE relay_lab_submissions
SET status = 'rejected', reject_reason = $2::text, graded_at = $3::timestamptz
WHERE id = $1::uuid AND status = 'running' RETURNING id`

/** The public key a device registered ($1 device). */
export const SELECT_DEVICE_KEY: ReturnType<typeof sql> = sql`SELECT public_key FROM relay_devices
WHERE device_id = $1::uuid AND status = 'active' LIMIT 1`

/** The public keys of the learner's active devices, by device ($1 learner). */
export const SELECT_LEARNER_DEVICE_KEYS: ReturnType<typeof sql> = sql`SELECT device_id, public_key FROM relay_devices
WHERE learner_id = $1::uuid AND status = 'active'`

/** Registers the public key of an active device, once ($1 device, $2 public key). */
export const REGISTER_DEVICE_KEY: ReturnType<typeof sql> = sql`UPDATE relay_devices SET public_key = $2::text
WHERE device_id = $1::uuid AND status = 'active' AND public_key IS NULL RETURNING device_id`

/** Drops the pairing codes that lapsed or were used, and the learner's earlier ones ($1 learner, $2 now). */
export const PURGE_PAIR_CODES: ReturnType<typeof sql> = sql`DELETE FROM relay_pair_codes
WHERE expires_at < $2::timestamptz OR used_at IS NOT NULL OR learner_id = $1::uuid`

/** Stores a new pairing code by its digest; a digest already held answers no row ($1 digest, $2 learner, $3 now, $4 expiry). */
export const INSERT_PAIR_CODE: ReturnType<typeof sql> =
    sql`INSERT INTO relay_pair_codes (code_digest, learner_id, created_at, expires_at)
VALUES ($1::varchar, $2::uuid, $3::timestamptz, $4::timestamptz)
ON CONFLICT (code_digest) DO NOTHING
RETURNING id`

/** The live unused pairing code a digest names, locked ($1 digest, $2 now). */
export const LOCK_PAIR_CODE: ReturnType<typeof sql> = sql`SELECT id, learner_id FROM relay_pair_codes
WHERE code_digest = $1::varchar AND used_at IS NULL AND expires_at > $2::timestamptz LIMIT 1 FOR UPDATE`

/** Spends a pairing code ($1 id, $2 now). */
export const USE_PAIR_CODE: ReturnType<typeof sql> = sql`UPDATE relay_pair_codes SET used_at = $2::timestamptz
WHERE id = $1::uuid AND used_at IS NULL RETURNING id`

/**
 * Creates an active device for a claimed pairing code ($1 learner, $2 name, $3 platform, $4 device code digest, $5 user code,
 * $6 token digest, $7 now).
 */
export const INSERT_CLAIMED_DEVICE: ReturnType<typeof sql> = sql`INSERT INTO relay_devices
    (learner_id, name, platform, device_code_digest, user_code, status, token_digest, created_at, expires_at, confirmed_at)
VALUES ($1::uuid, $2::text, $3::text, $4::varchar, $5::varchar, 'active', $6::varchar, $7::timestamptz, $7::timestamptz, $7::timestamptz)
RETURNING device_id`
