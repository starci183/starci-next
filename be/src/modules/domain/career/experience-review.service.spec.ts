import { Test } from "@nestjs/testing"
import { FakeClock, fakeTransaction, mock, mockEntityManager } from "@starci/jest-preset"
import type { MockEntityManager } from "@starci/jest-preset"
import { CLOCK } from "@modules/platform/clock"
import { LIST_ROWS_MAX, PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import {
    CAREER_ITEM,
    CAREER_LEARNER,
    CAREER_NOW,
    CAREER_REVIEWER,
    CAREER_TEACHER,
    itemRowOf,
    reviewerOf,
    reviewerRowOf,
    teacherOf,
} from "@tests/fixtures/builders/career.builder"
import { CareerErrorCode } from "./errors/career.error"
import { ExperienceAuditService } from "./experience-audit.service"
import { EXPERIENCE_NOTIFIER, type ExperienceNotifier } from "./experience-notifier.port"
import { ExperienceReviewService } from "./experience-review.service"
import {
    APPROVE_ITEM,
    ASSIGN_ITEM,
    ESCALATE_OVERDUE,
    RETURN_ITEM,
    REVOKE_ITEM,
    SELECT_ACTIVE_REVIEWER,
    SELECT_ITEM_FOR_UPDATE,
} from "./persistence/career.sql"

const NOW = new Date(CAREER_NOW)
const PENDING = itemRowOf({ state: "pending-review", assignee_id: CAREER_REVIEWER, revision: 2 })

const build = async (em: MockEntityManager) => {
    fakeTransaction(em)
    const audit = mock<ExperienceAuditService>()
    audit.append.mockResolvedValue(undefined)
    const notifier = mock<ExperienceNotifier>()
    notifier.notify.mockResolvedValue(undefined)
    const moduleRef = await Test.createTestingModule({
        providers: [
            ExperienceReviewService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(CAREER_NOW) },
            { provide: ExperienceAuditService, useValue: audit },
            { provide: EXPERIENCE_NOTIFIER, useValue: notifier },
        ],
    }).compile()
    return { service: moduleRef.get(ExperienceReviewService), audit, notifier }
}

const approve = { itemId: CAREER_ITEM, verdict: "approve" as const, note: null }
const giveBack = { itemId: CAREER_ITEM, verdict: "return" as const, note: " Missing measurement " }

describe("ExperienceReviewService decide", () => {
    it("refuses a caller with neither role the whole batch", async () => {
        const { service } = await build(mockEntityManager())

        await expect(
            service.decide({ signer: { subject: CAREER_LEARNER, roles: [] }, decisions: [approve] }),
        ).rejects.toMatchObject({ code: CareerErrorCode.ReviewForbidden })
    })

    it("refuses a REVIEWER role without an active appointment", async () => {
        const { service } = await build(mockEntityManager({ query: [SELECT_ACTIVE_REVIEWER, []] }))

        await expect(service.decide({ signer: reviewerOf(), decisions: [approve] })).rejects.toMatchObject({
            code: CareerErrorCode.ReviewForbidden,
        })
    })

    it("signs an item as the teacher, audits it and tells the learner", async () => {
        const verified = itemRowOf({ state: "verified", signer_role: "TEACHER", signed_at: NOW })
        const em = mockEntityManager({
            query: [
                [SELECT_ITEM_FOR_UPDATE, [PENDING]],
                [APPROVE_ITEM, [verified]],
            ],
        })
        const { service, audit, notifier } = await build(em)

        const results = await service.decide({ signer: teacherOf(), decisions: [approve] })

        expect(results).toEqual([{ itemId: CAREER_ITEM, state: "verified", refusal: null }])
        expect(em.query).toHaveBeenCalledWith(APPROVE_ITEM, [CAREER_ITEM, 2, CAREER_TEACHER, "TEACHER", NOW])
        expect(audit.append).toHaveBeenCalledWith(
            expect.objectContaining({
                action: "approve",
                actorId: CAREER_TEACHER,
                actorRole: "TEACHER",
                fromState: "pending-review",
                note: null,
            }),
        )
        expect(notifier.notify).toHaveBeenCalledWith(
            CAREER_LEARNER,
            "experience.verified",
            { itemType: "essentials.concept-proved", part: "essentials" },
            "/experience",
        )
    })

    it("returns an item in the reviewer's scope with the trimmed note", async () => {
        const em = mockEntityManager({
            query: [
                [SELECT_ACTIVE_REVIEWER, [reviewerRowOf()]],
                [SELECT_ITEM_FOR_UPDATE, [PENDING]],
                [RETURN_ITEM, [itemRowOf({ state: "returned", return_note: "Missing measurement" })]],
            ],
        })
        const { service, notifier } = await build(em)

        const results = await service.decide({ signer: reviewerOf(), decisions: [giveBack] })

        expect(results).toEqual([{ itemId: CAREER_ITEM, state: "returned", refusal: null }])
        expect(em.query).toHaveBeenCalledWith(RETURN_ITEM, [CAREER_ITEM, 2, "Missing measurement", NOW])
        expect(notifier.notify).toHaveBeenCalledWith(
            CAREER_LEARNER,
            "experience.returned",
            expect.anything(),
            "/experience",
        )
    })
})

describe("ExperienceReviewService decide per item", () => {
    it("answers each refusal on its own item and applies the rest", async () => {
        const em = mockEntityManager({
            query: [
                [SELECT_ITEM_FOR_UPDATE, [PENDING]],
                [SELECT_ITEM_FOR_UPDATE, [itemRowOf({ state: "verified" })]],
                [SELECT_ITEM_FOR_UPDATE, [PENDING]],
                [APPROVE_ITEM, []],
                [APPROVE_ITEM, [itemRowOf({ state: "verified" })]],
            ],
        })
        const { service } = await build(em)
        const decisions = [{ ...giveBack, note: "  " }, approve, approve, approve]

        const results = await service.decide({ signer: teacherOf(), decisions })

        expect(results.map((result) => result.refusal)).toEqual([
            CareerErrorCode.ReviewNoteRequired,
            CareerErrorCode.ReviewConflict,
            CareerErrorCode.ReviewConflict,
            null,
        ])
    })

    it("refuses the signer's own item with its own code", async () => {
        const own = itemRowOf({ state: "pending-review", learner_id: CAREER_TEACHER })
        const { service } = await build(mockEntityManager({ query: [SELECT_ITEM_FOR_UPDATE, [own]] }))

        const results = await service.decide({ signer: teacherOf(), decisions: [approve] })

        expect(results[0]?.refusal).toBe(CareerErrorCode.SelfReview)
    })

    it("refuses an item outside a reviewer's scope", async () => {
        const outside = itemRowOf({ state: "pending-review", part: "interview" })
        const em = mockEntityManager({
            query: [
                [SELECT_ACTIVE_REVIEWER, [reviewerRowOf()]],
                [SELECT_ITEM_FOR_UPDATE, [outside]],
            ],
        })
        const { service } = await build(em)

        const results = await service.decide({ signer: reviewerOf(), decisions: [approve] })

        expect(results[0]?.refusal).toBe(CareerErrorCode.ReviewForbidden)
    })

    it("rethrows a failure that is not a refusal", async () => {
        const em = mockEntityManager({ query: [SELECT_ITEM_FOR_UPDATE, [PENDING]] })
        em.query.mockRejectedValueOnce(new Error("connection lost"))
        const { service } = await build(em)

        await expect(service.decide({ signer: teacherOf(), decisions: [approve] })).rejects.toThrow("connection lost")
    })
})

describe("ExperienceReviewService revoke", () => {
    const revokeOf = { signer: teacherOf(), itemId: CAREER_ITEM, reason: "Wrong evidence" }

    it("is the teacher's alone and needs a reason", async () => {
        const { service } = await build(mockEntityManager())

        await expect(service.revoke({ ...revokeOf, signer: reviewerOf() })).rejects.toMatchObject({
            code: CareerErrorCode.ReviewForbidden,
        })
        await expect(service.revoke({ ...revokeOf, reason: " " })).rejects.toMatchObject({
            code: CareerErrorCode.ReviewNoteRequired,
        })
    })

    it("revokes a verified item with its audit row, and refuses any other", async () => {
        const em = mockEntityManager({
            query: [
                [SELECT_ITEM_FOR_UPDATE, [itemRowOf({ state: "verified" })]],
                [SELECT_ITEM_FOR_UPDATE, [itemRowOf()]],
                [REVOKE_ITEM, [itemRowOf({ state: "revoked", revoked_at: NOW })]],
            ],
        })
        const { service, audit } = await build(em)

        await expect(service.revoke(revokeOf)).resolves.toMatchObject({ state: "revoked", revokedAt: CAREER_NOW })
        expect(audit.append).toHaveBeenCalledWith(
            expect.objectContaining({ action: "revoke", note: "Wrong evidence", fromState: "verified" }),
        )
        await expect(service.revoke(revokeOf)).rejects.toMatchObject({ code: CareerErrorCode.NotVerified })
    })

    it("does not find an unknown item", async () => {
        const { service } = await build(mockEntityManager({ query: [SELECT_ITEM_FOR_UPDATE, []] }))

        await expect(service.revoke(revokeOf)).rejects.toMatchObject({ code: CareerErrorCode.ItemNotFound })
    })
})

describe("ExperienceReviewService assign", () => {
    const assignOf = { signer: teacherOf(), itemId: CAREER_ITEM, reviewerId: CAREER_REVIEWER }

    it("assigns a pending item to an appointed reviewer and audits it", async () => {
        const em = mockEntityManager({
            query: [
                [SELECT_ACTIVE_REVIEWER, [reviewerRowOf()]],
                [SELECT_ITEM_FOR_UPDATE, [PENDING]],
                [ASSIGN_ITEM, [PENDING]],
            ],
        })
        const { service, audit } = await build(em)

        await service.assign(assignOf)

        expect(em.query).toHaveBeenCalledWith(ASSIGN_ITEM, [CAREER_ITEM, 2, CAREER_REVIEWER, NOW])
        expect(audit.append).toHaveBeenCalledWith(expect.objectContaining({ action: "assign", actorRole: "TEACHER" }))
    })

    it("moves an item back to the teacher's queue without checking an appointment", async () => {
        const em = mockEntityManager({
            query: [
                [SELECT_ITEM_FOR_UPDATE, [PENDING]],
                [ASSIGN_ITEM, [PENDING]],
            ],
        })
        const { service } = await build(em)

        await expect(service.assign({ ...assignOf, reviewerId: null })).resolves.toMatchObject({ itemId: CAREER_ITEM })
    })

    it("refuses an unknown reviewer, a decided item and the learner as their own reviewer", async () => {
        const unknown = await build(mockEntityManager({ query: [SELECT_ACTIVE_REVIEWER, []] }))
        const decided = await build(
            mockEntityManager({
                query: [
                    [SELECT_ACTIVE_REVIEWER, [reviewerRowOf()]],
                    [SELECT_ITEM_FOR_UPDATE, [itemRowOf()]],
                ],
            }),
        )
        const own = await build(
            mockEntityManager({
                query: [
                    [SELECT_ACTIVE_REVIEWER, [reviewerRowOf()]],
                    [SELECT_ITEM_FOR_UPDATE, [itemRowOf({ state: "pending-review", learner_id: CAREER_REVIEWER })]],
                ],
            }),
        )

        await expect(unknown.service.assign(assignOf)).rejects.toMatchObject({ code: CareerErrorCode.ReviewerNotFound })
        await expect(decided.service.assign(assignOf)).rejects.toMatchObject({ code: CareerErrorCode.StateConflict })
        await expect(own.service.assign(assignOf)).rejects.toMatchObject({ code: CareerErrorCode.SelfReview })
    })
})

describe("ExperienceReviewService escalateOverdue", () => {
    it("moves the overdue items to the teacher with one system row each", async () => {
        const em = mockEntityManager({ query: [ESCALATE_OVERDUE, [PENDING, PENDING]] })
        const { service, audit } = await build(em)

        await expect(service.escalateOverdue()).resolves.toBe(2)
        expect(em.query).toHaveBeenCalledWith(ESCALATE_OVERDUE, [NOW, LIST_ROWS_MAX])
        expect(audit.append).toHaveBeenCalledTimes(2)
        expect(audit.append).toHaveBeenCalledWith(expect.objectContaining({ action: "escalate", actorRole: "system" }))
    })
})
