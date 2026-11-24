import { mock, mockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { ENTITLEMENT_SERVICE, type EntitlementService } from "@modules/domain/entitlement"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { CourseErrorCode } from "./errors/course.error"
import { CourseLabService } from "./course-lab.service"
import { labRecordFixture } from "./course-lab.testing"
import { SELECT_CASE_MARKS, SELECT_PUBLISHED_LAB } from "./persistence/course.sql"

const LEARNER = "b8099f0e-58c7-4685-8292-f3a49ec994b1"
const LESSON = "saga-compensation"

const world = async (live: ReadonlyArray<unknown>, marks: ReadonlyArray<unknown> = []) => {
    const entitlement = mock<EntitlementService>()
    entitlement.mayReadEssentialPart.mockResolvedValue(true)
    const em = mockEntityManager({
        query: [
            [SELECT_PUBLISHED_LAB, live],
            [SELECT_CASE_MARKS, marks],
        ],
    })
    const moduleRef = await Test.createTestingModule({
        providers: [
            CourseLabService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: ENTITLEMENT_SERVICE, useValue: entitlement },
        ],
    }).compile()
    return { service: moduleRef.get(CourseLabService), entitlement, em }
}

const liveRow = [{ version: "abc123def456", content_hash: "a".repeat(64), record: labRecordFixture() }]

describe("CourseLabService", () => {
    it("reads the live lab and nothing for a lesson without one or an id that is not a slug", async () => {
        const held = await world(liveRow)
        await expect(held.service.live(LESSON)).resolves.toMatchObject({
            version: "abc123def456",
            record: { lessonId: LESSON },
        })
        await expect(held.service.live("Not A Slug")).resolves.toBeNull()

        const none = await world([])
        await expect(none.service.live(LESSON)).resolves.toBeNull()
    })

    it("treats a stored record that no longer reads as lab@2 as no lab", async () => {
        const { service } = await world([{ version: "abc123def456", content_hash: "a".repeat(64), record: { lessonId: LESSON } }])

        await expect(service.live(LESSON)).resolves.toBeNull()
    })

    it("needs the entitlement question's yes for the Essentials part of the lab before it reads anything", async () => {
        const { service, entitlement, em } = await world(liveRow)
        entitlement.mayReadEssentialPart.mockResolvedValue(false)

        await expect(service.readable(LEARNER, LESSON)).rejects.toMatchObject({ code: CourseErrorCode.PremiumRequired })

        expect(entitlement.mayReadEssentialPart).toHaveBeenCalledWith(LEARNER, "4-apply")
        expect(em.query).not.toHaveBeenCalled()
    })

    it("answers not found for a lesson without a lab and for an id that is not a slug", async () => {
        const { service } = await world([])

        await expect(service.readable(LEARNER, LESSON)).rejects.toMatchObject({ code: CourseErrorCode.LessonNotFound })
        await expect(service.readable(LEARNER, "../etc")).rejects.toMatchObject({ code: CourseErrorCode.LessonNotFound })
    })

    it("projects the lab with the hint texts of the levels the learner opened", async () => {
        const { service } = await world(liveRow, [{ case_id: "u1", hints_opened: 1, ever_green: false }])

        const view = await service.lessonView(LEARNER, LESSON, "vi")

        expect(view.version).toBe("abc123def456")
        expect(view.unhappy[0]?.hints).toEqual([
            { level: 1, text: "gợi ý 1", unlocked: true },
            { level: 2, text: null, unlocked: false },
            { level: 3, text: null, unlocked: false },
        ])
    })
})
