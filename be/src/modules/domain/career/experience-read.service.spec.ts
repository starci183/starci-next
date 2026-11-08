import { Test } from "@nestjs/testing"
import { FakeClock, mockEntityManager } from "@starci/jest-preset"
import type { MockEntityManager } from "@starci/jest-preset"
import { CLOCK } from "@modules/platform/clock"
import { LIST_ROWS_MAX, PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import {
    CAREER_ITEM,
    CAREER_LEARNER,
    CAREER_NOW,
    CAREER_REVIEWER,
    CAREER_TEACHER,
    ESSENTIALS_DRAFT,
    itemRowOf,
    reviewerOf,
    reviewerRowOf,
    teacherOf,
} from "@tests/fixtures/builders/career.builder"
import { CAREER_OPTIONS } from "./career.decorators"
import { CareerErrorCode } from "./errors/career.error"
import { ExperienceReadService } from "./experience-read.service"
import {
    SELECT_ACTIVE_REVIEWER,
    SELECT_BY_CODE,
    SELECT_DECISIONS,
    SELECT_ITEM,
    SELECT_LEARNER_ITEMS,
    SELECT_PENDING_ITEMS,
    SELECT_VERIFIED_ITEMS,
} from "./persistence/career.sql"

const build = async (em: MockEntityManager) => {
    const moduleRef = await Test.createTestingModule({
        providers: [
            ExperienceReadService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(CAREER_NOW) },
            { provide: CAREER_OPTIONS, useValue: { hiringMinVerified: 4 } },
        ],
    }).compile()
    return moduleRef.get(ExperienceReadService)
}

const OVERDUE = itemRowOf({
    item_id: "30000000-0000-4000-8000-0000000000c2",
    state: "pending-review",
    submitted_at: new Date("2026-11-02T02:00:00.000Z"),
    due_at: new Date("2026-11-05T02:00:00.000Z"),
    assignee_id: CAREER_REVIEWER,
})
const UNASSIGNED = itemRowOf({
    state: "pending-review",
    submitted_at: new Date(CAREER_NOW),
    due_at: new Date("2026-11-12T02:00:00.000Z"),
})

describe("ExperienceReadService mine", () => {
    it("lists the learner's items of one state with the hiring threshold", async () => {
        const em = mockEntityManager({ query: [SELECT_LEARNER_ITEMS, [itemRowOf()]] })
        const service = await build(em)

        const view = await service.mine({ learnerId: CAREER_LEARNER, state: "ai-graded" })

        expect(view.hiringMinVerified).toBe(4)
        expect(view.items.map((item) => item.itemId)).toEqual([CAREER_ITEM])
        expect(em.query).toHaveBeenCalledWith(SELECT_LEARNER_ITEMS, [CAREER_LEARNER, "ai-graded", LIST_ROWS_MAX])
    })
})

describe("ExperienceReadService queue", () => {
    it("shows the teacher every pending item but their own, with the count of each tab", async () => {
        const own = itemRowOf({ state: "pending-review", learner_id: CAREER_TEACHER })
        const em = mockEntityManager({ query: [SELECT_PENDING_ITEMS, [OVERDUE, UNASSIGNED, own]] })
        const service = await build(em)

        const all = await service.queue(teacherOf(), "pending")
        const overdue = await service.queue(teacherOf(), "overdue")
        const unassigned = await service.queue(teacherOf(), "unassigned")

        expect(all).toMatchObject({ role: "TEACHER", counts: { pending: 2, overdue: 1, unassigned: 1 } })
        expect(all.items).toHaveLength(2)
        expect(overdue.items.map((item) => item.sla)).toEqual(["overdue"])
        expect(unassigned.items.map((item) => item.assigneeId)).toEqual([null])
        expect(em.query).toHaveBeenCalledWith(SELECT_PENDING_ITEMS, [LIST_ROWS_MAX, null])
    })

    it("shows an appointed reviewer only the items assigned to them", async () => {
        const em = mockEntityManager({
            query: [
                [SELECT_ACTIVE_REVIEWER, [reviewerRowOf()]],
                [SELECT_PENDING_ITEMS, [OVERDUE]],
            ],
        })
        const service = await build(em)

        await expect(service.queue(reviewerOf(), "pending")).resolves.toMatchObject({ role: "REVIEWER" })
        expect(em.query).toHaveBeenCalledWith(SELECT_PENDING_ITEMS, [LIST_ROWS_MAX, CAREER_REVIEWER])
    })

    it("refuses a learner and a reviewer without an appointment", async () => {
        const service = await build(mockEntityManager({ query: [SELECT_ACTIVE_REVIEWER, []] }))

        await expect(service.queue({ subject: CAREER_LEARNER, roles: [] }, "pending")).rejects.toMatchObject({
            code: CareerErrorCode.ReviewForbidden,
        })
        await expect(service.queue(reviewerOf(), "pending")).rejects.toMatchObject({
            code: CareerErrorCode.ReviewForbidden,
        })
    })
})

describe("ExperienceReadService item", () => {
    const history = [
        {
            action: "submit",
            actor_role: "learner",
            from_state: "ai-graded",
            to_state: "pending-review",
            note: null,
            at: new Date(CAREER_NOW),
        },
    ]

    it("answers the item and its audit trail to the teacher", async () => {
        const em = mockEntityManager({
            query: [
                [SELECT_ITEM, [UNASSIGNED]],
                [SELECT_DECISIONS, history],
            ],
        })
        const service = await build(em)

        const view = await service.item(teacherOf(), CAREER_ITEM)

        expect(view.item.itemId).toBe(CAREER_ITEM)
        expect(view.history).toEqual([
            {
                action: "submit",
                actorRole: "learner",
                fromState: "ai-graded",
                toState: "pending-review",
                note: null,
                at: CAREER_NOW,
            },
        ])
        expect(em.query).toHaveBeenCalledWith(SELECT_DECISIONS, [CAREER_ITEM, LIST_ROWS_MAX])
    })

    it("answers a reviewer an item assigned to them even outside their parts", async () => {
        const assigned = itemRowOf({ part: "interview", assignee_id: CAREER_REVIEWER })
        const em = mockEntityManager({
            query: [
                [SELECT_ACTIVE_REVIEWER, [reviewerRowOf()]],
                [SELECT_ITEM, [assigned]],
                [SELECT_DECISIONS, []],
            ],
        })
        const service = await build(em)

        await expect(service.item(reviewerOf(), CAREER_ITEM)).resolves.toMatchObject({ history: [] })
    })

    it("refuses the signer's own item with its own code", async () => {
        const own = itemRowOf({ learner_id: CAREER_TEACHER })
        const service = await build(mockEntityManager({ query: [SELECT_ITEM, [own]] }))

        await expect(service.item(teacherOf(), CAREER_ITEM)).rejects.toMatchObject({ code: CareerErrorCode.SelfReview })
    })

    it("refuses a reviewer an item outside the scope, and does not find an unknown item", async () => {
        const outside = await build(
            mockEntityManager({
                query: [
                    [SELECT_ACTIVE_REVIEWER, [reviewerRowOf()]],
                    [SELECT_ITEM, [itemRowOf({ part: "interview" })]],
                ],
            }),
        )
        const missing = await build(mockEntityManager({ query: [SELECT_ITEM, []] }))

        await expect(outside.item(reviewerOf(), CAREER_ITEM)).rejects.toMatchObject({
            code: CareerErrorCode.ReviewForbidden,
        })
        await expect(missing.item(teacherOf(), CAREER_ITEM)).rejects.toMatchObject({
            code: CareerErrorCode.ItemNotFound,
        })
    })
})

describe("ExperienceReadService verify", () => {
    it("answers the public view of a signed code, normalised", async () => {
        const signed = itemRowOf({
            state: "verified",
            line: ESSENTIALS_DRAFT,
            signer_role: "TEACHER",
            signed_at: new Date(CAREER_NOW),
        })
        const em = mockEntityManager({ query: [SELECT_BY_CODE, [signed]] })
        const service = await build(em)

        await expect(service.verify(" k7q2-9dla-41tr ")).resolves.toMatchObject({
            state: "verified",
            signerRole: "TEACHER",
        })
        expect(em.query).toHaveBeenCalledWith(SELECT_BY_CODE, ["K7Q2-9DLA-41TR"])
    })

    it("does not find an unknown code or an unsigned row", async () => {
        const unknown = await build(mockEntityManager({ query: [SELECT_BY_CODE, []] }))
        const unsigned = await build(mockEntityManager({ query: [SELECT_BY_CODE, [itemRowOf()]] }))

        await expect(unknown.verify("AAAA-BBBB-CCCC")).rejects.toMatchObject({ code: CareerErrorCode.ItemNotFound })
        await expect(unsigned.verify("AAAA-BBBB-CCCC")).rejects.toMatchObject({ code: CareerErrorCode.ItemNotFound })
    })
})

describe("ExperienceReadService verifiedItems", () => {
    it("answers only the verified items, the read a path engine counts", async () => {
        const em = mockEntityManager({
            query: [SELECT_VERIFIED_ITEMS, [itemRowOf({ state: "verified", signed_at: new Date(CAREER_NOW) })]],
        })
        const service = await build(em)

        await expect(service.verifiedItems(CAREER_LEARNER)).resolves.toEqual([
            expect.objectContaining({ itemId: CAREER_ITEM, signedAt: CAREER_NOW }),
        ])
        expect(em.query).toHaveBeenCalledWith(SELECT_VERIFIED_ITEMS, [CAREER_LEARNER, LIST_ROWS_MAX])
    })
})
