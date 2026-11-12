import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { InjectInbox, type Inbox } from "@modules/platform/inbox"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ProjectError, ProjectErrorCode } from "./errors/project.error"
import type { EvidenceInput } from "./project.contracts"
import { ProjectLogEvent } from "./project.log-events"
import { milestonesOfKind } from "./project-catalog.policy"
import { ciRunOf, type CiRun } from "./project-ci.policy"
import { InjectCiAttestation, type CiAttestationVerifier } from "./project-ci-attestation.port"
import { ProjectEvidenceService } from "./project-evidence.service"
import type { CiAttestation, CiDelivery, CiReceipt, CiRunReceipt } from "./project-params.contracts"
import { projectKindOf } from "./project-view.mapper"
import type { ProjectRow, RepositoryRow } from "./persistence/project.rows"
import { SELECT_PROJECT_BY_ID, SELECT_PROJECT_REPOSITORY, SET_PROJECT_REPOSITORY_ID } from "./persistence/project.sql"

/** The inbox source of the signed CI deliveries; the CI run id is the delivery key. */
const CI_INBOX_SOURCE = "project-ci"

@Injectable()
/**
 * The intake of signed CI runs (proof): a StarCi GitHub Action posts the tagged tests, e2e flows and probes of a run signed with the
 * project's own secret. `ProjectCiProofService` proves the delivery first; this service records the proved run once per run id, its
 * results join the evidence, and the project is settled.
 */
export class ProjectCiService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectLogger() private readonly logger: Logger,
        @InjectInbox() private readonly inbox: Inbox,
        private readonly evidence: ProjectEvidenceService,
        @InjectCiAttestation() private readonly attestation: CiAttestationVerifier,
    ) {}

    /**
     * Records one delivery the door proved (`ProjectCiProofService.prove`). The body is read as the result document and its run id is
     * claimed on the inbox first: a run id seen before answers undefined and adds nothing, and a claim is given back when recording
     * fails, so the Action's retry records the run. An attested run's results are proof, a signed-only run's are practice; the
     * project settles once the run is recorded.
     */
    async recordRun(delivery: CiDelivery): Promise<CiRunReceipt> {
        const run = ciRunOf(delivery.rawBody)
        if (!(await this.inbox.claim(CI_INBOX_SOURCE, run.runId))) return
        try {
            const project = await this.projectOf(delivery.project)
            const receipt = await this.apply(project, run, await this.attest(project, run, delivery.oidcToken))
            if (!receipt.duplicate) await this.evidence.settle(project, [`ci:${project.project_id}:${run.runId}`])
            return receipt
        } catch (cause) {
            await this.inbox.release(CI_INBOX_SOURCE, run.runId)
            throw cause
        }
    }

    /** The project a proved delivery names. */
    private async projectOf(projectId: string | undefined): Promise<ProjectRow> {
        const rows: Array<ProjectRow> = await this.entityManager.query(SELECT_PROJECT_BY_ID, [projectId])
        const [project] = rows
        if (project === undefined) throw new ProjectError({ code: ProjectErrorCode.CiSignatureInvalid })
        return project
    }

    /**
     * Asks GitHub, through the attestation port, whether it vouches for the run: the OIDC token must name the bound repository, the
     * commit and the run id. A run with no token or a project with no bound repository stays signed-only without asking. The
     * repository id GitHub names on the first attested run is recorded, and a later run must name the same one.
     */
    private async attest(project: ProjectRow, run: CiRun, token: string | undefined): Promise<CiAttestation> {
        if (token === undefined || token === "") return { kind: "signed-only", reason: "no-token" }
        const rows: Array<RepositoryRow> = await this.entityManager.query(SELECT_PROJECT_REPOSITORY, [
            project.project_id,
        ])
        const binding = rows[0]
        const repository = binding?.github_repository ?? null
        if (binding === undefined || repository === null) return { kind: "signed-only", reason: "unbound" }
        const attestation = await this.attestation.attest({
            token,
            repository,
            repositoryId: binding.github_repository_id,
            commit: run.commit,
            runId: run.runId,
        })
        if (attestation.kind === "attested" && binding.github_repository_id === null) {
            await this.entityManager.query(SET_PROJECT_REPOSITORY_ID, [project.project_id, attestation.repositoryId])
        }
        if (attestation.kind === "signed-only")
            this.logger.info(ProjectLogEvent.CiUnattested, { reason: attestation.reason })
        return attestation
    }

    /** Records a claimed run once with its evidence results. */
    private apply(project: ProjectRow, run: CiRun, attestation: CiAttestation): Promise<CiReceipt> {
        const source = attestation.kind === "attested" ? ("ci" as const) : ("ci-signed" as const)
        const now = this.clock.now()
        const listed = new Set(milestonesOfKind(projectKindOf(project)).flatMap((milestone) => milestone.concepts))
        const results: ReadonlyArray<EvidenceInput> = run.results
            .filter((result) => listed.has(result.concept))
            .map((result) => ({
                conceptId: result.concept,
                slot: result.slot,
                source,
                passed: result.passed,
                ref: result.ref,
                runId: run.runId,
                commitSha: run.commit,
                detail: {},
                at: now,
            }))
        return this.evidence.recordCiRun({
            projectId: project.project_id,
            runId: run.runId,
            commit: run.commit,
            passed: run.passed,
            attestation: attestation.kind,
            results,
        })
    }
}
