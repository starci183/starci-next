import { labRecordFixture } from "./course-lab.testing"
import {
    COURSE_LAB_LABEL_LENGTH,
    courseIdValid,
    courseLabCheckOf,
    courseLabHashOf,
    courseLabVersionOf,
} from "./course-lab-record.policy"

const recordOf = (value: unknown = labRecordFixture()) => {
    const checked = courseLabCheckOf("saga-compensation", value)
    if (!checked.ok) throw new Error(checked.refusal)
    return checked.record
}

describe("courseLabCheckOf", () => {
    it("accepts a lab@2 record and keeps the fields the standard adds", () => {
        const record = recordOf({ ...labRecordFixture(), extra: { kept: true } })

        expect(record.lessonId).toBe("saga-compensation")
        expect(record.happy.map((each) => each.id)).toEqual(["h1", "h2"])
        expect(record.unhappy.map((each) => each.id)).toEqual(["u1", "u2", "u3"])
        expect(record.stack.services[0]?.uses).toEqual([])
        expect(record).toMatchObject({ extra: { kept: true } })
    })

    it("accepts a lab with no framework version", () => {
        const { framework: _framework, ...withoutFramework } = labRecordFixture()

        expect(recordOf(withoutFramework).framework).toBeUndefined()
    })

    it("accepts the StarCi standard reference with its variants, stack and libs, and refuses one pinned to a branch", () => {
        const reference = {
            repo: "starci-next/essential-saga",
            commit: "0123456789abcdef0123456789abcdef01234567",
            lang: "typescript",
            url: "https://github.com/starci-next/essential-saga/tree/0123456789abcdef0123456789abcdef01234567/typescript",
            checked: "2026-11-28",
            command: "starci-relay ref saga-compensation --lang typescript",
            note: { vi: "Cùng bài Saga, viết theo chuẩn StarCi.", en: "The same Saga lesson, to the StarCi standard." },
            variants: [
                { lang: "typescript", label: "TypeScript · NestJS", status: "ready", folder: "typescript" },
                { lang: "go", label: "Go", status: "soon", folder: "go" },
            ],
            stack: ["typescript", "nestjs", "postgresql"],
            libs: ["@nestjs/core", "pg"],
        }

        expect(recordOf({ ...labRecordFixture(), reference }).reference?.variants.map((each) => each.status)).toEqual(["ready", "soon"])
        expect(courseLabCheckOf("saga-compensation", { ...labRecordFixture(), reference: { ...reference, commit: "main" } })).toEqual({
            ok: false,
            refusal: "COURSE_LAB_RECORD_INVALID",
        })
    })

    it("refuses a key that is not the lesson id, never renaming it", () => {
        expect(courseLabCheckOf("other-lesson", labRecordFixture())).toEqual({
            ok: false,
            refusal: "COURSE_LAB_KEY_MISMATCH",
        })
    })

    it("refuses a record of another schema, with no happy case, or with a bad shape", () => {
        const refused = (value: unknown) =>
            expect(courseLabCheckOf("saga-compensation", value)).toEqual({
                ok: false,
                refusal: "COURSE_LAB_RECORD_INVALID",
            })
        refused({ ...labRecordFixture(), schema: "starci-next-seed-standard/essentials-lab@1" })
        refused({ ...labRecordFixture(), happy: [] })
        refused({ ...labRecordFixture(), learnerFile: "" })
        refused({ ...labRecordFixture(), lessonId: "Saga Compensation" })
        refused("not a record")
        refused(null)
    })

    it("refuses a case with more than three hints", () => {
        const value = labRecordFixture()
        const unhappy = value["unhappy"] as Array<Record<string, unknown>>
        unhappy[0] = { ...unhappy[0], hints: [{ vi: "1" }, { vi: "2" }, { vi: "3" }, { vi: "4" }] }

        expect(courseLabCheckOf("saga-compensation", value)).toMatchObject({ ok: false })
    })

    it("refuses duplicate case ids across the two lists and an invariant the record does not declare", () => {
        const dup = labRecordFixture()
        const happy = dup["happy"] as Array<Record<string, unknown>>
        happy[1] = { ...happy[1], id: "u1" }
        expect(courseLabCheckOf("saga-compensation", dup)).toMatchObject({ ok: false })

        const unknown = labRecordFixture()
        const unhappy = unknown["unhappy"] as Array<Record<string, unknown>>
        unhappy[2] = { ...unhappy[2], invariants: ["never-declared"] }
        expect(courseLabCheckOf("saga-compensation", unknown)).toMatchObject({ ok: false })
    })
})

describe("courseLabHashOf", () => {
    it("is the same for the same content in any key order and changes with the content", () => {
        const record = recordOf()
        const reordered = recordOf(
            Object.fromEntries(Object.entries(labRecordFixture()).reverse()) as Record<string, unknown>,
        )
        const changed = recordOf({ ...labRecordFixture(), learnerFile: "services/orders/src/other.ts" })

        expect(courseLabHashOf(record)).toMatch(/^[0-9a-f]{64}$/u)
        expect(courseLabHashOf(reordered)).toBe(courseLabHashOf(record))
        expect(courseLabHashOf(changed)).not.toBe(courseLabHashOf(record))
    })

    it("labels a version with the head of the hash", () => {
        const hash = courseLabHashOf(recordOf())

        expect(courseLabVersionOf(hash)).toBe(hash.slice(0, COURSE_LAB_LABEL_LENGTH))
    })
})

describe("courseIdValid", () => {
    it("accepts a lowercase slug only", () => {
        expect(courseIdValid("saga-compensation")).toBe(true)
        expect(courseIdValid("Saga")).toBe(false)
        expect(courseIdValid("-saga")).toBe(false)
        expect(courseIdValid("a".repeat(101))).toBe(false)
    })
})

describe("the chaos labels of a lab record", () => {
    const labels = [
        { id: "STOCK_OUT", label: { vi: "Kho hết hàng", en: "Out of stock" } },
        { id: "NET_SLOW", label: { vi: "Mạng chậm", en: "Slow network" } },
    ]

    it("are optional: a record cut before the lab declared them is still a record", () => {
        expect(recordOf().chaos).toBeUndefined()
    })

    it("are accepted and kept when the lab declares them", () => {
        expect(recordOf({ ...labRecordFixture(), chaos: labels }).chaos).toEqual(labels)
    })

    it("refuse a label with no English words, a missing id or a switch declared twice", () => {
        const refused = (chaos: unknown) =>
            expect(courseLabCheckOf("saga-compensation", { ...labRecordFixture(), chaos })).toEqual({
                ok: false,
                refusal: "COURSE_LAB_RECORD_INVALID",
            })

        refused([{ id: "STOCK_OUT", label: { vi: "Kho hết hàng" } }])
        refused([{ label: { vi: "a", en: "a" } }])
        refused([...labels, labels[0]])
    })
})
