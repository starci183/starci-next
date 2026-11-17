import { sql } from "@modules/platform/database"

/** The hash of one stored version ($1 kind, $2 key, $3 version). */
export const SELECT_VERSION_HASH: ReturnType<typeof sql> = sql`SELECT content_hash FROM harness_contents
WHERE kind = $1::text AND content_key = $2::text AND version = $3::text`

/** Marks the live version of one item superseded before a new one is stored ($1 kind, $2 key). */
export const SUPERSEDE_PUBLISHED: ReturnType<typeof sql> = sql`UPDATE harness_contents SET status = 'superseded'
WHERE kind = $1::text AND content_key = $2::text AND status = 'published'`

/** Stores one version as the live one ($1 kind, $2 key, $3 version, $4 hash, $5 sort, $6 content, $7 pack, $8 pack hash, $9 now). */
export const INSERT_CONTENT: ReturnType<typeof sql> = sql`INSERT INTO harness_contents
    (kind, content_key, version, content_hash, status, sort_index, content, pack, pack_sha256, imported_at)
VALUES ($1::text, $2::text, $3::text, $4::text, 'published', $5::int, $6::jsonb, $7::bytea, $8::text, $9::timestamptz)
ON CONFLICT (kind, content_key, version) DO NOTHING
RETURNING content_key`

/** The live items of one kind in order ($1 kind, $2 bound). */
export const SELECT_PUBLISHED_KIND: ReturnType<typeof sql> =
    sql`SELECT kind, content_key, version, content_hash, sort_index, content
FROM harness_contents WHERE kind = $1::text AND status = 'published'
ORDER BY sort_index, content_key LIMIT $2::int`

/** The live item of one kind and key ($1 kind, $2 key). */
export const SELECT_PUBLISHED_ONE: ReturnType<typeof sql> =
    sql`SELECT kind, content_key, version, content_hash, sort_index, content
FROM harness_contents WHERE kind = $1::text AND content_key = $2::text AND status = 'published'`

/** The pack of the live item of one kind and key ($1 kind, $2 key). */
export const SELECT_PACK: ReturnType<typeof sql> = sql`SELECT version, pack, pack_sha256 FROM harness_contents
WHERE kind = $1::text AND content_key = $2::text AND status = 'published' AND pack IS NOT NULL`

/**
 * Binds a build to a GitHub repository of the learner ($1 learner, $2 build, $3 repository, $4 now). Binding another repository
 * keeps the binding id and forgets the repository id of the old one; the same repository again changes nothing.
 */
export const UPSERT_BINDING: ReturnType<typeof sql> =
    sql`INSERT INTO harness_build_bindings (learner_id, build_id, repository, bound_at)
VALUES ($1::uuid, $2::text, $3::text, $4::timestamptz)
ON CONFLICT (learner_id, build_id) DO UPDATE SET
    repository = EXCLUDED.repository,
    repository_id = CASE WHEN harness_build_bindings.repository = EXCLUDED.repository THEN harness_build_bindings.repository_id ELSE NULL END,
    bound_at = CASE WHEN harness_build_bindings.repository = EXCLUDED.repository THEN harness_build_bindings.bound_at ELSE EXCLUDED.bound_at END
RETURNING learner_id, build_id, binding_id, repository, repository_id`

/** The bindings of a learner ($1 learner). */
export const SELECT_BINDINGS: ReturnType<typeof sql> =
    sql`SELECT learner_id, build_id, binding_id, repository, repository_id
FROM harness_build_bindings WHERE learner_id = $1::uuid`

/** One binding by the id a workflow sends ($1 binding). */
export const SELECT_BINDING_BY_ID: ReturnType<typeof sql> =
    sql`SELECT learner_id, build_id, binding_id, repository, repository_id
FROM harness_build_bindings WHERE binding_id = $1::uuid`

/** Remembers the repository id GitHub named in the first attested run ($1 binding, $2 repository id). */
export const SET_BINDING_REPOSITORY_ID: ReturnType<typeof sql> =
    sql`UPDATE harness_build_bindings SET repository_id = $2::text
WHERE binding_id = $1::uuid AND repository_id IS NULL`

/** Stores one attested result once per run ($1 learner, $2 build, $3 stage, $4 e2e, $5 run, $6 passed, $7 commit, $8 binding, $9 now). */
export const INSERT_PROOF: ReturnType<typeof sql> = sql`INSERT INTO harness_stage_proofs
    (learner_id, build_id, stage_id, e2e_id, run_id, passed, commit_sha, binding_id, recorded_at)
VALUES ($1::uuid, $2::text, $3::text, $4::text, $5::text, $6::boolean, $7::text, $8::uuid, $9::timestamptz)
ON CONFLICT DO NOTHING
RETURNING e2e_id`

/** The newest attested result of every e2e of a learner ($1 learner, $2 bound). */
export const SELECT_PROOFS: ReturnType<typeof sql> = sql`SELECT DISTINCT ON (build_id, stage_id, e2e_id)
    build_id, stage_id, e2e_id, passed, run_id, commit_sha,
    to_char(recorded_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS recorded_at
FROM harness_stage_proofs WHERE learner_id = $1::uuid
ORDER BY build_id, stage_id, e2e_id, recorded_at DESC, run_id DESC LIMIT $2::int`

/** The keys of the live items of one kind, in byte order ($1 kind). */
export const SELECT_PUBLISHED_KEYS: ReturnType<typeof sql> = sql`SELECT content_key FROM harness_contents
WHERE kind = $1::text AND status = 'published'
ORDER BY content_key COLLATE "C"`
