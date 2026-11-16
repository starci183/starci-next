import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { lessonRelayTaskId } from "@modules/domain/lesson"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import type { RelayCheckStateRow } from "./persistence/relay-events.rows"
import { SELECT_TASK_CHECKS } from "./persistence/relay-events.sql"

/** Where one scenario run stands: running (started, no result yet), passed or failed. */
export type LessonRunStatus = "running" | "passed" | "failed"

/** The newest run of one scenario of a lesson, as the learner's device relayed it; practice, never proof. */
export interface LessonScenarioRunView {
    /** The scenario id (the check id the CLI named). */
    readonly scenarioId: string
    /** Running, passed or failed. */
    readonly status: LessonRunStatus
    /** The run id. */
    readonly runId: string
    /** `scenario` for a scenario run, `challenge` for a hidden scenario of a challenge, or null. */
    readonly slot: string | null
    /** The challenge id of a challenge run, or null. */
    readonly ref: string | null
    /** The exit code, or null while running. */
    readonly exitCode: number | null
    /** How long it ran in milliseconds, or null while running. */
    readonly durationMs: number | null
    /** The commit it ran on, or null. */
    readonly commit: string | null
    /** The newest output line block of the run, or null. */
    readonly output: string | null
    /** When the newest event was stored, ISO 8601. */
    readonly at: string
}

/** The status a check's newest event gives. */
const statusOf = (row: RelayCheckStateRow): LessonRunStatus => {
    if (row.kind === "check.started") return "running"
    return row.passed === true ? "passed" : "failed"
}

@Injectable()
/**
 * The relay side of a lesson's Kịch bản: the newest run of every scenario the learner's devices ran under the lesson's task
 * (`lesson:<lesson id>`, the check id is the scenario id). All of it is practice ("Đang luyện"); proof stays with CI.
 */
export class RelayLessonService {
    constructor(@InjectPrimaryEntityManager() private readonly entityManager: EntityManager) {}

    /** The newest run of each scenario of the lesson the learner ran, by scenario id. */
    async runs(learnerId: string, lessonId: string): Promise<ReadonlyArray<LessonScenarioRunView>> {
        const rows: Array<RelayCheckStateRow> = await this.entityManager.query(SELECT_TASK_CHECKS, [
            learnerId,
            lessonRelayTaskId(lessonId),
            LIST_ROWS_MAX,
        ])
        return rows.map((row) => ({
            scenarioId: row.check_id,
            status: statusOf(row),
            runId: row.run_id,
            slot: row.slot,
            ref: row.ref,
            exitCode: row.exit_code,
            durationMs: row.duration_ms,
            commit: row.commit_sha,
            output: row.output,
            at: row.created_at.toISOString(),
        }))
    }
}
