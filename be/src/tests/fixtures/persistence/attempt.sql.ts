import { sql } from "@modules/platform/database"

/** The attempts of one learner as stored, in activity and revision order ($1 = learner id). */
export const STORED_ATTEMPTS: ReturnType<typeof sql> =
    sql`SELECT attempt_id, activity_id, revision, kind, phase, status, failure_code, answer
FROM lesson_attempts WHERE learner_id = $1::uuid ORDER BY activity_id, revision`
