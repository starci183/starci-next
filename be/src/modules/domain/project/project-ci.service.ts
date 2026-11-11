import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ProjectError, ProjectErrorCode } from "./errors/project.error"
import type { EvidenceInput, ProjectSettings } from "./project.contracts"
import { InjectProjectOptions } from "./project.decorators"
import { ProjectLogEvent } from "./project.log-events"
import type { ProjectOptions } from "./project.options"
import { milestonesOfKind } from "./project-catalog.policy"
import { ciRunOf, isCiFresh, isCiSignatureValid, type CiRun } from "./project-ci.policy"
import { InjectCiAttestation, type CiAttestationVerifier } from "./project-ci-attestation.port"
import { ProjectEvidenceService } from "./project-evidence.service"
import type { CiAttestation, CiDelivery, CiReceipt } from "./project-params.contracts"
import { projectSettingsOf } from "./project-settings.policy"
import { projectKindOf } from "./project-view.mapper"
import type { ProjectRow, RepositoryRow } from "./persistence/project.rows"
import { SELECT_PROJECT_BY_ID, SELECT_PROJECT_REPOSITORY, SET_PROJECT_REPOSITORY_ID } from "./persistence/project.sql"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu

@Injectable()
/**
 * The intake of signed CI runs (proof): a StarCi GitHub Action posts the tagged tests, e2e flows and probes of a run signed with the
 * project's own secret. The delivery is proved first (project, signature, replay window), and only then is the document read; the
 * run is recorded once per run id, its results join the evidence, and the project is settled.
 */
export class ProjectCiService {
    private readonly settings: ProjectSettings

    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectLogger() private readonly logger: Logger,
        @InjectProjectOptions() options: ProjectOptions,
        private readonly evidence: ProjectEvidenceService,
        @InjectCiAttestation() private readonly attestation: CiAttestationVerifier,
    ) {
        this.settings = projectSettingsOf(options)
    }

    /**
     * Proves and records one delivery. A delivery for no project, or with a signature that does not match the project's secret, is
     * PROJECT_CI_SIGNATURE_INVALID before anything else is read; a timestamp outside the window is PROJECT_CI_STALE; a body that is
     * not the result document is PROJECT_CI_PAYLOAD_INVALID. A run id seen before is answered as a duplicate and adds nothing.
     */
    async recordRun(delivery: CiDelivery): Promise<CiReceipt> {
        const project = await this.proved(delivery)
        const run = ciRunOf(delivery.rawBody)
        return this.apply(project, run, await this.attest(project, run, delivery.oidcToken))
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

    /** Records a proved run once and settles the project; an attested run's results are proof, a signed-only run's are practice. */
    private async apply(project: ProjectRow, run: CiRun, attestation: CiAttestation): Promise<CiReceipt> {
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
        const receipt = await this.evidence.recordCiRun({
            projectId: project.project_id,
            runId: run.runId,
            commit: run.commit,
            passed: run.passed,
            attestation: attestation.kind,
            results,
        })
        if (!receipt.duplicate) await this.evidence.settle(project, [`ci:${project.project_id}:${run.runId}`])
        return receipt
    }

    private async proved(delivery: CiDelivery): Promise<ProjectRow> {
        const refused = (code: ProjectErrorCode): ProjectError => {
            this.logger.warn(ProjectLogEvent.CiRefused, { code })
            return new ProjectError({ code })
        }
        const { rawBody, projectId, timestamp, signature } = delivery
        if (rawBody === undefined || projectId === undefined || timestamp === undefined || signature === undefined) {
            throw refused(ProjectErrorCode.CiSignatureInvalid)
        }
        if (!UUID.test(projectId)) throw refused(ProjectErrorCode.CiSignatureInvalid)
        const rows: Array<ProjectRow> = await this.entityManager.query(SELECT_PROJECT_BY_ID, [projectId])
        const [project] = rows
        if (project === undefined || !isCiSignatureValid(project.ci_secret, timestamp, rawBody, signature)) {
            throw refused(ProjectErrorCode.CiSignatureInvalid)
        }
        if (!isCiFresh(timestamp, this.clock.now(), this.settings.ciToleranceMs))
            throw refused(ProjectErrorCode.CiStale)
        return project
    }
}
