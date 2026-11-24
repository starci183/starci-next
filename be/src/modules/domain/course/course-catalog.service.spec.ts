import { mockEntityManager } from "@starci/jest-preset"
import { CourseErrorCode } from "./errors/course.error"
import { CourseCatalogService } from "./course-catalog.service"
import { courseRecordFixture } from "./course-lab.testing"
import { SELECT_LAB_TERMS, SELECT_PUBLISHED_COURSE, SELECT_PUBLISHED_COURSES } from "./persistence/course.sql"

const KEY = "shop-giay"
const courseRow = { course_id: KEY, version: "abc123def456", content_hash: "a".repeat(64), record: courseRecordFixture() }
const labRow = { lesson_id: "saga-compensation", allowed_terms: [{ id: "saga", term: "saga bù trừ" }] }

const world = (query: ReadonlyArray<readonly [string, unknown]>) => {
    const em = mockEntityManager({ query })
    return { service: new CourseCatalogService(em), em }
}

describe("CourseCatalogService", () => {
    it("lists every live course with its lessons, asking for the labs of the lessons it names once", async () => {
        const { service, em } = world([
            [SELECT_PUBLISHED_COURSES, [courseRow]],
            [SELECT_LAB_TERMS, [labRow]],
        ])

        const courses = await service.courses()

        expect(courses).toHaveLength(1)
        expect(courses[0]?.lessons.map((each) => [each.lessonId, each.conceptTerm, each.available])).toEqual([
            ["saga-compensation", "saga bù trừ", true],
            ["idempotency-key", "idempotency-key", false],
        ])
        expect(em.query).toHaveBeenCalledWith(SELECT_LAB_TERMS, [["saga-compensation", "idempotency-key"]])
    })

    it("answers an empty catalog without asking for labs, and leaves out a stored record that no longer reads", async () => {
        const none = world([[SELECT_PUBLISHED_COURSES, []]])
        await expect(none.service.courses()).resolves.toEqual([])
        expect(none.em.query).toHaveBeenCalledTimes(1)

        const broken = world([[SELECT_PUBLISHED_COURSES, [{ ...courseRow, record: { id: KEY } }]]])
        await expect(broken.service.courses()).resolves.toEqual([])
    })

    it("reads one course with the system map of its intro", async () => {
        const { service } = world([
            [SELECT_PUBLISHED_COURSE, [courseRow]],
            [SELECT_LAB_TERMS, [labRow]],
        ])

        const course = await service.course(KEY)

        expect(course.courseId).toBe(KEY)
        expect(course.lessons[0]).toMatchObject({ available: true })
        expect(course.system.nodes).toHaveLength(3)
        expect(course.system.edges).toHaveLength(2)
    })

    it("refuses an unknown course, an id that is no slug and a stored record that no longer reads as COURSE_NOT_FOUND", async () => {
        const unknown = world([[SELECT_PUBLISHED_COURSE, []]])
        await expect(unknown.service.course("nope")).rejects.toMatchObject({ code: CourseErrorCode.NotFound })

        const bad = world([])
        await expect(bad.service.course("Not A Slug")).rejects.toMatchObject({ code: CourseErrorCode.NotFound })
        expect(bad.em.query).not.toHaveBeenCalled()

        const broken = world([[SELECT_PUBLISHED_COURSE, [{ ...courseRow, record: { id: KEY } }]]])
        await expect(broken.service.course(KEY)).rejects.toMatchObject({ code: CourseErrorCode.NotFound })
    })
})
