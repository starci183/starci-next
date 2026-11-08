import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { eachInOrder } from "@modules/platform/primitives"
import { InjectCareerOptions } from "./career.decorators"
import type { ExperienceItemView, ProduceExperienceParams, SlotValues } from "./career.contracts"
import { toExperienceItemView } from "./career.mapper"
import type { CareerOptions } from "./career.options"
import { CareerError, CareerErrorCode } from "./errors/career.error"
import { ExperienceAuditService } from "./experience-audit.service"
import { ExperienceService } from "./experience.service"
import type { ItemRow } from "./persistence/career.rows"
import { APPROVE_ITEM, SELECT_ITEM_FOR_UPDATE, SUBMIT_ITEM } from "./persistence/career.sql"
import { careerSettingsOf, dueAtOf } from "./review-sla.policy"

/** What the development seed creates items for. */
export interface SeedExperienceParams {
    /** The learner the sample items belong to. */
    readonly learnerId: string
    /** The signer of the verified sample, never the learner. */
    readonly signerId: string
}

/** How far one sample item goes: graded only, pending review, or verified. */
type SampleStage = "graded" | "pending" | "verified"

/** One sample item of the seed. */
interface SampleItem {
    readonly stage: SampleStage
    readonly params: Omit<ProduceExperienceParams, "learnerId" | "evidence">
}

/** The same slot values in both locales; the samples are development data, not product copy. */
const bothLocales = (values: Readonly<Record<string, string>>): SlotValues => ({ vi: values, en: values })

/** The sample project of the seed. */
const PROJECT = "dev-shop"

/** A passing grade of one criterion. */
const PASS = {
    result: "pass" as const,
    criteria: [{ criterion: "Sample criterion", level: 2, evidenceQuote: "dev seed" }],
}

/** The three samples: one ai-graded, one waiting for review in the teacher's queue, one verified. */
const SAMPLES: ReadonlyArray<SampleItem> = [
    {
        stage: "graded",
        params: {
            itemType: "essentials.concept-proved",
            subject: `dev-seed:request-lifecycle@${PROJECT}`,
            projectId: PROJECT,
            slotValues: bothLocales({
                concept: "Request lifecycle",
                project: "StarCi Shop",
                language: "typescript",
                lesson: "request-lifecycle",
            }),
            grade: PASS,
        },
    },
    {
        stage: "pending",
        params: {
            itemType: "projects.milestone",
            subject: `dev-seed:milestone@${PROJECT}`,
            projectId: PROJECT,
            slotValues: bothLocales({
                project: "StarCi Shop",
                stack: "NestJS, PostgreSQL",
                concepts: "idempotency keys, conditional updates",
                ci: "run #18",
            }),
            grade: PASS,
        },
    },
    {
        stage: "verified",
        params: {
            itemType: "projects.deployed",
            subject: `dev-seed:deployed@${PROJECT}`,
            projectId: PROJECT,
            slotValues: bothLocales({ project: "StarCi Shop", url: "https://shop.dev.starci.test" }),
            grade: PASS,
        },
    },
]

@Injectable()
/**
 * The development seed of the experience engine: sample items in three states for one learner, so the screens can be walked
 * before a shard produces real ones. It goes through the producer and writes the submit and the signature with their audit rows,
 * the way the doors do; it is refused CAREER_DEV_SEED_DISABLED unless the environment enables it (development only).
 */
export class ExperienceSeedService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectCareerOptions() private readonly options: CareerOptions,
        private readonly experiences: ExperienceService,
        private readonly audit: ExperienceAuditService,
    ) {}

    /** Creates the samples, or moves them on when they already exist, and answers them as they stand. */
    async seed(params: SeedExperienceParams): Promise<ReadonlyArray<ExperienceItemView>> {
        if (this.options.devSeed !== true) throw new CareerError({ code: CareerErrorCode.DevSeedDisabled })
        if (params.signerId === params.learnerId) throw new CareerError({ code: CareerErrorCode.SelfReview })
        const views: Array<ExperienceItemView> = []
        await eachInOrder(SAMPLES, async (sample) => {
            views.push(await this.seedOne(params, sample))
        })
        return views
    }

    /** Produces one sample and, by its stage, submits it to the teacher's queue and signs it. */
    private async seedOne(params: SeedExperienceParams, sample: SampleItem): Promise<ExperienceItemView> {
        const at = this.clock.now().toISOString()
        const evidence = [{ kind: "dev-seed", ref: sample.params.subject, proofForm: "signed-ci" as const, at }]
        const produced = await this.experiences.produce({ ...sample.params, learnerId: params.learnerId, evidence })
        if (sample.stage === "graded" || produced.state !== "ai-graded") return produced
        return this.entityManager.transaction(async (manager) => {
            const pending = await this.submit(manager, produced.itemId, params.learnerId)
            if (sample.stage === "pending") return toExperienceItemView(pending)
            return toExperienceItemView(await this.sign(manager, pending, params.signerId))
        })
    }

    /** Puts a graded sample in the teacher's queue with its deadline. */
    private async submit(manager: EntityManager, itemId: string, learnerId: string): Promise<ItemRow> {
        const now = this.clock.now()
        const locked: Array<ItemRow> = await manager.query(SELECT_ITEM_FOR_UPDATE, [itemId])
        const row = locked[0]
        if (row?.draft_line === undefined || row.draft_line === null)
            throw new CareerError({ code: CareerErrorCode.ItemNotSaved })
        const due = dueAtOf(now, false, careerSettingsOf(this.options))
        const changed: Array<ItemRow> = await manager.query(SUBMIT_ITEM, [
            row.item_id,
            row.revision,
            JSON.stringify(row.draft_line),
            null,
            false,
            now,
            due,
        ])
        const submitted = changed[0]
        if (submitted === undefined) throw new CareerError({ code: CareerErrorCode.ItemNotSaved })
        await this.audit.append({
            manager,
            item: submitted,
            action: "submit",
            actorId: learnerId,
            actorRole: "learner",
            fromState: row.state,
            note: null,
            at: now,
        })
        return submitted
    }

    /** Signs a pending sample as the teacher. */
    private async sign(manager: EntityManager, row: ItemRow, signerId: string): Promise<ItemRow> {
        const now = this.clock.now()
        const changed: Array<ItemRow> = await manager.query(APPROVE_ITEM, [
            row.item_id,
            row.revision,
            signerId,
            "TEACHER",
            now,
        ])
        const signed = changed[0]
        if (signed === undefined) throw new CareerError({ code: CareerErrorCode.ItemNotSaved })
        await this.audit.append({
            manager,
            item: signed,
            action: "approve",
            actorId: signerId,
            actorRole: "TEACHER",
            fromState: row.state,
            note: null,
            at: now,
        })
        return signed
    }
}
