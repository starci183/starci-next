import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import type { HarnessRunRow } from "@modules/domain/harness"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import type { RelayHarnessResultRow } from "./persistence/relay-events.rows"
import { SELECT_HARNESS_RESULTS } from "./persistence/relay-events.sql"
import { HARNESS_BUILD_TASK, HARNESS_DOCTOR_TASK, HARNESS_TRIAL_TASK } from "./relay-harness.policy"

const whyOf = (detail: Record<string, unknown> | null): string | null => {
    const why = detail?.["why"]
    const reason = detail?.["reason"]
    if (typeof why === "string") return why
    return typeof reason === "string" ? reason : null
}

@Injectable()
/**
 * The relay side of /harness: the newest relayed result of every build stage e2e, doctor probe and trial trap the learner's devices
 * uploaded. All of it is practice (Dang luyen); the proof of a build stage is an attested CI run recorded by the harness capability.
 */
export class RelayHarnessService {
    constructor(@InjectPrimaryEntityManager() private readonly entityManager: EntityManager) {}

    /** The newest result of each e2e of every build the learner ran, for the hub and the builds. */
    buildResults(learnerId: string): Promise<ReadonlyArray<HarnessRunRow>> {
        return this.results(learnerId, "harness-stage", HARNESS_BUILD_TASK)
    }

    /** The newest result of each doctor probe of both tools the learner's CLI uploaded. */
    doctorResults(learnerId: string): Promise<ReadonlyArray<HarnessRunRow>> {
        return this.results(learnerId, "harness-doctor", HARNESS_DOCTOR_TASK)
    }

    /** The newest result of each trap and tool the learner ran. */
    trialResults(learnerId: string): Promise<ReadonlyArray<HarnessRunRow>> {
        return this.results(learnerId, "harness-trial", HARNESS_TRIAL_TASK)
    }

    private async results(learnerId: string, slot: string, taskPrefix: string): Promise<ReadonlyArray<HarnessRunRow>> {
        const rows: Array<RelayHarnessResultRow> = await this.entityManager.query(SELECT_HARNESS_RESULTS, [
            learnerId,
            slot,
            taskPrefix,
            LIST_ROWS_MAX,
        ])
        return rows.map((row) => ({
            taskId: row.task_id,
            checkId: row.check_id,
            ref: row.ref,
            passed: row.passed === true,
            commit: row.commit_sha,
            why: whyOf(row.detail),
            detail: row.detail,
            at: row.created_at.toISOString(),
        }))
    }
}
