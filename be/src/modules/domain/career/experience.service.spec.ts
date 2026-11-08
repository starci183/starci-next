import { Test } from "@nestjs/testing"
import { FakeClock, fakeTransaction, mock, mockEntityManager } from "@starci/jest-preset"
import type { MockEntityManager } from "@starci/jest-preset"
import { ENTITLEMENT_SERVICE, type EntitlementService } from "@modules/domain/entitlement"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import {
    CAREER_ITEM,
    CAREER_LEARNER,
    CAREER_NOW,
    CAREER_OTHER_LEARNER,
    CAREER_REVIEWER,
    ESSENTIALS_DRAFT,
    itemRowOf,
    produceParamsOf,
} from "@tests/fixtures/builders/career.builder"
import { CAREER_OPTIONS } from "./career.decorators"
import { CareerErrorCode } from "./errors/career.error"
import { ExperienceAuditService } from "./experience-audit.service"
import { ExperienceService } from "./experience.service"
import {
    INSERT_ITEM,
    PICK_REVIEWER,
    REGRADE_ITEM,
    SELECT_ITEM_FOR_UPDATE,
    SELECT_LEARNER_ITEM,
    SELECT_OPEN_ITEM_FOR_UPDATE,
    SHOW_ITEM,
    SUBMIT_ITEM,
} from "./persistence/career.sql"

const NOW = new Date(CAREER_NOW)

/** The parameters of the n-th statement the double ran. */
const argsOf = (em: MockEntityManager, index: number): ReadonlyArray<unknown> => {
    const args: unknown = em.query.mock.calls[index]?.[1]
    return Array.isArray(args) ? args : []
}

const build = async (em: MockEntityManager, premium = true) => {
    fakeTransaction(em)
    const entitlement = mock<EntitlementService>()
    entitlement.isPremium.mockResolvedValue(premium)
    const audit = mock<ExperienceAuditService>()
    audit.append.mockResolvedValue(undefined)
    const moduleRef = await Test.createTestingModule({
        providers: [
            ExperienceService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(CAREER_NOW) },
            { provide: ENTITLEMENT_SERVICE, useValue: entitlement },
            { provide: CAREER_OPTIONS, useValue: {} },
            { provide: ExperienceAuditService, useValue: audit },
        ],
    }).compile()
    return { service: moduleRef.get(ExperienceService), audit }
}

describe("ExperienceService produce", () => {
    it("refuses an item type that needs a project when none is named", async () => {
        const { service } = await build(mockEntityManager())

        await expect(service.produce(produceParamsOf({ projectId: null }))).rejects.toMatchObject({
            code: CareerErrorCode.ItemTypeUnknown,
        })
    })

    it("creates a passing item in ai-graded with the drafted line and its audit row", async () => {
        const em = mockEntityManager({ query: [INSERT_ITEM, [itemRowOf()]] })
        const { service, audit } = await build(em)

        const view = await service.produce(produceParamsOf())

        expect(view).toMatchObject({ itemId: CAREER_ITEM, state: "ai-graded", draftLine: ESSENTIALS_DRAFT })
        const args = argsOf(em, 0)
        expect(args.slice(0, 5)).toEqual([
            CAREER_LEARNER,
            "essentials.concept-proved",
            "essentials",
            "request-lifecycle@p-1",
            "p-1",
        ])
        expect(args.slice(8)).toEqual([JSON.stringify(ESSENTIALS_DRAFT), "ai-graded", NOW])
        expect(audit.append).toHaveBeenCalledWith(
            expect.objectContaining({ action: "grade", actorRole: "system", actorId: null, fromState: null, at: NOW }),
        )
    })

    it("keeps a failing item practising with no draft", async () => {
        const em = mockEntityManager({ query: [INSERT_ITEM, [itemRowOf({ state: "practising", draft_line: null })]] })
        const { service } = await build(em)

        const view = await service.produce(produceParamsOf({ grade: { result: "fail", criteria: [] } }))

        expect(view.state).toBe("practising")
        expect(argsOf(em, 0).slice(8, 10)).toEqual([null, "practising"])
    })
})

describe("ExperienceService produce over an open item", () => {
    it("regrades the open item with the new evidence and audits the change", async () => {
        const em = mockEntityManager({
            query: [
                [INSERT_ITEM, []],
                [SELECT_OPEN_ITEM_FOR_UPDATE, [itemRowOf({ state: "returned" })]],
                [REGRADE_ITEM, [itemRowOf({ evidence_revision: 2 })]],
            ],
        })
        const { service, audit } = await build(em)

        const view = await service.produce(produceParamsOf())

        expect(view.state).toBe("ai-graded")
        expect(audit.append).toHaveBeenCalledWith(expect.objectContaining({ action: "grade", fromState: "returned" }))
    })

    it("regrades a failing resubmission back to practising with no draft", async () => {
        const em = mockEntityManager({
            query: [
                [INSERT_ITEM, []],
                [SELECT_OPEN_ITEM_FOR_UPDATE, [itemRowOf()]],
                [REGRADE_ITEM, [itemRowOf({ state: "practising", draft_line: null })]],
            ],
        })
        const { service } = await build(em)

        await expect(
            service.produce(produceParamsOf({ grade: { result: "fail", criteria: [] } })),
        ).resolves.toMatchObject({
            state: "practising",
        })
        expect(argsOf(em, 2).slice(4)).toEqual([null, "practising", NOW])
    })

    it("leaves a pending, verified or revoked item as it is", async () => {
        const em = mockEntityManager({
            query: [
                [INSERT_ITEM, []],
                [SELECT_OPEN_ITEM_FOR_UPDATE, [itemRowOf({ state: "verified" })]],
                [REGRADE_ITEM, []],
            ],
        })
        const { service, audit } = await build(em)

        await expect(service.produce(produceParamsOf())).resolves.toMatchObject({ state: "verified" })
        expect(audit.append).not.toHaveBeenCalled()
    })

    it("fails as a defect when neither the insert nor the open item answers", async () => {
        const em = mockEntityManager({
            query: [
                [INSERT_ITEM, []],
                [SELECT_OPEN_ITEM_FOR_UPDATE, []],
            ],
        })
        const { service } = await build(em)

        await expect(service.produce(produceParamsOf())).rejects.toMatchObject({ code: CareerErrorCode.ItemNotSaved })
    })
})

/** A submit of the essentials item by its learner. */
const submitOf = (line = ESSENTIALS_DRAFT) => ({ learnerId: CAREER_LEARNER, itemId: CAREER_ITEM, line })

describe("ExperienceService submit refusals", () => {
    it("needs Premium and reads nothing without it", async () => {
        const { service } = await build(mockEntityManager(), false)

        await expect(service.submit(submitOf())).rejects.toMatchObject({ code: CareerErrorCode.PremiumRequired })
    })

    it("does not find the item of another learner, or no item", async () => {
        const other = await build(
            mockEntityManager({ query: [SELECT_ITEM_FOR_UPDATE, [itemRowOf({ learner_id: CAREER_OTHER_LEARNER })]] }),
        )
        const none = await build(mockEntityManager({ query: [SELECT_ITEM_FOR_UPDATE, []] }))

        await expect(other.service.submit(submitOf())).rejects.toMatchObject({ code: CareerErrorCode.ItemNotFound })
        await expect(none.service.submit(submitOf())).rejects.toMatchObject({ code: CareerErrorCode.ItemNotFound })
    })

    it.each([
        itemRowOf({ state: "pending-review" }),
        itemRowOf({ state: "verified" }),
        itemRowOf({ draft_line: null }),
    ])("refuses an item that cannot be submitted", async (row) => {
        const { service } = await build(mockEntityManager({ query: [SELECT_ITEM_FOR_UPDATE, [row]] }))

        await expect(service.submit(submitOf())).rejects.toMatchObject({ code: CareerErrorCode.StateConflict })
    })

    it("refuses a line that changes a value from the evidence", async () => {
        const { service } = await build(mockEntityManager({ query: [SELECT_ITEM_FOR_UPDATE, [itemRowOf()]] }))

        await expect(
            service.submit(submitOf({ ...ESSENTIALS_DRAFT, en: "Built a big system." })),
        ).rejects.toMatchObject({
            code: CareerErrorCode.LineSlotChanged,
        })
    })

    it("refuses a returned item resubmitted with the same line and evidence", async () => {
        const row = itemRowOf({
            state: "returned",
            return_count: 1,
            returned_line: ESSENTIALS_DRAFT,
            returned_evidence_revision: 1,
        })
        const { service } = await build(mockEntityManager({ query: [SELECT_ITEM_FOR_UPDATE, [row]] }))

        await expect(service.submit(submitOf())).rejects.toMatchObject({ code: CareerErrorCode.ResubmitUnchanged })
    })
})

describe("ExperienceService submit writes", () => {
    it("submits to the reviewer the queue picks, with a three-working-day deadline and an audit row", async () => {
        const pending = itemRowOf({ state: "pending-review", assignee_id: CAREER_REVIEWER, line: ESSENTIALS_DRAFT })
        const em = mockEntityManager({
            query: [
                [SELECT_ITEM_FOR_UPDATE, [itemRowOf()]],
                [PICK_REVIEWER, [{ reviewer_id: CAREER_REVIEWER }]],
                [SUBMIT_ITEM, [pending]],
            ],
        })
        const { service, audit } = await build(em)

        const view = await service.submit(submitOf())

        expect(view.state).toBe("pending-review")
        expect(em.query).toHaveBeenCalledWith(SUBMIT_ITEM, [
            CAREER_ITEM,
            1,
            JSON.stringify(ESSENTIALS_DRAFT),
            CAREER_REVIEWER,
            false,
            NOW,
            new Date("2026-11-12T02:00:00.000Z"),
        ])
        expect(audit.append).toHaveBeenCalledWith(
            expect.objectContaining({
                action: "submit",
                actorId: CAREER_LEARNER,
                actorRole: "learner",
                fromState: "ai-graded",
            }),
        )
    })
})

describe("ExperienceService resubmits", () => {
    it("resubmits a changed returned line to the teacher's queue when no reviewer is free", async () => {
        const reworded = { ...ESSENTIALS_DRAFT, vi: `${ESSENTIALS_DRAFT.vi} With tests attached.` }
        const row = itemRowOf({
            state: "returned",
            return_count: 1,
            returned_line: ESSENTIALS_DRAFT,
            returned_evidence_revision: 1,
        })
        const em = mockEntityManager({
            query: [
                [SELECT_ITEM_FOR_UPDATE, [row]],
                [PICK_REVIEWER, []],
                [SUBMIT_ITEM, [itemRowOf({ state: "pending-review" })]],
            ],
        })
        const { service, audit } = await build(em)

        await service.submit(submitOf(reworded))

        expect(argsOf(em, 2)[3]).toBeNull()
        expect(audit.append).toHaveBeenCalledWith(
            expect.objectContaining({ action: "resubmit", fromState: "returned" }),
        )
    })

    it("holds an item returned three times for the teacher only, seven calendar days", async () => {
        const row = itemRowOf({
            state: "ai-graded",
            return_count: 3,
            returned_line: ESSENTIALS_DRAFT,
            returned_evidence_revision: 1,
            evidence_revision: 2,
        })
        const em = mockEntityManager({
            query: [
                [SELECT_ITEM_FOR_UPDATE, [row]],
                [SUBMIT_ITEM, [itemRowOf({ state: "pending-review", teacher_only: true })]],
            ],
        })
        const { service } = await build(em)

        await service.submit(submitOf())

        const args = argsOf(em, 1)
        expect(args.slice(3)).toEqual([null, true, NOW, new Date("2026-11-16T02:00:00.000Z")])
    })

    it("refuses when the item changed between the read and the write", async () => {
        const em = mockEntityManager({
            query: [
                [SELECT_ITEM_FOR_UPDATE, [itemRowOf()]],
                [PICK_REVIEWER, []],
                [SUBMIT_ITEM, []],
            ],
        })
        const { service } = await build(em)

        await expect(service.submit(submitOf())).rejects.toMatchObject({ code: CareerErrorCode.StateConflict })
    })
})

describe("ExperienceService show", () => {
    const showOf = { learnerId: CAREER_LEARNER, itemId: CAREER_ITEM, shownPublicly: true }

    it("shows a verified item of the learner", async () => {
        const em = mockEntityManager({ query: [SHOW_ITEM, [itemRowOf({ state: "verified", shown_publicly: true })]] })
        const { service } = await build(em)

        await expect(service.show(showOf)).resolves.toMatchObject({ shownPublicly: true })
        expect(em.query).toHaveBeenCalledWith(SHOW_ITEM, [CAREER_LEARNER, CAREER_ITEM, true, NOW])
    })

    it("refuses an item that is not verified, and does not find another's", async () => {
        const unverified = await build(
            mockEntityManager({
                query: [
                    [SHOW_ITEM, []],
                    [SELECT_LEARNER_ITEM, [itemRowOf()]],
                ],
            }),
        )
        const missing = await build(
            mockEntityManager({
                query: [
                    [SHOW_ITEM, []],
                    [SELECT_LEARNER_ITEM, []],
                ],
            }),
        )

        await expect(unverified.service.show(showOf)).rejects.toMatchObject({ code: CareerErrorCode.NotVerified })
        await expect(missing.service.show(showOf)).rejects.toMatchObject({ code: CareerErrorCode.ItemNotFound })
    })
})
