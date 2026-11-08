import { randomBytes } from "node:crypto"
import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectEntitlementService, type EntitlementService } from "@modules/domain/entitlement"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectProbeTransport, type ProbeTransport } from "@modules/integrations/probe"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { ProjectError, ProjectErrorCode } from "./errors/project.error"
import type { ProjectSettings } from "./project.contracts"
import { InjectProjectOptions } from "./project.decorators"
import type { ProjectOptions } from "./project.options"
import { milestonesOfKind } from "./project-catalog.policy"
import {
    endpointOf,
    INPUT_LIMITS,
    kindOf,
    locationOf,
    NAME_MAX,
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
import { projectSettingsOf } from "./project-settings.policy"
import { publicTargetOf } from "./project-target.policy"
import type { ConceptView, ProjectDeletedView, ProjectSecretView, ProjectSummaryView } from "./project-view.contracts"
import { projectKindOf } from "./project-view.mapper"
import type { ProjectRow, TotalRow } from "./persistence/project.rows"
import {
    COUNT_PROJECTS,
    DELETE_PROJECT,
    INSERT_PROJECT,
    LOCK_LEARNER,
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
 * The writes of the projects capability: a learner owns many projects (a learner without Premium owns `freeProjects`), each of any
 * topic, language and structure and of kind app or agent. This service is the only writer of the project and concept-pointer tables,
 * and the only place a CI secret is made: it is shown once, when the project is created or the secret rotated.
 */
export class ProjectService {
    private readonly settings: ProjectSettings

    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectEntitlementService() private readonly entitlement: EntitlementService,
        @InjectProjectOptions() options: ProjectOptions,
        @InjectProbeTransport() private readonly probe: ProbeTransport,
        private readonly reads: ProjectReadService,
    ) {
        this.settings = projectSettingsOf(options)
    }

    /**
     * Creates a project and answers it with its CI secret, shown this once. The second
     * project needs Premium (the count is taken under a per-learner lock, so two creates cannot both pass).
     */
    async create(params: CreateProjectParams): Promise<ProjectSecretView> {
        const kind = kindOf(params.kind)
        const values = [
            textOf(params.name, "name", NAME_MAX),
            kind,
            textOf(params.topic, "topic", INPUT_LIMITS.topic),
            textOf(params.language, "language", INPUT_LIMITS.language),
            textOf(params.stack, "stack", INPUT_LIMITS.stack),
            trackOf(params.track, kind),
            repoUrlOf(params.repoUrl),
        ]
        const premium = await this.entitlement.isPremium(params.learnerId)
        const secret = newCiSecret()
        const projectId = await this.entityManager.transaction(async (manager) => {
            await manager.query(LOCK_LEARNER, [params.learnerId])
            const totals: Array<TotalRow> = await manager.query(COUNT_PROJECTS, [params.learnerId])
            if ((totals[0]?.total ?? 0) >= this.settings.freeProjects && !premium) {
                throw new ProjectError({ code: ProjectErrorCode.PremiumRequired })
            }
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
            params.topic === null ? row.topic : textOf(params.topic, "topic", INPUT_LIMITS.topic),
            params.language === null ? row.language : textOf(params.language, "language", INPUT_LIMITS.language),
            params.stack === null ? row.stack : textOf(params.stack, "stack", INPUT_LIMITS.stack),
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
        const row = await this.ownedProject(params.learnerId, params.projectId)
        const listed = milestonesOfKind(projectKindOf(row)).some((milestone) =>
            milestone.concepts.includes(params.conceptId),
        )
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
