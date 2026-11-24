import { sql } from "@modules/platform/database"

/** The live version of one lab ($1 lesson). */
export const SELECT_PUBLISHED_LAB: ReturnType<typeof sql> = sql`SELECT version, content_hash, record
FROM course_labs WHERE lesson_id = $1::text AND published LIMIT 1`

/** One stored version of a lab, live or superseded ($1 lesson, $2 version). */
export const SELECT_LAB_VERSION: ReturnType<typeof sql> = sql`SELECT version, content_hash
FROM course_labs WHERE lesson_id = $1::text AND version = $2::text`

/** The lesson ids that have a live lab. */
export const SELECT_PUBLISHED_LAB_IDS: ReturnType<typeof sql> =
    sql`SELECT lesson_id FROM course_labs WHERE published ORDER BY lesson_id`

/** Marks the live version of a lab superseded ($1 lesson). */
export const SUPERSEDE_PUBLISHED_LAB: ReturnType<typeof sql> = sql`UPDATE course_labs SET published = false
WHERE lesson_id = $1::text AND published`

/** Makes a stored version the live one again ($1 lesson, $2 version). */
export const PUBLISH_LAB_VERSION: ReturnType<typeof sql> = sql`UPDATE course_labs SET published = true
WHERE lesson_id = $1::text AND version = $2::text`

/** Stores a new live version; no row comes back when the version already exists ($1 lesson, $2 version, $3 hash, $4 record, $5 now). */
export const INSERT_LAB_VERSION: ReturnType<typeof sql> = sql`INSERT INTO course_labs
    (lesson_id, version, content_hash, record, published, created_at)
VALUES ($1::text, $2::text, $3::text, $4::jsonb, true, $5::timestamptz)
ON CONFLICT (lesson_id, version) DO NOTHING
RETURNING lesson_id`

/** What the learner has done with every case of one lab ($1 learner, $2 lesson). */
export const SELECT_CASE_MARKS: ReturnType<typeof sql> = sql`SELECT case_id, hints_opened, ever_green
FROM course_case_marks WHERE learner_id = $1::uuid AND lesson_id = $2::text`

/** The newest run of every case of one lab for the learner ($1 learner, $2 lesson). */
export const SELECT_LATEST_CASE_RUNS: ReturnType<typeof sql> = sql`SELECT DISTINCT ON (case_id)
    case_id, status, ran_at, duration_ms, learner_commit, failed
FROM course_case_runs WHERE learner_id = $1::uuid AND lesson_id = $2::text
ORDER BY case_id, ran_at DESC, created_at DESC`

/** Serializes the writes of one learner's lab, so two uploads never decide an unlock on the same marks ($1 learner, $2 lesson). */
export const LOCK_COURSE_LAB: ReturnType<typeof sql> = sql`SELECT pg_advisory_xact_lock(
    hashtextextended('course-lab:' || $1::text || ':' || $2::text, 0)) AS locked`

/**
 * Stores one case run once per (learner, client event); a resend answers no row
 * ($1 learner, $2 lesson, $3 case, $4 kind, $5 status, $6 ran at, $7 duration, $8 commit, $9 chaos, $10 up to, $11 failed, $12 event, $13 now).
 */
export const INSERT_CASE_RUN: ReturnType<typeof sql> = sql`INSERT INTO course_case_runs
    (learner_id, lesson_id, case_id, kind, status, ran_at, duration_ms, learner_commit, chaos, up_to, failed, event_id, created_at)
VALUES ($1::uuid, $2::text, $3::text, $4::text, $5::text, $6::timestamptz, $7::int, $8::text,
    $9::jsonb, $10::jsonb, $11::jsonb, $12::uuid, $13::timestamptz)
ON CONFLICT (learner_id, event_id) DO NOTHING
RETURNING event_id`

/** Remembers that a case was green ($1 learner, $2 lesson, $3 case, $4 now). */
export const MARK_CASE_GREEN: ReturnType<typeof sql> = sql`INSERT INTO course_case_marks
    (learner_id, lesson_id, case_id, ever_green, updated_at)
VALUES ($1::uuid, $2::text, $3::text, true, $4::timestamptz)
ON CONFLICT (learner_id, lesson_id, case_id) DO UPDATE SET ever_green = true, updated_at = excluded.updated_at`

/** Records the hint levels opened for a case; a level never goes down ($1 learner, $2 lesson, $3 case, $4 level, $5 now). */
export const MARK_CASE_HINT: ReturnType<typeof sql> = sql`INSERT INTO course_case_marks
    (learner_id, lesson_id, case_id, hints_opened, updated_at)
VALUES ($1::uuid, $2::text, $3::text, $4::int, $5::timestamptz)
ON CONFLICT (learner_id, lesson_id, case_id) DO UPDATE SET
    hints_opened = GREATEST(course_case_marks.hints_opened, excluded.hints_opened), updated_at = excluded.updated_at`

/** Records a reset to the reference step ($1 learner, $2 lesson, $3 case, $4 stashed branch, $5 reset at, $6 now). */
export const MARK_CASE_RESET: ReturnType<typeof sql> = sql`INSERT INTO course_case_marks
    (learner_id, lesson_id, case_id, last_reset_at, stashed_branch, updated_at)
VALUES ($1::uuid, $2::text, $3::text, $5::timestamptz, $4::text, $6::timestamptz)
ON CONFLICT (learner_id, lesson_id, case_id) DO UPDATE SET
    last_reset_at = excluded.last_reset_at, stashed_branch = excluded.stashed_branch, updated_at = excluded.updated_at`

/** The live version of one course ($1 course). */
export const SELECT_PUBLISHED_COURSE: ReturnType<typeof sql> = sql`SELECT course_id, version, content_hash, record
FROM course_courses WHERE course_id = $1::text AND published LIMIT 1`

/** The live version of every course, by id. */
export const SELECT_PUBLISHED_COURSES: ReturnType<typeof sql> = sql`SELECT course_id, version, content_hash, record
FROM course_courses WHERE published ORDER BY course_id`

/** One stored version of a course, live or superseded ($1 course, $2 version). */
export const SELECT_COURSE_VERSION: ReturnType<typeof sql> = sql`SELECT course_id, version, content_hash
FROM course_courses WHERE course_id = $1::text AND version = $2::text`

/** The course ids that have a live record. */
export const SELECT_PUBLISHED_COURSE_IDS: ReturnType<typeof sql> =
    sql`SELECT course_id FROM course_courses WHERE published ORDER BY course_id`

/** Marks the live version of a course superseded ($1 course). */
export const SUPERSEDE_PUBLISHED_COURSE: ReturnType<typeof sql> = sql`UPDATE course_courses SET published = false
WHERE course_id = $1::text AND published`

/** Makes a stored version the live one again ($1 course, $2 version). */
export const PUBLISH_COURSE_VERSION: ReturnType<typeof sql> = sql`UPDATE course_courses SET published = true
WHERE course_id = $1::text AND version = $2::text`

/** Stores a new live version; no row comes back when the version already exists ($1 course, $2 version, $3 hash, $4 record, $5 now). */
export const INSERT_COURSE_VERSION: ReturnType<typeof sql> = sql`INSERT INTO course_courses
    (course_id, version, content_hash, record, published, created_at)
VALUES ($1::text, $2::text, $3::text, $4::jsonb, true, $5::timestamptz)
ON CONFLICT (course_id, version) DO NOTHING
RETURNING course_id`

/** The terms of the live lab of each lesson named ($1 lesson ids): a row means a lab record is live for the lesson. */
export const SELECT_LAB_TERMS: ReturnType<typeof sql> = sql`SELECT lesson_id, record->'allowedTerms' AS allowed_terms
FROM course_labs WHERE published AND lesson_id = ANY($1::text[])`

/** The live version of the files of one lab, without the record ($1 lesson): the record is large and read by slice. */
export const SELECT_PUBLISHED_LAB_FILES: ReturnType<typeof sql> = sql`SELECT version, content_hash
FROM course_lab_files WHERE lesson_id = $1::text AND published LIMIT 1`

/** One stored version of the files of a lab, live or superseded ($1 lesson, $2 version). */
export const SELECT_LAB_FILES_VERSION: ReturnType<typeof sql> = sql`SELECT version, content_hash
FROM course_lab_files WHERE lesson_id = $1::text AND version = $2::text`

/** The lesson ids that have live lab files. */
export const SELECT_PUBLISHED_LAB_FILES_IDS: ReturnType<typeof sql> =
    sql`SELECT lesson_id FROM course_lab_files WHERE published ORDER BY lesson_id`

/** Marks the live version of the files of a lab superseded ($1 lesson). */
export const SUPERSEDE_PUBLISHED_LAB_FILES: ReturnType<typeof sql> = sql`UPDATE course_lab_files SET published = false
WHERE lesson_id = $1::text AND published`

/** Makes a stored version of the files of a lab the live one again ($1 lesson, $2 version). */
export const PUBLISH_LAB_FILES_VERSION: ReturnType<typeof sql> = sql`UPDATE course_lab_files SET published = true
WHERE lesson_id = $1::text AND version = $2::text`

/** Stores a new live version; no row comes back when the version already exists ($1 lesson, $2 version, $3 hash, $4 record, $5 now). */
export const INSERT_LAB_FILES_VERSION: ReturnType<typeof sql> = sql`INSERT INTO course_lab_files
    (lesson_id, version, content_hash, record, published, created_at)
VALUES ($1::text, $2::text, $3::text, $4::jsonb, true, $5::timestamptz)
ON CONFLICT (lesson_id, version) DO NOTHING
RETURNING lesson_id`

/** The base, test and grader of the live files of a lab and how many files its NestJS version has, with no file text ($1 lesson). */
export const SELECT_LAB_FILES_META: ReturnType<typeof sql> = sql`SELECT jsonb_build_object(
    'base', record->'base', 'test', record->'test', 'grader', record->'grader',
    'nestjsFiles', jsonb_array_length(record->'framework'->'nestjs')) AS meta
FROM course_lab_files WHERE lesson_id = $1::text AND published LIMIT 1`

/** The learner checkout (c0) of the live files of a lab ($1 lesson). */
export const SELECT_LAB_FILES_SOURCE: ReturnType<typeof sql> = sql`SELECT record->'source' AS files
FROM course_lab_files WHERE lesson_id = $1::text AND published LIMIT 1`

/** The NestJS version of the live files of a lab ($1 lesson). */
export const SELECT_LAB_FILES_NESTJS: ReturnType<typeof sql> = sql`SELECT record->'framework'->'nestjs' AS files
FROM course_lab_files WHERE lesson_id = $1::text AND published LIMIT 1`

/** The hidden grading files of the live files of a lab ($1 lesson). */
export const SELECT_LAB_FILES_HIDDEN: ReturnType<typeof sql> = sql`SELECT record->'hidden' AS files
FROM course_lab_files WHERE lesson_id = $1::text AND published LIMIT 1`
