import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectExperienceProducer, type ExperienceProducer } from "@modules/domain/career"
import { InjectCiAttestation, type CiAttestationVerifier } from "@modules/domain/project"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { InjectInbox, type Inbox } from "@modules/platform/inbox"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { HarnessError, HarnessErrorCode } from "./errors/harness.error"
import { buildExperienceOf } from "./harness-experience.policy"
import { harnessRunOf, type HarnessCiDelivery, type HarnessCiDocument } from "./harness-ci.policy"
import { HarnessReadService } from "./harness-read.service"
import { HarnessLogEvent } from "./harness.log-events"
import type { BindingRow } from "./persistence/harness.rows"
import { INSERT_PROOF, SELECT_BINDING_BY_ID, SET_BINDING_REPOSITORY_ID } from "./persistence/harness.sql"

/** The inbox source of the CI deliveries to the harness door; the binding and the CI run id are the delivery key. */
const CI_INBOX_SOURCE = "harness-ci"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu

/** What a recorded delivery answers: how many e2e results were stored as proof. */
export interface HarnessCiReceipt {
    /** The results recorded; 0 for a run seen before or with nothing of the bound build. */
    readonly recorded: number
}

@Injectable()
/**
 * The intake of CI runs for /harness builds (owner 2026-11-17: free for everyone, no Project). The workflow of the learner bound
 * repository posts the e2e results of its build with its GitHub Actions OIDC token; the delivery is proof only when GitHub vouches
 * (through the CI attestation port: the token names the bound repository, the commit and the run) and is refused otherwise, so the
 * Action fails instead of recording practice as proof. A result counts when its build is the bound one and its stage and e2e ids
 * belong to the live build; the first time every e2e of the build has a passed attested result the experience engine gets the CV item.
 */
export class HarnessCiService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectLogger() private readonly logger: Logger,
        @InjectInbox() private readonly inbox: Inbox,
        @InjectCiAttestation() private readonly attestation: CiAttestationVerifier,
        @InjectExperienceProducer() private readonly experiences: ExperienceProducer,
        private readonly reads: HarnessReadService,
    ) {}

    /**
     * Records one delivery. The body must be the result document, the binding must exist and GitHub must attest the run; the run is
     * claimed on the inbox first (a repeat answers nothing recorded) and the claim is given back when recording fails, so the
     * Action retry records it.
     */
    async recordRun(delivery: HarnessCiDelivery): Promise<HarnessCiReceipt> {
        const document = harnessRunOf(delivery.rawBody)
        const binding = await this.bindingOf(delivery.bindingId)
        const key = `${binding.binding_id}:${document.runId}`
        if (!(await this.inbox.claim(CI_INBOX_SOURCE, key))) return { recorded: 0 }
        try {
            await this.attest(binding, document, delivery.oidcToken)
            return { recorded: await this.apply(binding, document) }
        } catch (cause) {
            await this.inbox.release(CI_INBOX_SOURCE, key)
            throw cause
        }
    }

    private async bindingOf(bindingId: string | undefined): Promise<BindingRow> {
        if (bindingId === undefined || !UUID.test(bindingId)) {
            throw new HarnessError({ code: HarnessErrorCode.CiBindingUnknown })
        }
        const rows: Array<BindingRow> = await this.entityManager.query(SELECT_BINDING_BY_ID, [bindingId])
        const [binding] = rows
        if (binding === undefined) throw new HarnessError({ code: HarnessErrorCode.CiBindingUnknown })
        return binding
    }

    /** Asks GitHub, through the attestation port, whether it vouches for the run; any other answer is HARNESS_CI_NOT_ATTESTED. */
    private async attest(binding: BindingRow, document: HarnessCiDocument, token: string | undefined): Promise<void> {
        const refused = (reason: string): HarnessError => {
            this.logger.warn(HarnessLogEvent.CiRefused, { reason })
            return new HarnessError({ code: HarnessErrorCode.CiNotAttested })
        }
        if (token === undefined || token === "") throw refused("no-token")
        const attestation = await this.attestation.attest({
            token,
            repository: binding.repository,
            repositoryId: binding.repository_id,
            commit: document.commit,
            runId: document.runId,
        })
        if (attestation.kind !== "attested") throw refused(attestation.reason)
        if (binding.repository_id === null) {
            await this.entityManager.query(SET_BINDING_REPOSITORY_ID, [binding.binding_id, attestation.repositoryId])
        }
    }

    private async apply(binding: BindingRow, document: HarnessCiDocument): Promise<number> {
        const builds = await this.reads.storedBuilds()
        const build = builds.find((each) => each.id === binding.build_id)
        if (build === undefined) return 0
        let recorded = 0
        for (const result of document.results) {
            const known =
                result.build === build.id &&
                build.stages.some((stage) => stage.id === result.stage && stage.e2e.includes(result.e2e))
            if (!known) continue
            const inserted: Array<unknown> = await this.entityManager.query(INSERT_PROOF, [
                binding.learner_id,
                build.id,
                result.stage,
                result.e2e,
                document.runId,
                result.passed,
                document.commit,
                binding.binding_id,
                this.clock.now(),
            ])
            recorded += inserted.length
        }
        this.logger.info(HarnessLogEvent.ProofRecorded, { runId: document.runId, buildId: build.id, recorded })
        if (recorded > 0) {
            const params = buildExperienceOf(binding.learner_id, build, await this.reads.proofs(binding.learner_id))
            if (params !== null) await this.experiences.produce(params)
        }
        return recorded
    }
}
