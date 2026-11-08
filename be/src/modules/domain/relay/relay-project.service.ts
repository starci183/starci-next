import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import type { ProjectRelayPort, RelayCheckResult, RelayResultsRequest } from "@modules/domain/project"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import type { RelayResultRow } from "./persistence/relay-events.rows"
import { SELECT_TASK_RESULTS } from "./persistence/relay-events.sql"

@Injectable()
/**
 * The project shard's relay port (contract.relay.channel `check.result`): the check results the learner's devices uploaded
 * for a project, oldest first. Each carries its client event id, so a resent upload is one result; all are practice.
 */
export class RelayProjectService implements ProjectRelayPort {
    constructor(@InjectPrimaryEntityManager() private readonly entityManager: EntityManager) {}

    /** The check results of the project since `after`, oldest first. */
    async checkResults(request: RelayResultsRequest): Promise<ReadonlyArray<RelayCheckResult>> {
        const rows: Array<RelayResultRow> = await this.entityManager.query(SELECT_TASK_RESULTS, [
            request.learnerId,
            request.projectId,
            request.after,
            LIST_ROWS_MAX,
        ])
        return rows.map((row) => ({
            eventId: row.event_id,
            runId: row.run_id,
            conceptId: row.concept_id,
            slot: row.slot,
            ref: row.ref ?? "",
            passed: row.passed === true,
            commit: row.commit_sha,
            at: row.created_at,
        }))
    }
}
