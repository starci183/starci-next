import { sql } from "@modules/platform/database"

/**
 * Lists the live version of every lesson in catalog order, titled in one locale ($1 row bound, $2 locale, $3 category,
 * $4 difficulty, $5 implementation language, $6 provider, $7 search text, $8 group, $9 topic; a null filter does not
 * apply). No lesson declares a provider yet, so a provider filter matches none.
 */
export const SELECT_CATALOG: ReturnType<typeof sql> = sql`SELECT v.lesson_id, v.version, v.category, v.lesson_group,
    v.topic, COALESCE(t.title, v.topic) AS topic_title, v.difficulty, v.minutes_read, v.implementation,
    v.titles ->> $2::text AS title, v.descriptions ->> $2::text AS description
FROM lesson_versions v
LEFT JOIN lesson_topics t ON t.topic = v.topic
WHERE v.status = 'published'
    AND ($3::text IS NULL OR v.category = $3::text)
    AND ($4::text IS NULL OR v.difficulty = $4::text)
    AND ($5::text IS NULL OR v.implementation = $5::text)
    AND $6::text IS NULL
    AND ($7::text IS NULL OR position(lower($7::text) IN lower(
        (v.titles ->> $2::text) || ' ' || (v.descriptions ->> $2::text))) > 0)
    AND ($8::text IS NULL OR v.lesson_group = $8::text)
    AND ($9::text IS NULL OR v.topic = $9::text)
ORDER BY v.sort_index, v.lesson_id
LIMIT $1::int`

/** Reads the live version of one lesson with its content ($1 lesson). */
export const SELECT_PUBLISHED: ReturnType<typeof sql> = sql`SELECT v.lesson_id, v.version, v.category, v.lesson_group,
    v.topic, COALESCE(t.title, v.topic) AS topic_title, v.difficulty, v.minutes_read, v.implementation, v.content
FROM lesson_versions v
LEFT JOIN lesson_topics t ON t.topic = v.topic
WHERE v.lesson_id = $1::text AND v.status = 'published'
LIMIT 1`

/** Reads one stored version with its content, live or superseded ($1 lesson, $2 version). */
export const SELECT_VERSION: ReturnType<typeof sql> = sql`SELECT v.lesson_id, v.version, v.category, v.lesson_group,
    v.topic, COALESCE(t.title, v.topic) AS topic_title, v.difficulty, v.minutes_read, v.implementation, v.content
FROM lesson_versions v
LEFT JOIN lesson_topics t ON t.topic = v.topic
WHERE v.lesson_id = $1::text AND v.version = $2::text
LIMIT 1`

/** Reads the content hash and the topic path source a version was stored with ($1 lesson, $2 version). */
export const SELECT_VERSION_HASH: ReturnType<typeof sql> = sql`SELECT content_hash, source_key
FROM lesson_versions
WHERE lesson_id = $1::text AND version = $2::text`

/**
 * Points an identical version at the topic path row the catalog names now ($1 lesson, $2 version, $3 source folder). The
 * source folder is placement metadata, not content, so it is not part of the hash and does not make a version immutable.
 */
export const UPDATE_SOURCE_KEY: ReturnType<typeof sql> = sql`UPDATE lesson_versions SET source_key = $3::text
WHERE lesson_id = $1::text AND version = $2::text`

/** Marks the live version of a lesson superseded and answers the ids it changed ($1 lesson). */
export const SUPERSEDE_PUBLISHED: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE lesson_versions SET status = 'superseded'
    WHERE lesson_id = $1::text AND status = 'published'
    RETURNING lesson_id
)
SELECT lesson_id FROM changed`

/**
 * Stores a new live version; no row comes back when the version already exists ($1 lesson, $2 version, $3 hash,
 * $4 category, $5 difficulty, $6 minutes, $7 implementation, $8 sort index, $9 titles, $10 descriptions,
 * $11 source hashes, $12 content, $13 import time, $14 group, $15 topic, $16 source content folder).
 */
export const INSERT_VERSION: ReturnType<typeof sql> = sql`INSERT INTO lesson_versions (
    lesson_id, version, content_hash, status, category, difficulty, minutes_read, implementation, sort_index,
    titles, descriptions, source_hashes, content, imported_at, lesson_group, topic, source_key
) VALUES (
    $1::text, $2::text, $3::text, 'published', $4::text, $5::text, $6::int, $7::text, $8::int,
    $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb, $13::timestamptz, $14::text, $15::text, $16::text
)
ON CONFLICT (lesson_id, version) DO NOTHING
RETURNING lesson_id`

/**
 * Stores a topic with its path, replacing what an earlier import left ($1 topic, $2 title, $3 source note, $4 description,
 * $5 prerequisites, $6 related, $7 path, $8 ref, $9 import time).
 */
export const UPSERT_TOPIC: ReturnType<typeof sql> = sql`INSERT INTO lesson_topics (
    topic, title, source_note, description, prerequisites, related, path, ref, imported_at
) VALUES ($1::text, $2::text, $3::text, $4::text, $5::jsonb, $6::jsonb, $7::jsonb, $8::text, $9::timestamptz)
ON CONFLICT (topic) DO UPDATE SET
    title = EXCLUDED.title, source_note = EXCLUDED.source_note, description = EXCLUDED.description,
    prerequisites = EXCLUDED.prerequisites, related = EXCLUDED.related, path = EXCLUDED.path,
    ref = EXCLUDED.ref, imported_at = EXCLUDED.imported_at
RETURNING topic`

/** Reads one topic ($1 topic). */
export const SELECT_TOPIC: ReturnType<typeof sql> = sql`SELECT topic, title, source_note, description, prerequisites,
    related, path
FROM lesson_topics
WHERE topic = $1::text`

/** Reads the title and the listed state (a published lesson exists) of stored topics ($1 topic slugs, $2 row bound). */
export const SELECT_RELATED_TOPICS: ReturnType<typeof sql> = sql`SELECT t.topic, t.title,
    EXISTS (SELECT 1 FROM lesson_versions v WHERE v.topic = t.topic AND v.status = 'published') AS listed
FROM lesson_topics t
WHERE t.topic = ANY($1::text[])
LIMIT $2::int`

/** Lists the live lessons of a topic in catalog order, titled in one locale ($1 topic, $2 locale, $3 row bound). */
export const SELECT_TOPIC_LESSONS: ReturnType<typeof sql> = sql`SELECT lesson_id, lesson_group, source_key,
    titles ->> $2::text AS title
FROM lesson_versions
WHERE topic = $1::text AND status = 'published'
ORDER BY sort_index, lesson_id
LIMIT $3::int`

/**
 * Lists the live lessons converted from the V1 course modules the slugs name, titled in one locale, in catalog order
 * ($1 module slugs, $2 locale, $3 row bound). A lesson whose source folder lies under `modules/<slug>/` belongs to that module.
 */
export const SELECT_MODULE_LESSONS: ReturnType<typeof sql> =
    sql`SELECT m.module_ref, v.lesson_id, v.topic, v.titles ->> $2::text AS title
FROM unnest($1::text[]) AS m(module_ref)
JOIN lesson_versions v ON v.status = 'published' AND v.source_key LIKE '%/modules/' || m.module_ref || '/contents/%'
ORDER BY m.module_ref, v.sort_index, v.lesson_id
LIMIT $3::int`
