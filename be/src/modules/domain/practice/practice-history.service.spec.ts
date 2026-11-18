import { Test } from "@nestjs/testing"
import { mockEntityManager } from "@starci/jest-preset"
import { PRACTICE_LEARNER } from "@tests/fixtures/builders/practice.builder"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { PracticeError, PracticeErrorCode } from "./errors/practice.error"
import { PracticeHistoryService } from "./practice-history.service"
import { encodedSubmissionsCursor } from "./practice-page.policy"
import { PRACTICE_OPTIONS } from "./practice.decorators"
import type { PracticeOptions } from "./practice.options"
import type { SubmissionHistoryRow } from "./persistence/practice.rows"
import { SELECT_SUBMISSION_HISTORY } from "./persistence/practice.sql"

const row = (index: number, verdict = "accepted"): SubmissionHistoryRow => ({
    submission_id: `30000000-0000-4000-8000-00000000000${index}`,
    problem_id: `problem-${index}`,
    title: `Problem ${index}`,
    language: "python",
    verdict,
    passed_count: 3,
    total_count: 4,
    time_ms: 12,
    memory_kb: 2048,
    created_at: new Date(Date.UTC(2026, 10, 9, 10, 0, 10 - index)),
})

const build = async (rows: ReadonlyArray<SubmissionHistoryRow>, options: PracticeOptions = {}) => {
    const em = mockEntityManager({ query: [[SELECT_SUBMISSION_HISTORY, rows]] })
    const moduleRef = await Test.createTestingModule({
        providers: [
            PracticeHistoryService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: PRACTICE_OPTIONS, useValue: options },
        ],
    }).compile()
    return { service: moduleRef.get(PracticeHistoryService), em }
}

const ask = { learnerId: PRACTICE_LEARNER, patternId: "arrays", locale: "en" as const, limit: null, cursor: null }

describe("PracticeHistoryService submissions", () => {
    it("scopes the read to the learner and the pattern and asks one row more than the default page", async () => {
        const { service, em } = await build([row(1)])

        await service.submissions(ask)

        expect(em.query).toHaveBeenCalledWith(SELECT_SUBMISSION_HISTORY, [
            PRACTICE_LEARNER,
            "arrays",
            "en",
            null,
            null,
            21,
        ])
    })

    it("answers the items with their verdict and a null cursor on the last page", async () => {
        const { service } = await build([row(1), row(2, "wrong-answer")])

        const page = await service.submissions(ask)

        expect(page.next).toBeNull()
        expect(page.items.map((item) => [item.slug, item.problemTitle, item.verdict, item.passedCount])).toEqual([
            ["problem-1", "Problem 1", "accepted", 3],
            ["problem-2", "Problem 2", "wrong-answer", 3],
        ])
        expect(page.items[0]?.submittedAt).toEqual(new Date("2026-11-09T10:00:09.000Z"))
    })

    it("cuts the extra row and hands the cursor of the last kept one", async () => {
        const { service } = await build([row(1), row(2), row(3)])

        const page = await service.submissions({ ...ask, limit: 2 })

        expect(page.items).toHaveLength(2)
        expect(page.next).toBe(
            encodedSubmissionsCursor({ submittedAt: "2026-11-09T10:00:08.000Z", id: row(2).submission_id }),
        )
    })

    it("passes the decoded cursor to the keyset predicate", async () => {
        const { service, em } = await build([])
        const cursor = encodedSubmissionsCursor({ submittedAt: "2026-11-09T10:00:08.000Z", id: row(2).submission_id })

        await service.submissions({ ...ask, cursor })

        expect(em.query).toHaveBeenCalledWith(SELECT_SUBMISSION_HISTORY, [
            PRACTICE_LEARNER,
            "arrays",
            "en",
            "2026-11-09T10:00:08.000Z",
            row(2).submission_id,
            21,
        ])
    })

    it("takes the page size from the settings when no limit is asked", async () => {
        const { service, em } = await build([], { submissionsPage: 5 })

        await service.submissions(ask)

        expect(em.query).toHaveBeenCalledWith(SELECT_SUBMISSION_HISTORY, [
            PRACTICE_LEARNER,
            "arrays",
            "en",
            null,
            null,
            6,
        ])
    })

    it("refuses a foreign cursor and an unknown pattern before reading", async () => {
        const { service, em } = await build([])

        await expect(service.submissions({ ...ask, cursor: "garbage" })).rejects.toThrow(
            new PracticeError({ code: PracticeErrorCode.CursorInvalid }),
        )
        await expect(service.submissions({ ...ask, patternId: "nope" })).rejects.toThrow(
            new PracticeError({ code: PracticeErrorCode.PatternNotFound }),
        )
        expect(em.query).not.toHaveBeenCalled()
    })
})
