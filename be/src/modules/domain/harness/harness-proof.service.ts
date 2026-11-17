import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { DEFAULT_CI_OIDC_AUDIENCE } from "@modules/domain/project"
import { HarnessError, HarnessErrorCode } from "./errors/harness.error"
import { repositoryOf } from "./harness-ci.policy"
import { HarnessReadService } from "./harness-read.service"
import { InjectHarnessOptions } from "./harness.decorators"
import { HarnessLogEvent } from "./harness.log-events"
import type { HarnessOptions } from "./harness.options"
import type { BindingRow } from "./persistence/harness.rows"
import { UPSERT_BINDING } from "./persistence/harness.sql"

/** What a bind answers: the binding id the workflow sends, the repository and the audience its OIDC token must name. */
export interface HarnessBindingView {
    /** The build. */
    readonly buildId: string
    /** The repository, `owner/name`. */
    readonly repository: string
    /** The id to put in the workflow as STARCI_HARNESS_BINDING. */
    readonly bindingId: string
    /** The audience the workflow requests its OIDC token for. */
    readonly audience: string
}

@Injectable()
/**
 * The binding of a build to the learner own GitHub repository (owner 2026-11-17: /harness is free, so there is no Project and no
 * Premium question here). The attested CI runs of that repository then prove the build; `HarnessCiService` takes them.
 */
export class HarnessProofService {
    private readonly audience: string

    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectLogger() private readonly logger: Logger,
        @InjectHarnessOptions() options: HarnessOptions,
        private readonly reads: HarnessReadService,
    ) {
        this.audience = options.ciOidcAudience ?? DEFAULT_CI_OIDC_AUDIENCE
    }

    /**
     * Binds a build of the live catalog to a GitHub repository (`owner/name` or a github.com address); an unknown build is
     * HARNESS_NOT_FOUND and anything else is HARNESS_REPOSITORY_INVALID. Binding again replaces the repository and keeps the id.
     */
    async bind(learnerId: string, buildId: string, repository: string): Promise<HarnessBindingView> {
        const named = repositoryOf(repository)
        if (named === null) throw new HarnessError({ code: HarnessErrorCode.RepositoryInvalid })
        const builds = await this.reads.storedBuilds()
        if (!builds.some((build) => build.id === buildId)) throw new HarnessError({ code: HarnessErrorCode.NotFound })
        const rows: Array<BindingRow> = await this.entityManager.query(UPSERT_BINDING, [
            learnerId,
            buildId,
            named,
            this.clock.now(),
        ])
        const row = rows[0]
        if (row === undefined) throw new HarnessError({ code: HarnessErrorCode.NotFound })
        this.logger.info(HarnessLogEvent.Bound, { buildId })
        return { buildId, repository: row.repository, bindingId: row.binding_id, audience: this.audience }
    }
}
