import { courseRecordFixture } from "./course-lab.testing"
import { courseRecordCheckOf, courseRecordHashOf, courseRecordVersionOf } from "./course-record.policy"

const KEY = "shop-giay"

const recordOf = (value: unknown = courseRecordFixture()) => {
    const checked = courseRecordCheckOf(KEY, value)
    if (!checked.ok) throw new Error(checked.refusal)
    return checked.record
}

describe("courseRecordCheckOf", () => {
    it("accepts a course record and keeps the fields the standard adds", () => {
        const record = recordOf({ ...courseRecordFixture(), extra: { kept: true } })

        expect(record.id).toBe(KEY)
        expect(record.lessons.map((each) => each.id)).toEqual(["saga-compensation", "idempotency-key"])
        expect(record.system.nodes).toHaveLength(3)
        expect(record).toMatchObject({ extra: { kept: true } })
    })

    it("refuses a key that is not the course id, never renaming it", () => {
        expect(courseRecordCheckOf("other-course", courseRecordFixture())).toEqual({
            ok: false,
            refusal: "COURSE_KEY_MISMATCH",
        })
    })

    it("refuses a record that is not shaped like a course", () => {
        const { lessons: _lessons, ...withoutLessons } = courseRecordFixture()

        for (const value of [
            null,
            { id: KEY },
            withoutLessons,
            { ...courseRecordFixture(), title: { vi: "chỉ tiếng Việt" } },
            { ...courseRecordFixture(), schema: "starci-next-seed-standard/essentials-course@9" },
            { ...courseRecordFixture(), id: "Not A Slug" },
        ])
            expect(courseRecordCheckOf(KEY, value)).toEqual({ ok: false, refusal: "COURSE_RECORD_INVALID" })
    })

    it("refuses an edge or a lesson that names a node the system does not have, and repeated ids", () => {
        const base = courseRecordFixture()
        const system = base.system as { nodes: Array<Record<string, unknown>>; edges: Array<Record<string, unknown>> }
        const lessons = base.lessons as Array<Record<string, unknown>>

        for (const value of [
            { ...base, system: { ...system, edges: [{ from: "orders", to: "ghost" }] } },
            { ...base, lessons: [{ ...lessons[0], node: "ghost" }] },
            { ...base, lessons: [lessons[0], { ...lessons[1], id: "saga-compensation" }] },
            { ...base, system: { ...system, nodes: [system.nodes[0], system.nodes[0]] } },
        ])
            expect(courseRecordCheckOf(KEY, value)).toEqual({ ok: false, refusal: "COURSE_RECORD_INVALID" })
    })
})

describe("courseRecordHashOf", () => {
    it("is the same for the same content in any key order and differs when the content does", () => {
        const reordered = recordOf(Object.fromEntries(Object.entries(courseRecordFixture()).reverse()))

        expect(courseRecordHashOf(reordered)).toBe(courseRecordHashOf(recordOf()))
        expect(courseRecordHashOf(recordOf({ ...courseRecordFixture(), status: "published" }))).not.toBe(
            courseRecordHashOf(recordOf()),
        )
    })

    it("labels a version with the head of the hash", () => {
        const hash = courseRecordHashOf(recordOf())

        expect(hash).toMatch(/^[0-9a-f]{64}$/u)
        expect(courseRecordVersionOf(hash)).toBe(hash.slice(0, 12))
    })
})
