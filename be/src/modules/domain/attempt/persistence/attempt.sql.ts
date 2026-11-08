import { sql } from "@modules/platform/database"

/**
 * Stores an attempt under its revision; no row comes back when the learner already submitted that revision of that lesson version ($1 learner,
 * $2 lesson, $3 version, $4 activity, $5 revision, $6 kind, $7 phase, $8 locale, $9 diagnostic, $10 answer, $11 status,
 * $12 result, $13 now, $14 graded time).
 */
export const INSERT_ATTEMPT: ReturnType<typeof sql> = sql`INSERT INTO lesson_attempts (
    learner_id, lesson_id, lesson_version, activity_id, revision, kind, phase, locale, is_diagnostic, answer, status, result,
    submitted_at, graded_at, updated_at
) VALUES (
    $1::uuid, $2::text, $3::text, $4::text, $5::int, $6::text, $7::text, $8::text, $9::boolean, $10::jsonb, $11::text,
    $12::jsonb, $13::timestamptz, $14::timestamptz, $13::timestamptz
)
ON CONFLICT (learner_id, lesson_id, lesson_version, activity_id, revision) DO NOTHING
RETURNING attempt_id, learner_id, lesson_id, lesson_version, activity_id, revision, kind, phase, locale, is_diagnostic, answer,
    status, result, failure_code, submitted_at, graded_at`

/** Reads the attempt of a revision of a lesson version and whether a resent answer equals it ($1 learner, $2 lesson, $3 version, $4 activity, $5 revision, $6 answer). */
export const SELECT_REPLAY: ReturnType<typeof sql> =
    sql`SELECT attempt_id, learner_id, lesson_id, lesson_version, activity_id,
    revision, kind, phase, locale, is_diagnostic, answer, status, result, failure_code, submitted_at, graded_at,
    (answer = $6::jsonb) AS same_answer
FROM lesson_attempts
WHERE learner_id = $1::uuid AND lesson_id = $2::text AND lesson_version = $3::text AND activity_id = $4::text
    AND revision = $5::int
LIMIT 1`

/** Reads one attempt of one learner ($1 learner, $2 attempt). */
export const SELECT_ATTEMPT: ReturnType<typeof sql> =
    sql`SELECT attempt_id, learner_id, lesson_id, lesson_version, activity_id,
    revision, kind, phase, locale, is_diagnostic, answer, status, result, failure_code, submitted_at, graded_at
FROM lesson_attempts
WHERE learner_id = $1::uuid AND attempt_id = $2::uuid`

/**
 * Takes an attempt for grading and answers it; no row comes back when it is graded, or when another run holds it and has not
 * been silent since the stale instant ($1 attempt, $2 now, $3 stale instant).
 */
export const CLAIM_GRADING: ReturnType<typeof sql> = sql`WITH claimed AS (
    UPDATE lesson_attempts SET status = 'grading', failure_code = NULL, updated_at = $2::timestamptz
    WHERE attempt_id = $1::uuid
        AND (status IN ('saved', 'failed') OR (status = 'grading' AND updated_at < $3::timestamptz))
    RETURNING attempt_id, learner_id, lesson_id, lesson_version, activity_id, revision, kind, phase, locale, is_diagnostic,
        answer, status, result, failure_code, submitted_at, graded_at
)
SELECT attempt_id, learner_id, lesson_id, lesson_version, activity_id, revision, kind, phase, locale, is_diagnostic, answer,
    status, result, failure_code, submitted_at, graded_at
FROM claimed`

/** Stores the grade of an attempt that is being graded and answers it; no row comes back when it is not being graded ($1 attempt, $2 result, $3 now). */
export const COMPLETE_GRADING: ReturnType<typeof sql> = sql`WITH completed AS (
    UPDATE lesson_attempts SET status = 'graded', result = $2::jsonb, failure_code = NULL, graded_at = $3::timestamptz,
        updated_at = $3::timestamptz
    WHERE attempt_id = $1::uuid AND status = 'grading'
    RETURNING attempt_id, learner_id, lesson_id, lesson_version, activity_id, revision, kind, phase, locale, is_diagnostic,
        answer, status, result, failure_code, submitted_at, graded_at
)
SELECT attempt_id, learner_id, lesson_id, lesson_version, activity_id, revision, kind, phase, locale, is_diagnostic, answer,
    status, result, failure_code, submitted_at, graded_at
FROM completed`

/** Marks an attempt that is being graded as failed with a code and answers it; no row comes back when it is not being graded ($1 attempt, $2 code, $3 now). */
export const FAIL_GRADING: ReturnType<typeof sql> = sql`WITH failed AS (
    UPDATE lesson_attempts SET status = 'failed', failure_code = $2::text, updated_at = $3::timestamptz
    WHERE attempt_id = $1::uuid AND status = 'grading'
    RETURNING attempt_id, learner_id, lesson_id, lesson_version, activity_id, revision, kind, phase, locale, is_diagnostic,
        answer, status, result, failure_code, submitted_at, graded_at
)
SELECT attempt_id, learner_id, lesson_id, lesson_version, activity_id, revision, kind, phase, locale, is_diagnostic, answer,
    status, result, failure_code, submitted_at, graded_at
FROM failed`

/** Counts the written answers of a learner the coach graded since an instant, the fair-use measure ($1 learner, $2 since). */
export const COUNT_COACH_GRADINGS: ReturnType<typeof sql> = sql`SELECT count(*)::int AS gradings
FROM lesson_attempts
WHERE learner_id = $1::uuid AND kind IN ('explain', 'exercise') AND status = 'graded' AND graded_at >= $2::timestamptz`

/**
 * Raises the levels of outcomes for a learner, never lowers them, and creates the outcome rows an attempt trains ($1 learner,
 * $2 lesson, $3 outcome ids, $4 understood, $5 proved, $6 now).
 */
export const UPSERT_OUTCOMES: ReturnType<typeof sql> = sql`INSERT INTO lesson_outcome_levels (
    learner_id, lesson_id, outcome_id, understood, proved, updated_at
)
SELECT $1::uuid, $2::text, trained.outcome_id, $4::smallint, $5::smallint, $6::timestamptz
FROM unnest($3::text[]) AS trained(outcome_id)
ON CONFLICT (learner_id, lesson_id, outcome_id) DO UPDATE SET
    understood = GREATEST(lesson_outcome_levels.understood, EXCLUDED.understood),
    proved = GREATEST(lesson_outcome_levels.proved, EXCLUDED.proved),
    updated_at = EXCLUDED.updated_at`

/** Lists the outcome levels of a learner in a lesson ($1 learner, $2 lesson, $3 row bound). */
export const SELECT_OUTCOMES: ReturnType<typeof sql> =
    sql`SELECT outcome_id, understood::int AS understood, proved::int AS proved
FROM lesson_outcome_levels
WHERE learner_id = $1::uuid AND lesson_id = $2::text
ORDER BY outcome_id
LIMIT $3::int`

/** Lists the newest attempt of each activity of a learner in a lesson, with the attempt count ($1 learner, $2 lesson, $3 row bound). */
export const SELECT_ACTIVITY_PROGRESS: ReturnType<typeof sql> =
    sql`SELECT DISTINCT ON (activity_id) activity_id, phase, kind,
    lesson_version, attempt_id, revision, status, submitted_at,
    (count(*) OVER (PARTITION BY activity_id))::int AS attempts
FROM lesson_attempts
WHERE learner_id = $1::uuid AND lesson_id = $2::text
ORDER BY activity_id, submitted_at DESC, revision DESC
LIMIT $3::int`
