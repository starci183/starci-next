import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ProjectError, ProjectErrorCode } from "./errors/project.error"
import type { EvidenceInput } from "./project.contracts"
import type { ProjectLookupParams } from "./project-params.contracts"
import type { ProjectView } from "./project-view.contracts"
import { ProjectLogEvent } from "./project.log-events"
import { milestonesOfKind } from "./project-catalog.policy"
import { ProjectEvidenceService } from "./project-evidence.service"
import { InjectProjectRelay, type ProjectRelayPort } from "./project-relay.port"
import { ProjectReadService } from "./project-read.service"
import { projectKindOf } from "./project-view.mapper"
import type { ProjectRow, RelayCursorRow } from "./persistence/project.rows"
import { SELECT_PROJECT, SELECT_RELAY_CURSOR } from "./persistence/project.sql"

@Injectable()
/**
 * Practice (practice): it pulls the check results the learner machine reported over the relay (through the relay port, which
 * reads the `check.result` events of contract.relay.channel) and appends them as `relay` evidence. A relay result is never proof, only
 * a signed CI run, a server probe or the AI teacher's read is. Each event counts once, however often it is pulled, and each new
 * run counts as one `project-run` action for the streak.
 */
export class ProjectPracticeService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectLogger() private readonly logger: Logger,
        @InjectProjectRelay() private readonly relay: ProjectRelayPort,
        private readonly evidence: ProjectEvidenceService,
        private readonly reads: ProjectReadService,
    ) {}

    /** Pulls the new relay results of a project and answers the project as it now stands. A relay that fails leaves the project as it was. */
    async sync(params: ProjectLookupParams): Promise<ProjectView> {
        const { learnerId, projectId } = params
        const rows: Array<ProjectRow> = await this.entityManager.query(SELECT_PROJECT, [learnerId, projectId])
        const [project] = rows
        if (project === undefined) throw new ProjectError({ code: ProjectErrorCode.NotFound })
        const cursors: Array<RelayCursorRow> = await this.entityManager.query(SELECT_RELAY_CURSOR, [project.project_id])
        const results = await this.relay
            .checkResults({ learnerId, projectId: project.project_id, after: cursors[0]?.cursor ?? null })
            .catch((cause: unknown) => {
                this.logger.warn(ProjectLogEvent.RelayFailed, {
                    error: cause instanceof Error ? cause.name : "unknown",
                })
                return []
            })
        const listed = new Set(milestonesOfKind(projectKindOf(project)).flatMap((milestone) => milestone.concepts))
        const inputs: ReadonlyArray<EvidenceInput> = results
            .filter((result) => listed.has(result.conceptId) && result.slot !== "code-read")
            .map((result) => ({
                conceptId: result.conceptId,
                slot: result.slot,
                source: "relay" as const,
                passed: result.passed,
                ref: result.ref,
                runId: result.runId,
                commitSha: result.commit,
                detail: { eventId: result.eventId },
                at: result.at,
            }))
        if (inputs.length > 0) {
            const added = await this.entityManager.transaction((manager) =>
                this.evidence.append(manager, project.project_id, inputs),
            )
            if (added > 0) {
                const runs = [...new Set(inputs.map((input) => input.runId))]
                await this.evidence.settle(
                    project,
                    runs.map((runId) => `relay:${project.project_id}:${runId}`),
                )
            }
        }
        return this.reads.get(params)
    }
}
