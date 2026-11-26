import { mock, mockEntityManager } from "@starci/jest-preset"
import type { MockOf } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import type { CaseResetEvent } from "@modules/platform/relay-protocol"
import { CourseError, CourseErrorCode } from "./errors/course.error"
import { CourseCaseService } from "./course-case.service"
import { CourseLabService } from "./course-lab.service"
import { CourseRungService } from "./course-rung.service"
import { labRecordWithRungsFixture } from "./course-lab.testing"
import { courseLabCheckOf } from "./course-lab-record.policy"
import { SELECT_CASE_MARKS } from "./persistence/course.sql"

const LEARNER = "b8099f0e-58c7-4685-8292-f3a49ec994b1"
const LESSON = "saga-compensation"
const NOW = "2026-11-25T02:00:00.000Z"

const checked = courseLabCheckOf(LESSON, labRecordWithRungsFixture())
if (!checked.ok) throw new Error(checked.refusal)
const LAB = { version: "abc123def456", record: checked.record }

interface World {
    readonly service: CourseRungService
    readonly labs: MockOf<CourseLabService>
    readonly cases: MockOf<CourseCaseService>
}

/** The service over a lab with rungs, the learner's marks as the database holds them (case id, ever green). */
const world = async (green: ReadonlyArray<string> = []): Promise<World> => {
    const rows = green.map((caseId) => ({ case_id: caseId, hints_opened: 0, ever_green: true }))
    const em = mockEntityManager({ query: [[SELECT_CASE_MARKS, rows] as const] })
    const labs = mock<CourseLabService>()
    labs.readable.mockResolvedValue(LAB)
    const cases = mock<CourseCaseService>()
    cases.recordReset.mockResolvedValue({ recorded: true })
    const moduleRef = await Test.createTestingModule({
        providers: [
            CourseRungService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CourseLabService, useValue: labs },
            { provide: CourseCaseService, useValue: cases },
        ],
    }).compile()
    return { service: moduleRef.get(CourseRungService), labs, cases }
}

const code = (value: CourseErrorCode) => expect.objectContaining({ code: value })

const reset = (caseId: string): CaseResetEvent => ({
    type: "case.reset",
    lessonId: LESSON,
    caseId,
    stashedBranch: `cua-toi-luu-${caseId}`,
    at: NOW,
})

describe("CourseRungService diffRung", () => {
    it("serves the case's two rungs once the server recorded the case green", async () => {
        const { service, labs } = await world(["h1", "h2", "u1"])

        await expect(service.diffRung(LEARNER, LESSON, "u1", "c0-naive")).resolves.toMatchObject({
            kind: "rung:c0-naive",
            content: "// c0\n",
            path: "services/orders/src/checkout.ts",
        })
        await expect(service.diffRung(LEARNER, LESSON, "u1", "c1-compensate")).resolves.toMatchObject({
            kind: "rung:c1-compensate",
            content: "// c1\n",
        })
        expect(labs.readable).toHaveBeenCalledWith(LEARNER, LESSON)
    })

    it("refuses COURSE_RUNG_LOCKED before the green mark, whatever the learner's machine says", async () => {
        const { service } = await world(["h1", "h2"])

        await expect(service.diffRung(LEARNER, LESSON, "u1", "c1-compensate")).rejects.toEqual(
            code(CourseErrorCode.RungLocked),
        )
    })

    it("never reaches a later rung through an earlier, solved case", async () => {
        const { service } = await world(["h1", "h2", "u1"])

        await expect(service.diffRung(LEARNER, LESSON, "u1", "c2-retry")).rejects.toEqual(
            code(CourseErrorCode.RungNotFound),
        )
    })

    it("answers not found for a happy case, a case without a reference step and an unknown case", async () => {
        const { service } = await world(["h1", "h2", "u1", "u2", "u3"])

        await expect(service.diffRung(LEARNER, LESSON, "h1", "c0-naive")).rejects.toEqual(
            code(CourseErrorCode.RungNotFound),
        )
        await expect(service.diffRung(LEARNER, LESSON, "u3", "c2-retry")).rejects.toEqual(
            code(CourseErrorCode.RungNotFound),
        )
        await expect(service.diffRung(LEARNER, LESSON, "nope", "c0-naive")).rejects.toEqual(
            code(CourseErrorCode.CaseNotFound),
        )
    })

    it("serves nothing to a learner who may not read the lab", async () => {
        const { service, labs } = await world(["u1"])
        labs.readable.mockRejectedValue(new CourseError({ code: CourseErrorCode.PremiumRequired }))

        await expect(service.diffRung(LEARNER, LESSON, "u1", "c1-compensate")).rejects.toEqual(
            code(CourseErrorCode.PremiumRequired),
        )
    })
})

describe("CourseRungService resetTo", () => {
    it("records the reset, then serves the case's own rung, even on a case never green", async () => {
        const { service, cases } = await world([])

        await expect(service.resetTo(LEARNER, reset("u2"))).resolves.toMatchObject({
            kind: "rung:c2-retry",
            content: "// c2\n",
        })
        expect(cases.recordReset).toHaveBeenCalledWith(LEARNER, reset("u2"))
    })

    it("records nothing and serves nothing for a case without a reference rung", async () => {
        const { service, cases } = await world([])

        await expect(service.resetTo(LEARNER, reset("h1"))).rejects.toEqual(code(CourseErrorCode.RungNotFound))
        await expect(service.resetTo(LEARNER, reset("nope"))).rejects.toEqual(code(CourseErrorCode.CaseNotFound))
        expect(cases.recordReset).not.toHaveBeenCalled()
    })
})
