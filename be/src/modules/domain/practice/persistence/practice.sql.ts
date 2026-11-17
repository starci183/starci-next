import { sql } from "@modules/platform/database"

/** Counts the live problems of every pattern and the ones a learner got accepted ($1 learner). */
export const SELECT_PATTERN_COUNTS: ReturnType<typeof sql> = sql`SELECT v.pattern_id, count(*)::int AS problem_count,
    (count(*) FILTER (WHERE st.accepted))::int AS accepted_count
FROM practice_problem_versions v
LEFT JOIN LATERAL (
    SELECT bool_or(s.verdict = 'accepted') AS accepted, count(*) AS tried
    FROM practice_submissions s
    WHERE s.learner_id = $1::uuid AND s.problem_id = v.problem_id AND s.kind = 'submit'
        AND s.verdict NOT IN ('queued', 'running', 'internal-error')
) st ON true
WHERE v.status = 'published'
GROUP BY v.pattern_id
LIMIT 200`

/** Lists the live problems of a pattern in order, titled in one locale, with the standing of a learner ($1 learner, $2 pattern, $3 locale, $4 row bound). */
export const SELECT_PATTERN_PROBLEMS: ReturnType<typeof sql> = sql`SELECT v.problem_id, v.titles ->> $3::text AS title,
    v.difficulty, v.tags, v.order_index,
    CASE WHEN st.accepted THEN 'accepted' WHEN st.tried > 0 THEN 'attempted' ELSE 'unsolved' END AS status,
    (r.revealed_at IS NOT NULL) AS solution_revealed,
    (r.revealed_at IS NOT NULL AND (st.first_accepted_at IS NULL OR r.revealed_at <= st.first_accepted_at)) AS solution_viewed
FROM practice_problem_versions v
LEFT JOIN LATERAL (
    SELECT bool_or(s.verdict = 'accepted') AS accepted, count(*) AS tried,
        min(s.created_at) FILTER (WHERE s.verdict = 'accepted') AS first_accepted_at
    FROM practice_submissions s
    WHERE s.learner_id = $1::uuid AND s.problem_id = v.problem_id AND s.kind = 'submit'
        AND s.verdict NOT IN ('queued', 'running', 'internal-error')
) st ON true
LEFT JOIN practice_solution_reveals r ON r.learner_id = $1::uuid AND r.problem_id = v.problem_id
WHERE v.status = 'published' AND v.pattern_id = $2::text
ORDER BY v.order_index, v.problem_id
LIMIT $4::int`

/** Reads the live version of one problem for a learner to open: no tests, no solutions ($1 slug). */
export const SELECT_PROBLEM: ReturnType<typeof sql> = sql`SELECT v.problem_id, v.version, v.pattern_id, v.order_index,
    v.difficulty, v.tags, v.time_limit_ms, v.memory_limit_kb, v.content, v.starter_codes, v.examples,
    (SELECT n.problem_id FROM practice_problem_versions n WHERE n.status = 'published' AND n.pattern_id = v.pattern_id
        AND (n.order_index, n.problem_id) > (v.order_index, v.problem_id)
        ORDER BY n.order_index, n.problem_id LIMIT 1) AS next_slug
FROM practice_problem_versions v
WHERE v.problem_id = $1::text AND v.status = 'published'
LIMIT 1`

/** Reads the live version of one problem for the judge: limits, examples and hidden tests ($1 slug). */
export const SELECT_JUDGING: ReturnType<typeof sql> = sql`SELECT v.problem_id, v.version, v.pattern_id, v.time_limit_ms,
    v.memory_limit_kb, v.examples, v.tests
FROM practice_problem_versions v
WHERE v.problem_id = $1::text AND v.status = 'published'
LIMIT 1`

/** Reads the standing of a learner on one problem ($1 learner, $2 slug). */
export const SELECT_STATUS: ReturnType<typeof sql> =
    sql`SELECT CASE WHEN st.accepted THEN 'accepted' WHEN st.tried > 0 THEN 'attempted' ELSE 'unsolved' END AS status,
    (r.revealed_at IS NOT NULL) AS solution_revealed,
    (r.revealed_at IS NOT NULL AND (st.first_accepted_at IS NULL OR r.revealed_at <= st.first_accepted_at)) AS solution_viewed
FROM practice_problem_versions v
LEFT JOIN LATERAL (
    SELECT bool_or(s.verdict = 'accepted') AS accepted, count(*) AS tried,
        min(s.created_at) FILTER (WHERE s.verdict = 'accepted') AS first_accepted_at
    FROM practice_submissions s
    WHERE s.learner_id = $1::uuid AND s.problem_id = v.problem_id AND s.kind = 'submit'
        AND s.verdict NOT IN ('queued', 'running', 'internal-error')
) st ON true
LEFT JOIN practice_solution_reveals r ON r.learner_id = $1::uuid AND r.problem_id = v.problem_id
WHERE v.problem_id = $2::text AND v.status = 'published'
LIMIT 1`

/** Takes the per-learner lock so the rate check and the insert of one learner cannot interleave ($1 learner). */
export const LOCK_LEARNER: ReturnType<typeof sql> = sql`SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))`

/** Counts the recent and the in-flight submissions of a learner ($1 learner, $2 window start, $3 stale instant). */
export const SELECT_RATE: ReturnType<typeof sql> = sql`SELECT
    (count(*) FILTER (WHERE created_at >= $2::timestamptz))::int AS recent,
    (count(*) FILTER (WHERE verdict IN ('queued', 'running') AND created_at >= $3::timestamptz))::int AS in_flight
FROM practice_submissions
WHERE learner_id = $1::uuid AND created_at >= LEAST($2::timestamptz, $3::timestamptz)`

/** Stores a queued submission and answers it ($1 learner, $2 problem, $3 version, $4 language, $5 kind, $6 source, $7 total tests, $8 now). */
export const INSERT_SUBMISSION: ReturnType<typeof sql> = sql`INSERT INTO practice_submissions (
    learner_id, problem_id, problem_version, language, kind, source, verdict, tests, passed_count, total_count,
    created_at, updated_at
) VALUES (
    $1::uuid, $2::text, $3::text, $4::text, $5::text, $6::text, 'queued', '[]'::jsonb, 0, $7::int,
    $8::timestamptz, $8::timestamptz
)
RETURNING submission_id, learner_id, problem_id, problem_version, language, kind, verdict, failure_code, compile_output,
    tests, passed_count, total_count, time_ms, memory_kb, created_at`

/** Reads one submission of one learner ($1 learner, $2 submission). */
export const SELECT_SUBMISSION: ReturnType<typeof sql> =
    sql`SELECT submission_id, learner_id, problem_id, problem_version,
    language, kind, verdict, failure_code, compile_output, tests, passed_count, total_count, time_ms, memory_kb, created_at
FROM practice_submissions
WHERE learner_id = $1::uuid AND submission_id = $2::uuid`

/** Marks a queued submission as running; no row comes back when it is no longer queued ($1 submission, $2 now). */
export const CLAIM_SUBMISSION: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE practice_submissions
    SET verdict = 'running', updated_at = $2::timestamptz
    WHERE submission_id = $1::uuid AND verdict = 'queued'
    RETURNING submission_id
)
SELECT submission_id FROM changed`

/**
 * Stores the verdict of a submission that is queued or running ($1 submission, $2 verdict, $3 tests, $4 passed, $5 total,
 * $6 compile output, $7 time, $8 memory, $9 failure code, $10 now).
 */
export const COMPLETE_SUBMISSION: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE practice_submissions
    SET verdict = $2::text, tests = $3::jsonb, passed_count = $4::int, total_count = $5::int, compile_output = $6::text,
        time_ms = $7::int, memory_kb = $8::int, failure_code = $9::text, updated_at = $10::timestamptz,
        finished_at = $10::timestamptz
    WHERE submission_id = $1::uuid AND verdict IN ('queued', 'running')
    RETURNING submission_id
)
SELECT submission_id FROM changed`

/** Marks the submissions of a learner that stayed queued or running past the stale instant as internal errors ($1 learner, $2 stale instant, $3 now). */
export const FAIL_STALE: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE practice_submissions
    SET verdict = 'internal-error', failure_code = 'PRACTICE_JUDGING_STALE', updated_at = $3::timestamptz,
        finished_at = $3::timestamptz
    WHERE learner_id = $1::uuid AND verdict IN ('queued', 'running') AND created_at < $2::timestamptz
    RETURNING submission_id
)
SELECT submission_id FROM changed`

/** Reads the highest hint step a learner opened on a problem ($1 learner, $2 problem). */
export const SELECT_HINT_HIGHEST: ReturnType<typeof sql> = sql`SELECT max(step)::int AS highest
FROM practice_hint_reveals
WHERE learner_id = $1::uuid AND problem_id = $2::text`

/** Lists the hint steps a learner opened on a problem ($1 learner, $2 problem). */
export const SELECT_HINT_STEPS: ReturnType<typeof sql> = sql`SELECT step::int AS step
FROM practice_hint_reveals
WHERE learner_id = $1::uuid AND problem_id = $2::text
ORDER BY step
LIMIT 3`

/** Records that a learner opened a hint step; opening it again changes nothing ($1 learner, $2 problem, $3 step, $4 now). */
export const INSERT_HINT_REVEAL: ReturnType<typeof sql> =
    sql`INSERT INTO practice_hint_reveals (learner_id, problem_id, step, revealed_at)
VALUES ($1::uuid, $2::text, $3::smallint, $4::timestamptz)
ON CONFLICT (learner_id, problem_id, step) DO NOTHING`

/** Reads the content hash a version was stored with ($1 problem, $2 version). */
export const SELECT_VERSION_HASH: ReturnType<typeof sql> = sql`SELECT content_hash
FROM practice_problem_versions
WHERE problem_id = $1::text AND version = $2::text`

/** Marks the live version of a problem superseded ($1 problem). */
export const SUPERSEDE_PUBLISHED: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE practice_problem_versions SET status = 'superseded'
    WHERE problem_id = $1::text AND status = 'published'
    RETURNING problem_id
)
SELECT problem_id FROM changed`

/**
 * Stores a new live version; no row comes back when the version already exists ($1 problem, $2 version, $3 hash, $4 pattern,
 * $5 order, $6 difficulty, $7 tags, $8 time limit, $9 memory limit, $10 titles, $11 content, $12 starter codes, $13 examples,
 * $14 tests, $15 solutions, $16 source hashes, $17 import time, $18 solution explanations).
 */
export const INSERT_VERSION: ReturnType<typeof sql> = sql`INSERT INTO practice_problem_versions (
    problem_id, version, content_hash, status, pattern_id, order_index, difficulty, tags, time_limit_ms, memory_limit_kb,
    titles, content, starter_codes, examples, tests, solutions, source_hashes, imported_at, explanations
) VALUES (
    $1::text, $2::text, $3::text, 'published', $4::text, $5::int, $6::text, $7::jsonb, $8::int, $9::int,
    $10::jsonb, $11::jsonb, $12::jsonb, $13::jsonb, $14::jsonb, $15::jsonb, $16::jsonb, $17::timestamptz, $18::jsonb
)
ON CONFLICT (problem_id, version) DO NOTHING
RETURNING problem_id`

/** Reads the introductions of the patterns in one locale ($1 locale). */
export const SELECT_PATTERN_INTROS: ReturnType<typeof sql> = sql`SELECT pattern_id, intro
FROM practice_pattern_intros
WHERE locale = $1::text
LIMIT 200`

/** Stores the introduction of a pattern in a locale, replacing the one before ($1 pattern, $2 locale, $3 intro, $4 now). */
export const UPSERT_PATTERN_INTRO: ReturnType<typeof sql> =
    sql`INSERT INTO practice_pattern_intros (pattern_id, locale, intro, updated_at)
VALUES ($1::text, $2::text, $3::text, $4::timestamptz)
ON CONFLICT (pattern_id, locale) DO UPDATE SET intro = EXCLUDED.intro, updated_at = EXCLUDED.updated_at`

/**
 * Reads the first live problem a learner has not got accepted, patterns in the order of the catalog, problems in their order
 * ($1 learner, $2 pattern or null for every pattern, $3 locale, $4 the pattern ids in catalog order).
 */
export const SELECT_NEXT_PROBLEM: ReturnType<typeof sql> =
    sql`SELECT v.problem_id, v.titles ->> $3::text AS title, v.pattern_id,
    ((SELECT count(*)::int FROM practice_problem_versions o WHERE o.status = 'published' AND o.pattern_id = v.pattern_id
        AND (o.order_index, o.problem_id) < (v.order_index, v.problem_id)) + 1) AS position,
    (SELECT count(*)::int FROM practice_problem_versions o WHERE o.status = 'published' AND o.pattern_id = v.pattern_id) AS pattern_problem_count
FROM practice_problem_versions v
WHERE v.status = 'published' AND ($2::text IS NULL OR v.pattern_id = $2::text)
    AND NOT EXISTS (
        SELECT 1 FROM practice_submissions s
        WHERE s.learner_id = $1::uuid AND s.problem_id = v.problem_id AND s.kind = 'submit' AND s.verdict = 'accepted'
    )
ORDER BY COALESCE(array_position($4::text[], v.pattern_id), cardinality($4::text[]) + 1), v.order_index, v.problem_id
LIMIT 1`

/**
 * Reads the live problem a learner submitted most recently and never got accepted, with the graded submits it took and the
 * latest one's tests ($1 learner, $2 pattern or null for every pattern, $3 locale).
 */
export const SELECT_RESUME_PROBLEM: ReturnType<typeof sql> =
    sql`SELECT v.problem_id, v.titles ->> $3::text AS title, v.pattern_id,
    g.attempts, g.last_verdict, g.last_tests
FROM (
    SELECT s.problem_id, count(*)::int AS attempts, max(s.created_at) AS last_at,
        (array_agg(s.verdict ORDER BY s.created_at DESC))[1] AS last_verdict,
        (array_agg(s.tests ORDER BY s.created_at DESC))[1] AS last_tests
    FROM practice_submissions s
    WHERE s.learner_id = $1::uuid AND s.kind = 'submit' AND s.verdict NOT IN ('queued', 'running', 'internal-error')
    GROUP BY s.problem_id
    HAVING NOT bool_or(s.verdict = 'accepted')
) g
JOIN practice_problem_versions v ON v.problem_id = g.problem_id AND v.status = 'published'
WHERE ($2::text IS NULL OR v.pattern_id = $2::text)
ORDER BY g.last_at DESC
LIMIT 1`

/** Reads the reference solutions and their explanations of the live version of a problem ($1 slug). */
export const SELECT_SOLUTION: ReturnType<typeof sql> = sql`SELECT problem_id, solutions, explanations
FROM practice_problem_versions
WHERE problem_id = $1::text AND status = 'published'
LIMIT 1`

/** Records that a learner revealed the solution of a problem; a second reveal changes nothing ($1 learner, $2 problem, $3 now). */
export const INSERT_SOLUTION_REVEAL: ReturnType<typeof sql> =
    sql`INSERT INTO practice_solution_reveals (learner_id, problem_id, revealed_at)
VALUES ($1::uuid, $2::text, $3::timestamptz)
ON CONFLICT (learner_id, problem_id) DO NOTHING`

/** Reads when a learner revealed a solution and whether that came before the first Accepted ($1 learner, $2 problem). */
export const SELECT_SOLUTION_REVEAL: ReturnType<typeof sql> = sql`SELECT r.revealed_at,
    (NOT EXISTS (
        SELECT 1 FROM practice_submissions s
        WHERE s.learner_id = r.learner_id AND s.problem_id = r.problem_id AND s.kind = 'submit' AND s.verdict = 'accepted'
            AND s.created_at < r.revealed_at
    )) AS viewed_before_accepted
FROM practice_solution_reveals r
WHERE r.learner_id = $1::uuid AND r.problem_id = $2::text`

/**
 * Counts the live problems of one pattern, how many a learner got accepted and how many have a solution revealed before the
 * first Accepted ($1 learner, $2 pattern).
 */
export const SELECT_PATTERN_COMPLETION: ReturnType<typeof sql> =
    sql`SELECT v.pattern_id, count(*)::int AS problem_count,
    (count(*) FILTER (WHERE st.accepted))::int AS accepted_count,
    (count(*) FILTER (WHERE r.revealed_at IS NOT NULL AND (st.first_accepted_at IS NULL OR r.revealed_at <= st.first_accepted_at)))::int AS viewed_count
FROM practice_problem_versions v
LEFT JOIN LATERAL (
    SELECT bool_or(s.verdict = 'accepted') AS accepted,
        min(s.created_at) FILTER (WHERE s.verdict = 'accepted') AS first_accepted_at
    FROM practice_submissions s
    WHERE s.learner_id = $1::uuid AND s.problem_id = v.problem_id AND s.kind = 'submit'
        AND s.verdict NOT IN ('queued', 'running', 'internal-error')
) st ON true
LEFT JOIN practice_solution_reveals r ON r.learner_id = $1::uuid AND r.problem_id = v.problem_id
WHERE v.status = 'published' AND v.pattern_id = $2::text
GROUP BY v.pattern_id
LIMIT 1`

/** Reads the language a learner got most problems of a pattern accepted in ($1 learner, $2 pattern). */
export const SELECT_PATTERN_LANGUAGE: ReturnType<typeof sql> = sql`SELECT s.language
FROM practice_submissions s
JOIN practice_problem_versions v ON v.problem_id = s.problem_id AND v.status = 'published'
WHERE s.learner_id = $1::uuid AND v.pattern_id = $2::text AND s.kind = 'submit' AND s.verdict = 'accepted'
GROUP BY s.language
ORDER BY count(DISTINCT s.problem_id) DESC, s.language
LIMIT 1`
