import { sql } from "@modules/platform/database"

/** Creates a project and answers its id ($1 learner, $2 name, $3 kind, $4 topic, $5 language, $6 stack, $7 track, $8 repo, $9 CI secret, $10 now). */
export const INSERT_PROJECT: ReturnType<typeof sql> = sql`INSERT INTO projects
    (project_id, learner_id, name, kind, topic, language, stack, track, repo_url, ci_secret, created_at, updated_at)
VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10::timestamptz, $10::timestamptz)
RETURNING project_id`

/** Lists the projects of a learner, oldest first ($1 learner, $2 limit). */
export const SELECT_PROJECTS: ReturnType<typeof sql> =
    sql`SELECT project_id, learner_id, name, kind, topic, language, stack, track, repo_url, deployed_url, ci_secret, created_at, updated_at
FROM projects
WHERE learner_id = $1::uuid
ORDER BY created_at, project_id
LIMIT $2::int`

/** Reads a project of a learner ($1 learner, $2 project). */
export const SELECT_PROJECT: ReturnType<typeof sql> =
    sql`SELECT project_id, learner_id, name, kind, topic, language, stack, track, repo_url, deployed_url, ci_secret, created_at, updated_at
FROM projects
WHERE learner_id = $1::uuid AND project_id = $2::uuid`

/** Reads a project by its id alone, for a signed CI delivery that proves itself with the project's secret ($1 project). */
export const SELECT_PROJECT_BY_ID: ReturnType<typeof sql> =
    sql`SELECT project_id, learner_id, name, kind, topic, language, stack, track, repo_url, deployed_url, ci_secret, created_at, updated_at
FROM projects
WHERE project_id = $1::uuid`

/** Counts the projects of a learner ($1 learner). */
export const COUNT_PROJECTS: ReturnType<typeof sql> =
    sql`SELECT count(*)::int AS total FROM projects WHERE learner_id = $1::uuid`

/** Locks the learner so two creates cannot both pass the free-project check ($1 learner). */
export const LOCK_LEARNER: ReturnType<typeof sql> = sql`SELECT pg_advisory_xact_lock(hashtext('projects:' || $1::text))`

/** Changes the editable fields of a project and answers its id ($1 project, $2 learner, $3 name, $4 topic, $5 language, $6 stack, $7 repo, $8 deployed, $9 now). */
export const UPDATE_PROJECT: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE projects
    SET name = $3, topic = $4, language = $5, stack = $6, repo_url = $7, deployed_url = $8, updated_at = $9::timestamptz
    WHERE project_id = $1::uuid AND learner_id = $2::uuid
    RETURNING project_id
)
SELECT project_id FROM changed`

/** Replaces the CI secret of a project and answers its id ($1 project, $2 learner, $3 secret, $4 now). */
export const ROTATE_SECRET: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE projects
    SET ci_secret = $3, updated_at = $4::timestamptz
    WHERE project_id = $1::uuid AND learner_id = $2::uuid
    RETURNING project_id
)
SELECT project_id FROM changed`

/** Deletes a project with everything that hangs on it and answers its id ($1 project, $2 learner). */
export const DELETE_PROJECT: ReturnType<typeof sql> = sql`WITH removed AS (
    DELETE FROM projects
    WHERE project_id = $1::uuid AND learner_id = $2::uuid
    RETURNING project_id
)
SELECT project_id FROM removed`

/** Points a concept at code and an endpoint; a null leaves the stored value ($1 project, $2 concept, $3 location, $4 endpoint, $5 body, $6 now). */
export const UPSERT_CONCEPT: ReturnType<typeof sql> =
    sql`INSERT INTO project_concepts (project_id, concept_id, location, endpoint, sample_body, updated_at)
VALUES ($1::uuid, $2, $3, $4, $5, $6::timestamptz)
ON CONFLICT (project_id, concept_id) DO UPDATE SET
    location = COALESCE(EXCLUDED.location, project_concepts.location),
    endpoint = COALESCE(EXCLUDED.endpoint, project_concepts.endpoint),
    sample_body = COALESCE(EXCLUDED.sample_body, project_concepts.sample_body),
    updated_at = EXCLUDED.updated_at`

/** Reads the concept pointers of some projects ($1 project ids, $2 limit). */
export const SELECT_CONCEPTS: ReturnType<typeof sql> =
    sql`SELECT project_id, concept_id, location, endpoint, sample_body
FROM project_concepts
WHERE project_id = ANY($1::uuid[])
LIMIT $2::int`

/** Appends one result unless the same run already reported it ($1 project, $2 concept, $3 slot, $4 source, $5 passed, $6 ref, $7 run, $8 commit, $9 detail, $10 at). */
export const INSERT_EVIDENCE: ReturnType<typeof sql> = sql`INSERT INTO project_evidence
    (project_id, concept_id, slot, source, passed, ref, run_id, commit_sha, detail, at)
VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::timestamptz)
ON CONFLICT ON CONSTRAINT ux_project_evidence_run DO NOTHING
RETURNING evidence_id`

/** Reads the latest result per concept, slot, source and ref of some projects, within a limit ($1 project ids, $2 limit). */
export const SELECT_EVIDENCE: ReturnType<typeof sql> =
    sql`SELECT DISTINCT ON (project_id, concept_id, slot, source, ref)
    project_id, concept_id, slot, source, passed, ref, run_id, commit_sha, detail, at
FROM project_evidence
WHERE project_id = ANY($1::uuid[])
ORDER BY project_id, concept_id, slot, source, ref, at DESC, evidence_id
LIMIT $2::int`

/** Reads the newest relay result time of a project, the cursor of the next pull ($1 project). */
export const SELECT_RELAY_CURSOR: ReturnType<typeof sql> =
    sql`SELECT max(at) AS cursor FROM project_evidence WHERE project_id = $1::uuid AND source = 'relay'`

/**
 * Records a signed CI delivery once per run ($1 project, $2 run, $3 commit, $4 passed, $5 now, $6 attestation); no row comes back
 * for a replay.
 */
export const INSERT_CI_RUN: ReturnType<typeof sql> =
    sql`INSERT INTO project_ci_runs (project_id, run_id, commit_sha, passed, received_at, attestation)
VALUES ($1::uuid, $2, $3, $4, $5::timestamptz, $6)
ON CONFLICT (project_id, run_id) DO NOTHING
RETURNING run_id`

/** Reads the newest signed CI run of each of some projects ($1 project ids, $2 limit). */
export const SELECT_LAST_CI_RUNS: ReturnType<typeof sql> =
    sql`SELECT DISTINCT ON (project_id) project_id, run_id, commit_sha, passed, received_at
FROM project_ci_runs
WHERE project_id = ANY($1::uuid[])
ORDER BY project_id, received_at DESC
LIMIT $2::int`

/** Records a probe run and answers its id ($1 project, $2 url, $3 passed, $4 results, $5 now). */
export const INSERT_PROBE_RUN: ReturnType<typeof sql> =
    sql`INSERT INTO project_probe_runs (run_id, project_id, url, passed, results, at)
VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4::jsonb, $5::timestamptz)
RETURNING run_id`

/** Counts the probe runs a project started since a moment ($1 project, $2 since). */
export const COUNT_PROBE_RUNS: ReturnType<typeof sql> =
    sql`SELECT count(*)::int AS total FROM project_probe_runs WHERE project_id = $1::uuid AND at >= $2::timestamptz`

/** Reads the newest probe run of each of some projects ($1 project ids, $2 limit). */
export const SELECT_LAST_PROBE_RUNS: ReturnType<typeof sql> =
    sql`SELECT DISTINCT ON (project_id) project_id, run_id, url, passed, results, at
FROM project_probe_runs
WHERE project_id = ANY($1::uuid[])
ORDER BY project_id, at DESC
LIMIT $2::int`

/** Claims the subjects proved for the first time; only the new ones come back ($1 project, $2 subjects, $3 now). */
export const INSERT_PROOFS: ReturnType<typeof sql> = sql`INSERT INTO project_proofs (project_id, subject, proved_at)
SELECT $1::uuid, subject, $3::timestamptz FROM unnest($2::text[]) AS subject
ON CONFLICT (project_id, subject) DO NOTHING
RETURNING subject`

/** Lists the concepts a learner proved in any project, first proof first ($1 learner, $2 limit). */
export const SELECT_PROVED_CONCEPTS: ReturnType<typeof sql> =
    sql`SELECT p.project_id, substr(pr.subject, 9) AS concept_id, pr.proved_at
FROM project_proofs pr
JOIN projects p ON p.project_id = pr.project_id
WHERE p.learner_id = $1::uuid AND pr.subject LIKE 'concept:%'
ORDER BY pr.proved_at, p.project_id, pr.subject
LIMIT $2::int`

/** Counts the AI code reads a learner started since a moment ($1 learner, $2 since). */
export const COUNT_CODE_READS: ReturnType<typeof sql> = sql`SELECT count(*)::int AS total
FROM project_evidence e
JOIN projects p ON p.project_id = e.project_id
WHERE p.learner_id = $1::uuid AND e.source = 'ai' AND e.at >= $2::timestamptz`

/** The GitHub repository a project is bound to ($1 project). */
export const SELECT_PROJECT_REPOSITORY: ReturnType<typeof sql> =
    sql`SELECT github_repository, github_repository_id FROM projects WHERE project_id = $1::uuid LIMIT 1`

/** The GitHub repository of a learner's own project ($1 project, $2 learner). */
export const SELECT_OWN_PROJECT_REPOSITORY: ReturnType<typeof sql> =
    sql`SELECT github_repository, github_repository_id FROM projects
WHERE project_id = $1::uuid AND learner_id = $2::uuid
LIMIT 1`

/**
 * Binds a learner's own project to a GitHub repository; a new repository forgets the id of the old one, the same one keeps it
 * ($1 project, $2 learner, $3 repository, $4 now).
 */
export const SET_PROJECT_REPOSITORY: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE projects SET github_repository_id = CASE WHEN github_repository = $3::text THEN github_repository_id ELSE NULL END,
        github_repository = $3::text, updated_at = $4::timestamptz
    WHERE project_id = $1::uuid AND learner_id = $2::uuid
    RETURNING github_repository, github_repository_id
)
SELECT github_repository, github_repository_id FROM changed`

/** Records GitHub's id of a project's repository from its first attested run; an id already recorded stays ($1 project, $2 id). */
export const SET_PROJECT_REPOSITORY_ID: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE projects SET github_repository_id = $2::text
    WHERE project_id = $1::uuid AND github_repository_id IS NULL
    RETURNING project_id
)
SELECT project_id FROM changed`
