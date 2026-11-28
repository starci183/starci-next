import { catalogDetailOf, catalogEntryOf, catalogOrderCompare, labTermsOf } from "./course-catalog.policy"
import { courseRecordFixture } from "./course-lab.testing"
import { courseRecordCheckOf } from "./course-record.policy"

const recordOf = () => {
    const checked = courseRecordCheckOf("shop-giay", courseRecordFixture())
    if (!checked.ok) throw new Error(checked.refusal)
    return checked.record
}

const SAGA_TERMS = labTermsOf([
    { id: "saga", term: "saga bù trừ" },
    { id: "retry", term: "retry" },
])

describe("catalogEntryOf", () => {
    it("words a lesson by its lab's own term and marks it available when a lab is live", () => {
        const entry = catalogEntryOf(recordOf(), new Map([["saga-compensation", SAGA_TERMS]]))

        expect(entry.courseId).toBe("shop-giay")
        expect(entry.title).toEqual({ vi: "Shop giày của bạn", en: "Your shoe shop" })
        expect(entry.summary.en).toBe("One shoe shop that grows.")
        expect(entry.lessons[0]).toEqual({
            lessonId: "saga-compensation",
            concept: "saga",
            conceptTerm: "saga bù trừ",
            title: { vi: "saga bù trừ", en: "saga bù trừ" },
            available: true,
        })
    })

    it("falls back to the concept id and marks a lesson without a live lab unavailable", () => {
        const entry = catalogEntryOf(recordOf(), new Map())

        expect(entry.lessons.map((each) => each.available)).toEqual([false, false])
        expect(entry.lessons[1]).toMatchObject({
            lessonId: "idempotency-key",
            conceptTerm: "idempotency-key",
            title: { vi: "idempotency-key", en: "idempotency-key" },
        })
    })

    it("falls back to the concept id when the lab names no term for the concept, yet the lesson stays available", () => {
        const entry = catalogEntryOf(recordOf(), new Map([["saga-compensation", labTermsOf([{ id: "retry", term: "retry" }])]]))

        expect(entry.lessons[0]).toMatchObject({ conceptTerm: "saga", available: true })
    })

    it("keeps the lessons in the order of the record and carries no system", () => {
        const entry = catalogEntryOf(recordOf(), new Map())

        expect(entry.lessons.map((each) => each.lessonId)).toEqual(["saga-compensation", "idempotency-key"])
        expect(entry).not.toHaveProperty("system")
    })
})

describe("catalogEntryOf, one-lesson course", () => {
    it("titles the lone lesson as its course and carries the order and the description", () => {
        const record = recordOf()
        const lone = {
            ...record,
            title: { vi: "Kiểm và ghi trong một câu", en: "Atomic conditional update" },
            description: { vi: "Gộp kiểm và ghi vào một câu.", en: "Fold the check and the write into one statement." },
            order: 10,
            lessons: [record.lessons[0]!],
        }
        const entry = catalogEntryOf(lone, new Map([["saga-compensation", SAGA_TERMS]]))

        expect(entry.lessons[0]?.title).toEqual({ vi: "Kiểm và ghi trong một câu", en: "Atomic conditional update" })
        expect(entry.lessons[0]?.conceptTerm).toBe("saga bù trừ")
        expect(entry.order).toBe(10)
        expect(entry.description.en).toBe("Fold the check and the write into one statement.")
    })

    it("falls back to the summary for the description and to null for the order", () => {
        const entry = catalogEntryOf(recordOf(), new Map())

        expect(entry.description).toEqual(entry.summary)
        expect(entry.order).toBeNull()
    })
})

describe("catalogOrderCompare", () => {
    it("sorts by order, a course without one last, ties by id", () => {
        const of = (courseId: string, order: number | null) => ({ ...catalogEntryOf(recordOf(), new Map()), courseId, order })
        const sorted = [of("b", null), of("z", 2), of("a", null), of("c", 1)].sort(catalogOrderCompare)

        expect(sorted.map((each) => each.courseId)).toEqual(["c", "z", "a", "b"])
    })
})

describe("catalogDetailOf", () => {
    it("draws a node that stands for no service with service null", () => {
        const record = recordOf()
        const { service: _service, ...database } = record.system.nodes[0]!
        const detail = catalogDetailOf({ ...record, system: { ...record.system, nodes: [database] } }, new Map())

        expect(detail.system.nodes[0]?.service).toBeNull()
    })

    it("adds the system map of the intro to the entry", () => {
        const detail = catalogDetailOf(recordOf(), new Map())

        expect(detail.lessons).toHaveLength(2)
        expect(detail.system.nodes.map((each) => each.id)).toEqual(["orders", "payments", "stock"])
        expect(detail.system.nodes[0]).toEqual({
            id: "orders",
            service: "orders",
            label: { vi: "Đơn hàng", en: "Orders" },
            role: { vi: "nhận checkout", en: "takes the checkout" },
        })
        expect(detail.system.edges).toEqual([
            { from: "orders", to: "payments" },
            { from: "orders", to: "stock" },
        ])
    })
})

describe("labTermsOf", () => {
    it("reads the allowed terms of a lab record and none from anything else", () => {
        expect(SAGA_TERMS).toEqual([
            { id: "saga", term: "saga bù trừ" },
            { id: "retry", term: "retry" },
        ])
        expect(labTermsOf(null)).toEqual([])
        expect(labTermsOf([{ id: "saga" }])).toEqual([])
    })
})
