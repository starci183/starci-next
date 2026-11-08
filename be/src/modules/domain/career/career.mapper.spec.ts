import { Test } from "@nestjs/testing"
import {
    CAREER_ITEM,
    CAREER_NOW,
    CAREER_REVIEWER,
    ESSENTIALS_DRAFT,
    itemRowOf,
    reviewerRowOf,
} from "@tests/fixtures/builders/career.builder"
import {
    learnerHandleOf,
    toExperienceItemView,
    toReviewDecisionView,
    toReviewQueueItemView,
    toReviewerView,
    toVerificationView,
    toVerifiedExperienceView,
} from "./career.mapper"
import { DEFAULT_CAREER_SETTINGS } from "./review-sla.policy"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = {
    learnerHandleOf,
    toExperienceItemView,
    toReviewDecisionView,
    toReviewQueueItemView,
    toReviewerView,
    toVerificationView,
    toVerifiedExperienceView,
}

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("career.career-mapper")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

const SIGNED = new Date("2026-11-10T03:00:00.000Z")
const NOW = new Date(CAREER_NOW)

describe("toExperienceItemView", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("maps an unsigned item with the catalog output and defense questions", () => {
        const view = subject.toExperienceItemView(itemRowOf())

        expect(view).toMatchObject({
            itemId: CAREER_ITEM,
            output: "cv-line",
            state: "ai-graded",
            draftLine: ESSENTIALS_DRAFT,
            signature: null,
            dueAt: null,
            revokedAt: null,
            defenseQuestions: [],
            updatedAt: CAREER_NOW,
        })
    })

    it("maps the signature and the dates of a signed item", () => {
        const row = itemRowOf({ state: "verified", signer_role: "TEACHER", signed_at: SIGNED, due_at: SIGNED })

        expect(subject.toExperienceItemView(row)).toMatchObject({
            signature: { role: "TEACHER", signedAt: SIGNED.toISOString() },
            dueAt: SIGNED.toISOString(),
        })
        expect(subject.toExperienceItemView(itemRowOf({ signer_role: "TEACHER" })).signature).toBeNull()
    })
})

describe("toReviewQueueItemView", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("adds the handle, the assignee and the SLA of a submitted item", () => {
        const submitted = new Date("2026-11-04T02:00:00.000Z")
        const row = itemRowOf({
            state: "pending-review",
            submitted_at: submitted,
            due_at: new Date("2026-11-07T02:00:00.000Z"),
            assignee_id: CAREER_REVIEWER,
        })

        expect(subject.toReviewQueueItemView(row, NOW, DEFAULT_CAREER_SETTINGS)).toMatchObject({
            learnerHandle: "HV-0000C1",
            assigneeId: CAREER_REVIEWER,
            teacherOnly: false,
            sla: "overdue",
        })
    })

    it("is on time while the item has no deadline", () => {
        expect(subject.toReviewQueueItemView(itemRowOf(), NOW, DEFAULT_CAREER_SETTINGS).sla).toBe("on-time")
        expect(subject.learnerHandleOf("abc")).toBe("HV-ABC")
    })
})

describe("toReviewDecisionView", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("maps an audit row", () => {
        const row = {
            action: "return" as const,
            actor_role: "TEACHER" as const,
            from_state: "pending-review" as const,
            to_state: "returned" as const,
            note: "Missing measurement",
            at: SIGNED,
        }

        expect(subject.toReviewDecisionView(row)).toEqual({
            action: "return",
            actorRole: "TEACHER",
            fromState: "pending-review",
            toState: "returned",
            note: "Missing measurement",
            at: SIGNED.toISOString(),
        })
    })
})

describe("toVerificationView", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("shows the signed line, role and date, and the evidence kinds once", () => {
        const row = itemRowOf({
            state: "verified",
            line: ESSENTIALS_DRAFT,
            signer_role: "REVIEWER",
            signed_at: SIGNED,
            evidence: [
                { kind: "lesson-proved", ref: "a", proofForm: "proved-lesson", at: CAREER_NOW },
                { kind: "lesson-proved", ref: "b", proofForm: "proved-lesson", at: CAREER_NOW },
            ],
        })

        expect(subject.toVerificationView(row)).toEqual({
            code: "K7Q2-9DLA-41TR",
            itemType: "essentials.concept-proved",
            part: "essentials",
            line: ESSENTIALS_DRAFT,
            state: "verified",
            signerRole: "REVIEWER",
            signedAt: SIGNED.toISOString(),
            revokedAt: null,
            evidenceKinds: ["lesson-proved"],
        })
    })

    it("shows a revoked item revoked, and nothing for an item never signed", () => {
        const revoked = itemRowOf({
            state: "revoked",
            line: ESSENTIALS_DRAFT,
            signer_role: "TEACHER",
            signed_at: SIGNED,
            revoked_at: NOW,
        })

        expect(subject.toVerificationView(revoked)).toMatchObject({ state: "revoked", revokedAt: CAREER_NOW })
        expect(subject.toVerificationView(itemRowOf())).toBeNull()
        expect(subject.toVerificationView(itemRowOf({ line: ESSENTIALS_DRAFT }))).toBeNull()
        expect(subject.toVerificationView(itemRowOf({ line: ESSENTIALS_DRAFT, signer_role: "TEACHER" }))).toBeNull()
    })
})

describe("toVerifiedExperienceView", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("answers what the path engine counts, with the signature date", () => {
        expect(subject.toVerifiedExperienceView(itemRowOf({ state: "verified", signed_at: SIGNED }))).toEqual({
            itemId: CAREER_ITEM,
            itemType: "essentials.concept-proved",
            part: "essentials",
            subject: "request-lifecycle@p-1",
            projectId: "p-1",
            signedAt: SIGNED.toISOString(),
        })
        expect(subject.toVerifiedExperienceView(itemRowOf()).signedAt).toBe(CAREER_NOW)
    })
})

describe("toReviewerView", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("maps an active and an ended appointment", () => {
        expect(subject.toReviewerView(reviewerRowOf())).toEqual({
            reviewerId: CAREER_REVIEWER,
            parts: ["essentials", "projects"],
            capacity: 30,
            conflicts: [],
            appointedAt: CAREER_NOW,
            endedAt: null,
            openItems: 0,
        })
        expect(subject.toReviewerView(reviewerRowOf({ ended_at: SIGNED })).endedAt).toBe(SIGNED.toISOString())
    })
})
