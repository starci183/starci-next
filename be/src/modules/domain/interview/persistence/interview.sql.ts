import { sql } from "@modules/platform/database"

/** Reads the hash and status a bank version was stored with ($1 bank, $2 version). */
export const SELECT_BANK_HASH: ReturnType<typeof sql> = sql`SELECT content_hash, status
FROM interview_banks
WHERE bank_id = $1::text AND version = $2::text`

/**
 * Stores a bank version as validated; no row comes back when the version already exists ($1 bank, $2 version, $3 hash, $4 family,
 * $5 course, $6 sort index, $7 difficulty, $8 titles, $9 descriptions, $10 module refs, $11 question count, $12 now).
 */
export const INSERT_BANK: ReturnType<typeof sql> = sql`INSERT INTO interview_banks (
    bank_id, version, content_hash, status, family, course, sort_index, difficulty, titles, descriptions, module_refs,
    question_count, imported_at
) VALUES (
    $1::text, $2::text, $3::text, 'validated', $4::text, $5::text, $6::int, $7::text, $8::jsonb, $9::jsonb, $10::text[],
    $11::int, $12::timestamptz
)
ON CONFLICT (bank_id, version) DO NOTHING
RETURNING bank_id`

/**
 * Stores one question of a bank version ($1 bank, $2 version, $3 question, $4 sort index, $5 premium, $6 family, $7 tier,
 * $8 kind, $9 tags, $10 competency, $11 leadership tier, $12 bodies, $13 interviewer, $14 grading).
 */
export const INSERT_QUESTION: ReturnType<typeof sql> = sql`INSERT INTO interview_questions (
    bank_id, bank_version, question_id, sort_index, is_premium, family, tier, kind, tags, competency, leadership_tier,
    bodies, interviewer, grading
) VALUES (
    $1::text, $2::text, $3::text, $4::int, $5::boolean, $6::text, $7::text, $8::text, $9::text[], $10::text, $11::text,
    $12::jsonb, $13::jsonb, $14::jsonb
)`

/** Marks the live version of a bank superseded ($1 bank). */
export const SUPERSEDE_BANK: ReturnType<typeof sql> = sql`UPDATE interview_banks SET status = 'superseded'
WHERE bank_id = $1::text AND status = 'published'`

/**
 * Publishes a validated bank version and answers its id; no row comes back when the version is not validated
 * ($1 bank, $2 version, $3 calibration, $4 now).
 */
export const PUBLISH_BANK: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE interview_banks
    SET status = 'published', calibration = $3::jsonb, published_at = $4::timestamptz
    WHERE bank_id = $1::text AND version = $2::text AND status IN ('validated', 'superseded')
    RETURNING bank_id
)
SELECT * FROM changed`

/** Lists the validated banks waiting for their calibration, newest first ($1 bank, empty for all, $2 row bound). */
export const SELECT_VALIDATED_BANKS: ReturnType<typeof sql> = sql`SELECT bank_id, version
FROM interview_banks
WHERE status = 'validated' AND ($1::text = '' OR bank_id = $1::text)
ORDER BY bank_id, version
LIMIT $2::int`

/** Reads the questions of a bank version with their grading data, for the calibration pre-check ($1 bank, $2 version, $3 row bound). */
export const SELECT_CALIBRATION_QUESTIONS: ReturnType<typeof sql> =
    sql`SELECT question_id, family, kind, bodies, grading
FROM interview_questions
WHERE bank_id = $1::text AND bank_version = $2::text AND family = 'technical'
ORDER BY sort_index
LIMIT $3::int`

/**
 * Lists the published questions of a tier in the banks the patterns name ($1 tier, $2 true for free questions only,
 * $3 `LIKE` patterns of the track's banks, $4 row bound).
 */
export const SELECT_POOL: ReturnType<typeof sql> =
    sql`SELECT q.question_id, q.bank_id, q.bank_version, q.family, q.tier, q.is_premium,
    ARRAY(SELECT jsonb_object_keys(q.bodies)) AS body_languages
FROM interview_questions q
JOIN interview_banks b ON b.bank_id = q.bank_id AND b.version = q.bank_version
WHERE b.status = 'published' AND q.tier = $1::text AND ($2::boolean = false OR NOT q.is_premium)
    AND q.bank_id LIKE ANY($3::text[])
ORDER BY q.bank_id, q.sort_index
LIMIT $4::int`

/** Lists the live banks with their tier, language and question counts, titled in one locale ($1 locale, $2 row bound). */
export const SELECT_BANK_OPTIONS: ReturnType<typeof sql> =
    sql`SELECT b.bank_id, b.family, b.titles ->> $1::text AS title, b.difficulty,
    ARRAY(SELECT DISTINCT q.tier FROM interview_questions q
        WHERE q.bank_id = b.bank_id AND q.bank_version = b.version ORDER BY q.tier) AS tiers,
    ARRAY(SELECT DISTINCT l FROM interview_questions q, jsonb_object_keys(q.bodies) AS l
        WHERE q.bank_id = b.bank_id AND q.bank_version = b.version ORDER BY l) AS languages,
    b.question_count,
    (SELECT count(*)::int FROM interview_questions q
        WHERE q.bank_id = b.bank_id AND q.bank_version = b.version AND NOT q.is_premium) AS free_question_count
FROM interview_banks b
WHERE b.status = 'published'
ORDER BY b.family, b.sort_index, b.bank_id
LIMIT $2::int`

/** Takes the per-learner lock for the rest of the transaction, so two starts of one learner never race ($1 learner). */
export const LOCK_LEARNER: ReturnType<typeof sql> = sql`SELECT pg_advisory_xact_lock(hashtext($1::text))`

/** Abandons the active session of a learner that has been idle since the instant, and answers its id ($1 learner, $2 idle instant, $3 now). */
export const ABANDON_IDLE: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE interview_sessions
    SET status = 'abandoned', updated_at = $3::timestamptz
    WHERE learner_id = $1::uuid AND status = 'active' AND last_activity_at < $2::timestamptz
    RETURNING session_id
)
SELECT session_id FROM changed`

/** Reads the active session of a learner ($1 learner). */
export const SELECT_ACTIVE_SESSION: ReturnType<typeof sql> = sql`SELECT *
FROM interview_sessions
WHERE learner_id = $1::uuid AND status = 'active'
LIMIT 1`

/** Counts the free sessions of a learner in a month, whatever became of them ($1 learner, $2 month). */
export const COUNT_FREE_SESSIONS: ReturnType<typeof sql> = sql`SELECT count(*)::int AS count
FROM interview_sessions
WHERE learner_id = $1::uuid AND access = 'free' AND free_month = $2::text`

/** Lists the question ids of the newest sessions of a learner on a track and tier, to prefer new ones ($1 learner, $2 track, $3 tier, $4 sessions, $5 rows). */
export const SELECT_RECENT_QUESTIONS: ReturnType<typeof sql> = sql`SELECT DISTINCT entry ->> 'questionId' AS question_id
FROM (
    SELECT questions FROM interview_sessions
    WHERE learner_id = $1::uuid AND track = $2::text AND tier = $3::text
    ORDER BY started_at DESC
    LIMIT $4::int
) recent, jsonb_array_elements(recent.questions) AS entry
LIMIT $5::int`

/**
 * Stores a session and answers it; no row comes back when the learner already started with this request id
 * ($1 learner, $2 request, $3 track, $4 tier, $5 locale, $6 language, $7 length, $8 access, $9 free month, $10 questions, $11 now).
 */
export const INSERT_SESSION: ReturnType<typeof sql> = sql`INSERT INTO interview_sessions (
    learner_id, client_request_id, track, tier, locale, language, length, access, free_month, questions, status,
    started_at, last_activity_at, updated_at
) VALUES (
    $1::uuid, $2::text, $3::text, $4::text, $5::text, $6::text, $7::int, $8::text, $9::text, $10::jsonb, 'active',
    $11::timestamptz, $11::timestamptz, $11::timestamptz
)
ON CONFLICT (learner_id, client_request_id) DO NOTHING
RETURNING *`

/** Reads the session a learner started with a request id ($1 learner, $2 request). */
export const SELECT_SESSION_BY_REQUEST: ReturnType<typeof sql> = sql`SELECT *
FROM interview_sessions
WHERE learner_id = $1::uuid AND client_request_id = $2::text
LIMIT 1`

/** Reads one session of one learner ($1 learner, $2 session). */
export const SELECT_SESSION: ReturnType<typeof sql> = sql`SELECT *
FROM interview_sessions
WHERE learner_id = $1::uuid AND session_id = $2::uuid`

/** Reads one session of one learner and locks its row for the transaction ($1 learner, $2 session). */
export const SELECT_SESSION_FOR_UPDATE: ReturnType<typeof sql> = sql`SELECT *
FROM interview_sessions
WHERE learner_id = $1::uuid AND session_id = $2::uuid
FOR UPDATE`

/**
 * Stores a turn after the last one of its session and answers it; no row comes back when the candidate already answered
 * this revision of this question ($1 session, $2 position, $3 role, $4 kind, $5 content, $6 revision, $7 by ai, $8 now).
 */
export const INSERT_TURN: ReturnType<typeof sql> = sql`INSERT INTO interview_turns (
    session_id, seq, position, role, kind, content, revision, by_ai, created_at
) VALUES (
    $1::uuid, (SELECT COALESCE(max(seq), -1) + 1 FROM interview_turns WHERE session_id = $1::uuid), $2::int, $3::text,
    $4::text, $5::text, $6::int, $7::boolean, $8::timestamptz
)
ON CONFLICT (session_id, position, revision) WHERE role = 'candidate' DO NOTHING
RETURNING turn_id, session_id, seq, position, role, kind, content, revision, by_ai, created_at`

/** Lists the turns of a session in order ($1 session, $2 row bound). */
export const SELECT_TURNS: ReturnType<typeof sql> =
    sql`SELECT turn_id, session_id, seq, position, role, kind, content, revision, by_ai, created_at
FROM interview_turns
WHERE session_id = $1::uuid
ORDER BY seq
LIMIT $2::int`

/** Moves the open question and records the activity ($1 session, $2 position, $3 now). */
export const UPDATE_POSITION: ReturnType<typeof sql> = sql`UPDATE interview_sessions
SET current_position = $2::int, last_activity_at = $3::timestamptz, updated_at = $3::timestamptz
WHERE session_id = $1::uuid`

/** Records the activity of the learner on a session ($1 session, $2 now). */
export const TOUCH_SESSION: ReturnType<typeof sql> = sql`UPDATE interview_sessions
SET last_activity_at = $2::timestamptz, updated_at = $2::timestamptz
WHERE session_id = $1::uuid`

/** Reads the public material of the questions a session drew ($1 bank ids, $2 versions, $3 question ids). */
export const SELECT_SESSION_QUESTIONS: ReturnType<typeof sql> =
    sql`SELECT q.bank_id, q.bank_version, q.question_id, q.family, q.tier, q.kind,
    q.bodies, q.interviewer, b.titles AS bank_titles, b.module_refs
FROM unnest($1::text[], $2::text[], $3::text[]) AS wanted(bank_id, bank_version, question_id)
JOIN interview_questions q ON q.bank_id = wanted.bank_id AND q.bank_version = wanted.bank_version
    AND q.question_id = wanted.question_id
JOIN interview_banks b ON b.bank_id = q.bank_id AND b.version = q.bank_version
LIMIT 100`

/** Reads the grading data of the questions a session drew; only the grader calls it ($1 bank ids, $2 versions, $3 question ids). */
export const SELECT_GRADING_QUESTIONS: ReturnType<typeof sql> =
    sql`SELECT q.bank_id, q.bank_version, q.question_id, q.family, q.kind,
    q.bodies, q.grading, b.module_refs
FROM unnest($1::text[], $2::text[], $3::text[]) AS wanted(bank_id, bank_version, question_id)
JOIN interview_questions q ON q.bank_id = wanted.bank_id AND q.bank_version = wanted.bank_version
    AND q.question_id = wanted.question_id
JOIN interview_banks b ON b.bank_id = q.bank_id AND b.version = q.bank_version
LIMIT 100`

/** Submits an active session of a learner and answers it; no row comes back when it is not active ($1 learner, $2 session, $3 now). */
export const SUBMIT_SESSION: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE interview_sessions
    SET status = 'submitted', submitted_at = $3::timestamptz, last_activity_at = $3::timestamptz, updated_at = $3::timestamptz
    WHERE learner_id = $1::uuid AND session_id = $2::uuid AND status = 'active'
    RETURNING *
)
SELECT * FROM changed`

/** (An UPDATE inside a CTE, so the driver answers the rows themselves rather than a rows-and-count pair.) Abandons an active session of a learner and answers it; no row comes back when it is not active ($1 learner, $2 session, $3 now). */
export const ABANDON_SESSION: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE interview_sessions
    SET status = 'abandoned', updated_at = $3::timestamptz
    WHERE learner_id = $1::uuid AND session_id = $2::uuid AND status = 'active'
    RETURNING *
)
SELECT * FROM changed`

/**
 * Takes a session for grading and answers it; no row comes back when it is graded, or when another run holds it and has not
 * been silent since the stale instant ($1 learner, $2 session, $3 now, $4 stale instant).
 */
export const CLAIM_GRADING: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE interview_sessions
    SET status = 'grading', failure_code = NULL, updated_at = $3::timestamptz
    WHERE learner_id = $1::uuid AND session_id = $2::uuid
        AND (status IN ('submitted', 'failed') OR (status = 'grading' AND updated_at < $4::timestamptz))
    RETURNING *
)
SELECT * FROM changed`

/**
 * Stores the scorecard of a session that is being graded and answers it; no row comes back when it is not being graded
 * ($1 session, $2 scorecard, $3 overall, $4 verdict, $5 technical score, $6 technical verdict, $7 behavioural score,
 * $8 behavioural verdict, $9 graded by, $10 now).
 */
export const COMPLETE_GRADING: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE interview_sessions
    SET status = 'graded', scorecard = $2::jsonb, failure_code = NULL, overall_score = $3::int, verdict = $4::text,
        technical_score = $5::int, technical_verdict = $6::text, behavioral_score = $7::int, behavioral_verdict = $8::text,
        graded_by = $9::jsonb, graded_at = $10::timestamptz, updated_at = $10::timestamptz
    WHERE session_id = $1::uuid AND status = 'grading'
    RETURNING *
)
SELECT * FROM changed`

/** Marks a session that is being graded as failed with a code and answers it ($1 session, $2 code, $3 now). */
export const FAIL_GRADING: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE interview_sessions
    SET status = 'failed', failure_code = $2::text, updated_at = $3::timestamptz
    WHERE session_id = $1::uuid AND status = 'grading'
    RETURNING *
)
SELECT * FROM changed`

/** Counts the AI calls a learner made since an instant: the interviewer turns the model wrote and the sessions graded ($1 learner, $2 since). */
export const COUNT_AI_CALLS: ReturnType<typeof sql> = sql`SELECT (
    (SELECT count(*) FROM interview_turns t JOIN interview_sessions s ON s.session_id = t.session_id
        WHERE s.learner_id = $1::uuid AND t.by_ai AND t.created_at >= $2::timestamptz)
    + (SELECT count(*) FROM interview_sessions
        WHERE learner_id = $1::uuid AND status = 'graded' AND graded_at >= $2::timestamptz)
)::int AS count`

/** Reads the overall score of the learner's newest graded session on a track and tier graded before an instant ($1 learner, $2 track, $3 tier, $4 before). */
export const SELECT_PREVIOUS_SCORE: ReturnType<typeof sql> = sql`SELECT overall_score
FROM interview_sessions
WHERE learner_id = $1::uuid AND track = $2::text AND tier = $3::text AND status = 'graded'
    AND graded_at < $4::timestamptz AND overall_score IS NOT NULL
ORDER BY graded_at DESC
LIMIT 1`

/** Lists the sessions of a learner, newest first ($1 learner, $2 track, empty for all, $3 row bound). */
export const SELECT_HISTORY: ReturnType<typeof sql> =
    sql`SELECT session_id, track, tier, started_at, status, overall_score, verdict
FROM interview_sessions
WHERE learner_id = $1::uuid AND ($2::text = '' OR track = $2::text)
ORDER BY started_at DESC
LIMIT $3::int`

/** Lists the best graded result of a learner for every track, family and tier ($1 learner, $2 row bound). */
export const SELECT_EVIDENCE: ReturnType<typeof sql> =
    sql`SELECT DISTINCT ON (track, tier, family) track, family, tier, score, verdict,
    session_id, graded_at
FROM (
    SELECT track, 'technical' AS family, tier, technical_score AS score, technical_verdict AS verdict, session_id, graded_at
    FROM interview_sessions
    WHERE learner_id = $1::uuid AND status = 'graded' AND technical_score IS NOT NULL
    UNION ALL
    SELECT track, 'behavioral' AS family, tier, behavioral_score AS score, behavioral_verdict AS verdict, session_id, graded_at
    FROM interview_sessions
    WHERE learner_id = $1::uuid AND status = 'graded' AND behavioral_score IS NOT NULL
) results
ORDER BY track, tier, family,
    (CASE verdict WHEN 'pass' THEN 2 WHEN 'borderline' THEN 1 ELSE 0 END) DESC, score DESC, graded_at DESC
LIMIT $2::int`
