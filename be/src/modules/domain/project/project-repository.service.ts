import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { ProjectError, ProjectErrorCode } from "./errors/project.error"
import { InjectProjectOptions } from "./project.decorators"
import type { ProjectOptions } from "./project.options"
import type { ProjectRepositoryView, SetProjectRepositoryParams } from "./project-params.contracts"
import { repositoryOf } from "./project-repository.policy"
import type { RepositoryRow } from "./persistence/project.rows"
import { SELECT_OWN_PROJECT_REPOSITORY, SET_PROJECT_REPOSITORY } from "./persistence/project.sql"

/** The audience the GitHub Actions OIDC token of a run must name unless the app names another. */
export const DEFAULT_CI_OIDC_AUDIENCE = "starci-next"

@Injectable()
/**
 * The GitHub repository of a learner's project (decision Q-PJ-1): only CI runs whose GitHub OIDC token names this repository are
 * attested proof. Binding another repository forgets the GitHub id the old one was seen with; the id of a bound repository is
 * recorded from its first attested run. Another learner's project is not found.
 */
export class ProjectRepositoryService {
    private readonly audience: string

    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectProjectOptions() options: ProjectOptions,
    ) {
        this.audience = options.ciOidcAudience ?? DEFAULT_CI_OIDC_AUDIENCE
    }

    /** The binding of the learner's own project, with the audience the workflow asks its OIDC token for. */
    async view(learnerId: string, projectId: string): Promise<ProjectRepositoryView> {
        const rows: Array<RepositoryRow> = await this.entityManager.query(SELECT_OWN_PROJECT_REPOSITORY, [
            projectId,
            learnerId,
        ])
        return this.viewOf(projectId, rows)
    }

    /** Binds the learner's own project to a repository, `owner/name` or a pasted github.com address. */
    async set(params: SetProjectRepositoryParams): Promise<ProjectRepositoryView> {
        const repository = repositoryOf(params.repository)
        const rows: Array<RepositoryRow> = await this.entityManager.query(SET_PROJECT_REPOSITORY, [
            params.projectId,
            params.learnerId,
            repository,
            this.clock.now(),
        ])
        return this.viewOf(params.projectId, rows)
    }

    /** The view of the row a read or a write answered; no row means the project is not the learner's. */
    private viewOf(projectId: string, rows: ReadonlyArray<RepositoryRow>): ProjectRepositoryView {
        const row = rows[0]
        if (row === undefined) throw new ProjectError({ code: ProjectErrorCode.NotFound })
        return {
            projectId,
            repository: row.github_repository,
            repositoryId: row.github_repository_id,
            audience: this.audience,
        }
    }
}
