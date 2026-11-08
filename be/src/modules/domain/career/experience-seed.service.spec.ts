import { Test } from "@nestjs/testing"
import { FakeClock, fakeTransaction, mock, mockEntityManager } from "@starci/jest-preset"
import type { MockEntityManager } from "@starci/jest-preset"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import {
    CAREER_ITEM,
    CAREER_LEARNER,
    CAREER_NOW,
    CAREER_TEACHER,
    itemRowOf,
} from "@tests/fixtures/builders/career.builder"
import { CAREER_OPTIONS } from "./career.decorators"
import type { ExperienceItemView } from "./career.contracts"
import { toExperienceItemView } from "./career.mapper"
import { CareerErrorCode } from "./errors/career.error"
import { ExperienceAuditService } from "./experience-audit.service"
import { ExperienceSeedService } from "./experience-seed.service"
import { ExperienceService } from "./experience.service"
import { APPROVE_ITEM, SELECT_ITEM_FOR_UPDATE, SUBMIT_ITEM } from "./persistence/career.sql"

const GRADED: ExperienceItemView = toExperienceItemView(itemRowOf())
const PENDING_ROW = itemRowOf({ state: "pending-review", revision: 2 })
const SEED = { learnerId: CAREER_LEARNER, signerId: CAREER_TEACHER }

const build = async (em: MockEntityManager, devSeed: boolean, produced: ExperienceItemView = GRADED) => {
    fakeTransaction(em)
    const experiences = mock<ExperienceService>()
    experiences.produce.mockResolvedValue(produced)
    const audit = mock<ExperienceAuditService>()
    audit.append.mockResolvedValue(undefined)
    const moduleRef = await Test.createTestingModule({
        providers: [
            ExperienceSeedService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(CAREER_NOW) },
            { provide: CAREER_OPTIONS, useValue: { devSeed } },
            { provide: ExperienceService, useValue: experiences },
            { provide: ExperienceAuditService, useValue: audit },
        ],
    }).compile()
    return { service: moduleRef.get(ExperienceSeedService), experiences, audit }
}

describe("ExperienceSeedService refusals", () => {
    it("refuses outside development and never writes", async () => {
        const { service, experiences } = await build(mockEntityManager(), false)

        await expect(service.seed(SEED)).rejects.toMatchObject({ code: CareerErrorCode.DevSeedDisabled })
        expect(experiences.produce).not.toHaveBeenCalled()
    })

    it("refuses a learner as the signer of their own sample", async () => {
        const { service } = await build(mockEntityManager(), true)

        await expect(service.seed({ ...SEED, signerId: CAREER_LEARNER })).rejects.toMatchObject({
            code: CareerErrorCode.SelfReview,
        })
    })
})

describe("ExperienceSeedService seed", () => {
    it("creates one graded, one pending and one verified sample with their audit rows", async () => {
        const em = mockEntityManager({
            query: [
                [SELECT_ITEM_FOR_UPDATE, [itemRowOf()]],
                [SUBMIT_ITEM, [PENDING_ROW]],
                [
                    APPROVE_ITEM,
                    [itemRowOf({ state: "verified", signer_role: "TEACHER", signed_at: new Date(CAREER_NOW) })],
                ],
            ],
        })
        const { service, experiences, audit } = await build(em, true)

        const views = await service.seed(SEED)

        expect(views.map((view) => view.state)).toEqual(["ai-graded", "pending-review", "verified"])
        expect(experiences.produce).toHaveBeenCalledTimes(3)
        expect(audit.append.mock.calls.map((call) => call[0].action)).toEqual(["submit", "submit", "approve"])
        expect(em.query).toHaveBeenCalledWith(APPROVE_ITEM, [
            CAREER_ITEM,
            2,
            CAREER_TEACHER,
            "TEACHER",
            new Date(CAREER_NOW),
        ])
    })

    it("leaves samples that already moved on as they are", async () => {
        const pending = toExperienceItemView(PENDING_ROW)
        const { service, audit } = await build(mockEntityManager(), true, pending)

        await expect(service.seed(SEED)).resolves.toEqual([pending, pending, pending])
        expect(audit.append).not.toHaveBeenCalled()
    })

    const expectDefect = async (em: MockEntityManager): Promise<void> => {
        const { service } = await build(em, true)
        await expect(service.seed(SEED)).rejects.toMatchObject({ code: CareerErrorCode.ItemNotSaved })
    }

    it("fails as a defect when the produced item cannot be read back or has no draft", async () => {
        await expectDefect(mockEntityManager({ query: [SELECT_ITEM_FOR_UPDATE, []] }))
        await expectDefect(mockEntityManager({ query: [SELECT_ITEM_FOR_UPDATE, [itemRowOf({ draft_line: null })]] }))
    })

    it("fails as a defect when the submit or the signature answers no row", async () => {
        await expectDefect(
            mockEntityManager({
                query: [
                    [SELECT_ITEM_FOR_UPDATE, [itemRowOf()]],
                    [SUBMIT_ITEM, []],
                ],
            }),
        )
        await expectDefect(
            mockEntityManager({
                query: [
                    [SELECT_ITEM_FOR_UPDATE, [itemRowOf()]],
                    [SUBMIT_ITEM, [PENDING_ROW]],
                    [APPROVE_ITEM, []],
                ],
            }),
        )
    })
})
