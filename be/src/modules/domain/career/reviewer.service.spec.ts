import { Test } from "@nestjs/testing"
import { FakeClock, fakeTransaction, mockEntityManager } from "@starci/jest-preset"
import type { MockEntityManager } from "@starci/jest-preset"
import { CLOCK } from "@modules/platform/clock"
import { LIST_ROWS_MAX, PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import {
    CAREER_LEARNER,
    CAREER_NOW,
    CAREER_REVIEWER,
    CAREER_TEACHER,
    reviewerOf,
    reviewerRowOf,
    teacherOf,
} from "@tests/fixtures/builders/career.builder"
import { CAREER_OPTIONS } from "./career.decorators"
import { CareerErrorCode } from "./errors/career.error"
import { END_REVIEWER, INSERT_REVIEWER, SELECT_REVIEWERS } from "./persistence/career.sql"
import { ReviewerService } from "./reviewer.service"

const NOW = new Date(CAREER_NOW)

const build = async (em: MockEntityManager) => {
    fakeTransaction(em)
    const moduleRef = await Test.createTestingModule({
        providers: [
            ReviewerService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(CAREER_NOW) },
            { provide: CAREER_OPTIONS, useValue: {} },
        ],
    }).compile()
    return moduleRef.get(ReviewerService)
}

const setOf = {
    signer: teacherOf(),
    reviewerId: CAREER_REVIEWER,
    parts: ["essentials" as const, "essentials" as const],
    capacity: null,
    conflicts: [CAREER_LEARNER],
    end: false,
}

describe("ReviewerService set", () => {
    it("replaces the active appointment with the new scope and the default capacity", async () => {
        const em = mockEntityManager({
            query: [
                [END_REVIEWER, []],
                [INSERT_REVIEWER, [reviewerRowOf()]],
            ],
        })
        const service = await build(em)

        await expect(service.set(setOf)).resolves.toMatchObject({ reviewerId: CAREER_REVIEWER, endedAt: null })
        expect(em.query).toHaveBeenCalledWith(END_REVIEWER, [CAREER_REVIEWER, NOW])
        expect(em.query).toHaveBeenCalledWith(INSERT_REVIEWER, [
            CAREER_REVIEWER,
            JSON.stringify(["essentials"]),
            30,
            JSON.stringify([CAREER_LEARNER]),
            CAREER_TEACHER,
            NOW,
        ])
    })

    it("ends an appointment, and refuses to end one that does not exist", async () => {
        const ended = await build(mockEntityManager({ query: [END_REVIEWER, [reviewerRowOf({ ended_at: NOW })]] }))
        const none = await build(mockEntityManager({ query: [END_REVIEWER, []] }))

        await expect(ended.set({ ...setOf, end: true })).resolves.toMatchObject({ endedAt: CAREER_NOW })
        await expect(none.set({ ...setOf, end: true })).rejects.toMatchObject({
            code: CareerErrorCode.ReviewerNotFound,
        })
    })

    it("is the teacher's alone, and never appoints the teacher", async () => {
        const service = await build(mockEntityManager())

        await expect(service.set({ ...setOf, signer: reviewerOf() })).rejects.toMatchObject({
            code: CareerErrorCode.ReviewForbidden,
        })
        await expect(service.set({ ...setOf, reviewerId: CAREER_TEACHER })).rejects.toMatchObject({
            code: CareerErrorCode.ReviewerNotFound,
        })
    })

    it("fails as a defect when the insert answers no row", async () => {
        const service = await build(
            mockEntityManager({
                query: [
                    [END_REVIEWER, []],
                    [INSERT_REVIEWER, []],
                ],
            }),
        )

        await expect(service.set({ ...setOf, capacity: 5 })).rejects.toMatchObject({
            code: CareerErrorCode.ItemNotSaved,
        })
    })
})

describe("ReviewerService list", () => {
    it("lists the active appointments for the teacher only", async () => {
        const em = mockEntityManager({ query: [SELECT_REVIEWERS, [reviewerRowOf({ open_items: 2 })]] })
        const service = await build(em)

        await expect(service.list(teacherOf())).resolves.toEqual([expect.objectContaining({ openItems: 2 })])
        expect(em.query).toHaveBeenCalledWith(SELECT_REVIEWERS, [LIST_ROWS_MAX])
        await expect(service.list(reviewerOf())).rejects.toMatchObject({ code: CareerErrorCode.ReviewForbidden })
    })
})
