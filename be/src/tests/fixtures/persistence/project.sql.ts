import { sql } from "@modules/platform/database"

/** The database clock in epoch milliseconds, which is the clock the signed CI timestamp must agree with. */
export const SERVER_NOW_MS: ReturnType<typeof sql> = sql`SELECT (extract(epoch FROM now()) * 1000)::bigint AS ms`

/** The CI runs of a project with their attestation and the source their evidence was recorded under ($1 project). */
export const CI_RUN_ATTESTATIONS: ReturnType<typeof sql> =
    sql`SELECT r.run_id, r.attestation, e.source FROM project_ci_runs r
JOIN project_evidence e ON e.project_id = r.project_id AND e.run_id = r.run_id
WHERE r.project_id = $1::uuid
ORDER BY r.run_id`
