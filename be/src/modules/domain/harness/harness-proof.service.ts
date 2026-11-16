import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectExperienceProducer, type ExperienceProducer } from "@modules/domain/career"
import type { HarnessCiRun, ProjectHarnessPort } from "@modules/domain/project"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { HarnessError, HarnessErrorCode } from "./errors/harness.error"
import { buildExperienceOf } from "./harness-experience.policy"
import type { StoredBuild } from "./harness-progress.policy"
import { HarnessReadService } from "./harness-read.service"
import { HarnessLogEvent } from "./harness.log-events"
import type { BindingRow } from "./persistence/harness.rows"
import { INSERT_PROOF, SELECT_BINDINGS, UPSERT_BINDING } from "./persistence/harness.sql"

@Injectable()
/**
 * The proof side of the builds: binds a build to the learner's agent project, and takes the harness results of a CI run the project
 * capability recorded (`ProjectHarnessPort`). Only an attested run proves: a result counts when the run's project is the one bound to
 * the build and the stage and e2e ids belong to the live build; the first time every e2e of a build has a passed attested result the
 * experience engine gets the CV item. A signed-only run records nothing (the stage stays practising).
 */
export class HarnessProofService implements ProjectHarnessPort {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectLogger() private readonly logger: Logger,
        @InjectExperienceProducer() private readonly experiences: ExperienceProducer,
        private readonly reads: HarnessReadService,
    ) {}

    /**
     * Binds a build of the live catalog to a project the caller already proved is the learner's agent project (the door checks
     * ownership through the project capability); an unknown build is HARNESS_NOT_FOUND, and binding again replaces the project.
     */
    async bind(learnerId: string, buildId: string, projectId: string): Promise<{ buildId: string; projectId: string }> {
        const builds = await this.reads.storedBuilds()
        if (!builds.some((build) => build.id === buildId)) throw new HarnessError({ code: HarnessErrorCode.NotFound })
        const rows: Array<BindingRow> = await this.entityManager.query(UPSERT_BINDING, [
            learnerId,
            buildId,
            projectId,
            this.clock.now(),
        ])
        this.logger.info(HarnessLogEvent.Bound, { buildId })
        return { buildId: rows[0]?.build_id ?? buildId, projectId: rows[0]?.project_id ?? projectId }
    }

    /** The project a learner bound to a build, or null. */
    async boundProject(learnerId: string, buildId: string): Promise<string | null> {
        const rows: Array<BindingRow> = await this.entityManager.query(SELECT_BINDINGS, [learnerId])
        return rows.find((row) => row.build_id === buildId)?.project_id ?? null
    }

    /** Takes the harness results of one recorded CI run; a signed-only run or an unbound project adds nothing. */
    async recordRun(run: HarnessCiRun): Promise<void> {
        if (!run.attested) return
        const builds = await this.reads.storedBuilds()
        const touched = new Set<string>()
        for (const result of run.results) {
            const build = builds.find((each) => each.id === result.build)
            const known =
                build?.stages.some((stage) => stage.id === result.stage && stage.e2e.includes(result.e2e)) === true
            if (build === undefined || !known) continue
            if ((await this.boundProject(run.learnerId, build.id)) !== run.projectId) continue
            const inserted: Array<unknown> = await this.entityManager.query(INSERT_PROOF, [
                run.learnerId,
                result.build,
                result.stage,
                result.e2e,
                run.runId,
                result.passed,
                run.commit,
                run.projectId,
                this.clock.now(),
            ])
            if (inserted.length > 0) touched.add(build.id)
        }
        this.logger.info(HarnessLogEvent.ProofRecorded, { runId: run.runId, builds: touched.size })
        for (const build of builds.filter((each) => touched.has(each.id))) {
            await this.produce(run.learnerId, run.projectId, build)
        }
    }

    private async produce(learnerId: string, projectId: string, build: StoredBuild): Promise<void> {
        const params = buildExperienceOf(learnerId, projectId, build, await this.reads.proofs(learnerId))
        if (params !== null) await this.experiences.produce(params)
    }
}
