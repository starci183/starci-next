import { randomBytes } from "node:crypto"
import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectEntitlementService, type EntitlementService } from "@modules/domain/entitlement"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectProbeTransport, type ProbeTransport } from "@modules/integrations/probe"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { ProjectError, ProjectErrorCode } from "./errors/project.error"
import { assertSubscriber } from "./project-access.policy"
import { isListed } from "./project-check-set-lookup.policy"
import { ProjectCheckSetService } from "./project-check-set.service"
import {
    endpointOf,
    INPUT_LIMITS,
    kindOf,
    locationOf,
    NAME_MAX,
    optionalTextOf,
    repoUrlOf,
    sampleBodyOf,
    textOf,
    trackOf,
} from "./project-input.policy"
import type {
    CreateProjectParams,
    ProjectLookupParams,
    SetConceptParams,
    UpdateProjectParams,
} from "./project-params.contracts"
import { ProjectReadService } from "./project-read.service"
import { publicTargetOf } from "./project-target.policy"
import type { ConceptView, ProjectDeletedView, ProjectSecretView, ProjectSummaryView } from "./project-view.contracts"
import { projectKindOf } from "./project-view.mapper"
import type { ProjectRow } from "./persistence/project.rows"
import {
    DELETE_PROJECT,
    INSERT_PROJECT,
    ROTATE_SECRET,
    SELECT_PROJECT,
    UPDATE_PROJECT,
    UPSERT_CONCEPT,
} from "./persistence/project.sql"

/** A new secret for signing CI results: 32 random bytes as hex. */
const newCiSecret = (): string => randomBytes(32).toString("hex")

/** The deployed address a change names: kept as it is when absent, cleared when empty, else checked to be a public target. */
const deployedUrlOf = (given: string | null, current: string | null): string | null => {
    if (given === null) return current
    return given.trim() === "" ? null : publicTargetOf(given)
}

@Injectable()
/**
 * The writes of the projects capability: a subscriber owns many projects, each of any
 * topic, language and structure and of kind app or agent. This service is the only writer of the project and concept-pointer tables,
 * and the only place a CI secret is made: it is shown once, when the project is created or the secret rotated.
 */
export class ProjectService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectEntitlementService() private readonly entitlement: EntitlementService,
        @InjectProbeTransport() private readonly probe: ProbeTransport,
        private readonly reads: ProjectReadService,
        private readonly checkSet: ProjectCheckSetService,
    ) {}

    /**
     * Creates a project and answers it with its CI secret, shown this once. Projects are subscription-only: a learner without
     * Premium is refused `PROJECT_PREMIUM_REQUIRED` before anything is written, whatever `freeProjects` says (the setting is what the
     * catalog shows, 0 by default).
     */
    async create(params: CreateProjectParams): Promise<ProjectSecretView> {
        await assertSubscriber(this.entitlement, params.learnerId)
        const kind = kindOf(params.kind)
        const values = [
            textOf(params.name, "name", NAME_MAX),
            kind,
            optionalTextOf(params.topic, "topic", INPUT_LIMITS.topic),
            optionalTextOf(params.language, "language", INPUT_LIMITS.language),
            optionalTextOf(params.stack, "stack", INPUT_LIMITS.stack),
            trackOf(params.track, kind),
            repoUrlOf(params.repoUrl),
        ]
        const secret = newCiSecret()
        const projectId = await this.entityManager.transaction(async (manager) => {
            const created: Array<{ project_id: string }> = await manager.query(INSERT_PROJECT, [
                params.learnerId,
                ...values,
                secret,
                this.clock.now(),
            ])
            return String(created[0]?.project_id)
        })
        const project = await this.reads.summary({ learnerId: params.learnerId, projectId, locale: params.locale })
        return { project, ciSecret: secret }
    }

    /** Changes the name, topic, language, stack, repository or deployed address of a project and answers it. */
    async update(params: UpdateProjectParams): Promise<ProjectSummaryView> {
        const row = await this.ownedProject(params.learnerId, params.projectId)
        await this.entityManager.query(UPDATE_PROJECT, [
            row.project_id,
            row.learner_id,
            params.name === null ? row.name : textOf(params.name, "name", NAME_MAX),
            params.topic === null ? row.topic : optionalTextOf(params.topic, "topic", INPUT_LIMITS.topic),
            params.language === null
                ? row.language
                : optionalTextOf(params.language, "language", INPUT_LIMITS.language),
            params.stack === null ? row.stack : optionalTextOf(params.stack, "stack", INPUT_LIMITS.stack),
            params.repoUrl === null ? row.repo_url : repoUrlOf(params.repoUrl),
            await this.deployedUrlChecked(params.deployedUrl, row.deployed_url),
            this.clock.now(),
        ])
        return this.reads.summary(params)
    }

    /** The deployed address a change names, checked as a target and then against the addresses its host name resolves to. */
    private async deployedUrlChecked(given: string | null, current: string | null): Promise<string | null> {
        const url = deployedUrlOf(given, current)
        if (url === null || url === current) return url
        if (!(await this.probe.isPublicHost(new URL(url).hostname))) {
            throw new ProjectError({ code: ProjectErrorCode.TargetRefused })
        }
        return url
    }

    /** Deletes a project and everything hanging on it; answers its id. */
    async remove(learnerId: string, projectId: string): Promise<ProjectDeletedView> {
        const rows: Array<{ project_id: string }> = await this.entityManager.query(DELETE_PROJECT, [
            projectId,
            learnerId,
        ])
        if (rows[0] === undefined) throw new ProjectError({ code: ProjectErrorCode.NotFound })
        return { id: projectId }
    }

    /** Replaces the CI secret of a project and answers the new one, shown this once. */
    async rotateSecret(params: ProjectLookupParams): Promise<ProjectSecretView> {
        const secret = newCiSecret()
        const rows: Array<{ project_id: string }> = await this.entityManager.query(ROTATE_SECRET, [
            params.projectId,
            params.learnerId,
            secret,
            this.clock.now(),
        ])
        if (rows[0] === undefined) throw new ProjectError({ code: ProjectErrorCode.NotFound })
        return { project: await this.reads.summary(params), ciSecret: secret }
    }

    /** Points a concept of a project at code and at the endpoint the StarCi probes aim at; a field left null stays as it is. */
    async setConcept(params: SetConceptParams): Promise<ConceptView> {
        await assertSubscriber(this.entitlement, params.learnerId)
        const row = await this.ownedProject(params.learnerId, params.projectId)
        const listed = isListed(await this.checkSet.current(), projectKindOf(row), params.conceptId)
        if (!listed) throw new ProjectError({ code: ProjectErrorCode.ConceptNotFound })
        await this.entityManager.query(UPSERT_CONCEPT, [
            row.project_id,
            params.conceptId,
            params.location === null ? null : locationOf(params.location),
            params.endpoint === null ? null : endpointOf(params.endpoint),
            params.sampleBody === null ? null : sampleBodyOf(params.sampleBody),
            this.clock.now(),
        ])
        return this.reads.concept(params)
    }

    private async ownedProject(learnerId: string, projectId: string): Promise<ProjectRow> {
        const rows: Array<ProjectRow> = await this.entityManager.query(SELECT_PROJECT, [learnerId, projectId])
        const [row] = rows
        if (row === undefined) throw new ProjectError({ code: ProjectErrorCode.NotFound })
        return row
    }
}
