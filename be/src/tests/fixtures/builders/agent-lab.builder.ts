import type { EntityManager } from "typeorm"
import { sql } from "@modules/platform/database"

const STORE_USAGE = sql`INSERT INTO agent_lab_usage (learner_id, usage_day, calls, updated_at)
VALUES ($1::uuid, (now() AT TIME ZONE 'UTC')::date, $2::int, now())`

/** Records that a learner already made this many model calls today. */
export const persistAgentLabUsage = async (
    manager: EntityManager | undefined,
    learnerId: string,
    calls: number,
): Promise<void> => {
    await manager?.query(STORE_USAGE, [learnerId, calls])
}
