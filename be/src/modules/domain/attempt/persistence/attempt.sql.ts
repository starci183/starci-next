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

/** Lists the newest attempt of each activity of a learner in a lesson, whole, with the attempt count ($1 learner, $2 lesson, $3 row bound). */
export const SELECT_ACTIVITY_PROGRESS: ReturnType<typeof sql> =
    sql`SELECT DISTINCT ON (activity_id) attempt_id, learner_id, lesson_id, lesson_version, activity_id, revision, kind, phase,
    locale, is_diagnostic, answer, status, result, failure_code, submitted_at, graded_at,
    (count(*) OVER (PARTITION BY activity_id))::int AS attempts
FROM lesson_attempts
WHERE learner_id = $1::uuid AND lesson_id = $2::text
ORDER BY activity_id, submitted_at DESC, revision DESC
LIMIT $3::int`

/** Lists the activities of a lesson version that have a graded attempt ($1 learner, $2 lesson, $3 version, $4 row bound). */
export const SELECT_GRADED_ACTIVITY_IDS: ReturnType<typeof sql> = sql`SELECT DISTINCT activity_id
FROM lesson_attempts
WHERE learner_id = $1::uuid AND lesson_id = $2::text AND lesson_version = $3::text AND status = 'graded'
LIMIT $4::int`

/**
 * Records that a learner finished a lesson, once: the first instant stays, and the row held is answered either way
 * ($1 learner, $2 lesson, $3 version, $4 now).
 */
export const UPSERT_COMPLETION: ReturnType<typeof sql> = sql`INSERT INTO lesson_completions (
    learner_id, lesson_id, lesson_version, completed_at
) VALUES ($1::uuid, $2::text, $3::text, $4::timestamptz)
ON CONFLICT (learner_id, lesson_id) DO UPDATE SET lesson_version = lesson_completions.lesson_version
RETURNING lesson_version, completed_at`

/** Reads when a learner finished a lesson ($1 learner, $2 lesson). */
export const SELECT_COMPLETION: ReturnType<typeof sql> = sql`SELECT lesson_version, completed_at
FROM lesson_completions
WHERE learner_id = $1::uuid AND lesson_id = $2::text`

/**
 * Keeps where a learner stands in a simulation: the state and the path are replaced, the transitions tried only grow within a
 * version ($1 learner, $2 lesson, $3 activity, $4 version, $5 state, $6 actions, $7 transitions taken on the path, $8 now).
 */
export const UPSERT_SIMULATION_PROGRESS: ReturnType<typeof sql> = sql`INSERT INTO lesson_simulation_progress (
    learner_id, lesson_id, activity_id, lesson_version, current_state_id, action_ids, tried_transition_ids, updated_at
) VALUES ($1::uuid, $2::text, $3::text, $4::text, $5::text, $6::text[], $7::text[], $8::timestamptz)
ON CONFLICT (learner_id, lesson_id, activity_id) DO UPDATE SET
    tried_transition_ids = CASE WHEN lesson_simulation_progress.lesson_version = EXCLUDED.lesson_version THEN (
        SELECT COALESCE(array_agg(DISTINCT tried ORDER BY tried), '{}'::text[])
        FROM unnest(lesson_simulation_progress.tried_transition_ids || EXCLUDED.tried_transition_ids) AS tried
    ) ELSE EXCLUDED.tried_transition_ids END,
    lesson_version = EXCLUDED.lesson_version,
    current_state_id = EXCLUDED.current_state_id,
    action_ids = EXCLUDED.action_ids,
    updated_at = EXCLUDED.updated_at
RETURNING activity_id, current_state_id, action_ids, tried_transition_ids, updated_at`

/** Lists where a learner stands in the simulations of a lesson ($1 learner, $2 lesson, $3 row bound). */
export const SELECT_SIMULATION_PROGRESS: ReturnType<typeof sql> = sql`SELECT activity_id, current_state_id, action_ids,
    tried_transition_ids, updated_at
FROM lesson_simulation_progress
WHERE learner_id = $1::uuid AND lesson_id = $2::text
ORDER BY activity_id
LIMIT $3::int`

/**
 * Keeps the best incident mutation score of a learner in a lesson and answers the score now held ($1 learner, $2 lesson,
 * $3 score in percent, $4 now).
 */
export const UPSERT_INCIDENT_SCORE: ReturnType<typeof sql> =
    sql`INSERT INTO lesson_incident_scores (learner_id, lesson_id, mutation_score, updated_at)
VALUES ($1::uuid, $2::text, $3::smallint, $4::timestamptz)
ON CONFLICT (learner_id, lesson_id) DO UPDATE SET
    mutation_score = GREATEST(lesson_incident_scores.mutation_score, EXCLUDED.mutation_score),
    updated_at = CASE WHEN EXCLUDED.mutation_score > lesson_incident_scores.mutation_score THEN EXCLUDED.updated_at ELSE lesson_incident_scores.updated_at END
RETURNING mutation_score::int AS mutation_score`

/** Raises the proved level of the outcomes of a lesson that the learner understood fully, never lowering one ($1 learner, $2 lesson, $3 proved level, $4 now). */
export const RAISE_PROVED: ReturnType<typeof sql> = sql`UPDATE lesson_outcome_levels
SET proved = $3::smallint, updated_at = $4::timestamptz
WHERE learner_id = $1::uuid AND lesson_id = $2::text AND understood = 2 AND proved < $3::smallint`
