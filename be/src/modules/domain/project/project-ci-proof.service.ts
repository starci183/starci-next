import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ProjectError, ProjectErrorCode } from "./errors/project.error"
import type { ProjectSettings } from "./project.contracts"
import { InjectProjectOptions } from "./project.decorators"
import { ProjectLogEvent } from "./project.log-events"
import type { ProjectOptions } from "./project.options"
import { isCiFresh, isCiSignatureValid } from "./project-ci.policy"
import type { CiProof } from "./project-params.contracts"
import { projectSettingsOf } from "./project-settings.policy"
import type { ProjectRow } from "./persistence/project.rows"
import { SELECT_PROJECT_BY_ID } from "./persistence/project.sql"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu

@Injectable()
/**
 * The proof of a signed CI delivery, the door's first call: the project, the signature and the replay window are proved before the
 * document is read. It records nothing; `ProjectCiService.recordRun` claims the run's id on the inbox and records it.
 */
export class ProjectCiProofService {
    private readonly settings: ProjectSettings

    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectLogger() private readonly logger: Logger,
        @InjectProjectOptions() options: ProjectOptions,
    ) {
        this.settings = projectSettingsOf(options)
    }

    /**
     * Proves one delivery. A delivery for no project, or with a signature that does not match the project's secret, is
     * PROJECT_CI_SIGNATURE_INVALID before anything else is read; a timestamp outside the window is PROJECT_CI_STALE. It answers
     * nothing: a delivery that returns is proved, and the intake that follows reads the document.
     */
    async prove(proof: CiProof): Promise<void> {
        const refused = (code: ProjectErrorCode): ProjectError => {
            this.logger.warn(ProjectLogEvent.CiRefused, { code })
            return new ProjectError({ code })
        }
        const { project: projectId, timestamp, signature, body: rawBody } = proof
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
    }
}
