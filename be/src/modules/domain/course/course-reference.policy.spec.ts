import { LESSON_REFERENCES, type LessonReference } from "@modules/platform/relay-protocol"
import { PRODUCTION_SHOWS } from "./course-lab-record.policy"
import {
    COURSE_REFERENCE_COMPARISONS,
    comparisonMatches,
    recordReferenceViewOf,
    referenceViewOf,
    type CourseRecordReference,
    type CourseReferenceComparison,
} from "./course-reference.policy"

/** The unhappy case ids of the Saga lab, in order. */
const SAGA_CASES = [
    "out-of-stock",
    "flaky-undo",
    "refund-twice",
    "crash-mid-checkout",
    "timeout-ambiguous",
    "double-checkout",
    "pivot-email",
]

const SHA = "0123456789abcdef0123456789abcdef01234567"

const reference = (commit = SHA): LessonReference => ({
    name: "demo",
    lessons: ["demo-lesson"],
    repo: "starci-next/essential-demo",
    commit,
    checked: "2026-11-26",
    languages: [{ id: "typescript", folder: "typescript", label: "TypeScript (NestJS)" }],
})

const comparison: CourseReferenceComparison = {
    shows: { a: "partial", b: "yes" },
    note: { vi: "Khác bạn ở chỗ người bấm.", en: "A person presses it." },
}

describe("referenceViewOf", () => {
    it("links the default language folder at the pinned commit, with the relay command and one verdict per unhappy case in order", () => {
        expect(referenceViewOf("demo-lesson", ["b", "a"], true, [reference()], { "demo-lesson": comparison })).toEqual({
            repo: "starci-next/essential-demo",
            commit: SHA,
            lang: "TypeScript (NestJS)",
            url: `https://github.com/starci-next/essential-demo/tree/${SHA}/typescript`,
            checked: "2026-11-26",
            command: "starci-relay ref demo --lang typescript",
            shows: [
                { caseId: "b", value: "yes" },
                { caseId: "a", value: "partial" },
            ],
            note: comparison.note,
            variants: [{ lang: "typescript", label: "TypeScript (NestJS)", status: "ready", folder: "typescript" }],
            stack: [],
            libs: [],
        })
    })

    it("holds the reference back before the named pages", () => {
        expect(referenceViewOf("demo-lesson", ["a", "b"], false, [reference()], { "demo-lesson": comparison })).toBeNull()
    })

    it("holds back a reference whose commit is not a full sha", () => {
        expect(referenceViewOf("demo-lesson", ["a", "b"], true, [reference("main")], { "demo-lesson": comparison })).toBeNull()
        expect(referenceViewOf("demo-lesson", ["a", "b"], true, [reference(SHA.slice(0, 12))], { "demo-lesson": comparison })).toBeNull()
    })

    it("holds back a comparison that no longer matches the lab's unhappy cases, and a lesson without either half", () => {
        expect(referenceViewOf("demo-lesson", ["a", "b", "c"], true, [reference()], { "demo-lesson": comparison })).toBeNull()
        expect(referenceViewOf("demo-lesson", ["a", "b"], true, [reference()], {})).toBeNull()
        expect(referenceViewOf("other", ["a", "b"], true, [reference()], { other: comparison })).toBeNull()
    })
})

describe("comparisonMatches", () => {
    it("is true only for exactly the unhappy case ids", () => {
        expect(comparisonMatches(comparison, ["a", "b"])).toBe(true)
        expect(comparisonMatches(comparison, ["a"])).toBe(false)
        expect(comparisonMatches(comparison, ["a", "c"])).toBe(false)
    })
})

describe("the Saga reference data", () => {
    const saga = COURSE_REFERENCE_COMPARISONS["saga-compensation"]

    it("judges every unhappy case of the Saga lab with a known verdict, the charge-then-out-of-stock case as partial", () => {
        expect(saga).toBeDefined()
        expect(Object.keys(saga?.shows ?? {}).sort()).toEqual([...SAGA_CASES].sort())
        expect(Object.values(saga?.shows ?? {}).every((value) => (PRODUCTION_SHOWS as ReadonlyArray<string>).includes(value))).toBe(true)
        // The standard stops on-hold and refunds only when a person presses: that case is partial, never yes.
        expect(saga?.shows["out-of-stock"]).toBe("partial")
    })

    it("is shown on the named pages of the Saga lesson, pinned to essential-saga", () => {
        const view = referenceViewOf("saga-compensation", SAGA_CASES, true)
        expect(view?.repo).toBe("starci-next/essential-saga")
        expect(view?.url).toMatch(/^https:\/\/github\.com\/starci-next\/essential-saga\/tree\/[0-9a-f]{40}\/typescript$/u)
        expect(view?.command).toBe("starci-relay ref saga --lang typescript")
        expect(LESSON_REFERENCES.find((each) => each.name === "saga")?.commit).toBe(view?.commit)
    })

    // lessons.md §8-§9 (owner 2026-11-28): Vietnamese sentences with the engineering terms in English; never "khách", "đơn" or "shop".
    it("writes its note in the IT register", () => {
        expect(saga?.note.vi).not.toMatch(/khách|đơn|shop/iu)
        expect(saga?.note.vi).toMatch(/order/u)
    })
})

/** The unhappy case ids of the Transaction (ACID) and Idempotency key labs, in order (their lesson manifests in the seed standard). */
const OTHER_LESSONS: ReadonlyArray<{ lessonId: string; name: string; cases: ReadonlyArray<string> }> = [
    {
        lessonId: "checkout-transaction",
        name: "transaction-acid",
        cases: ["het-hang-giua-chung", "don-loi-keo-don-sau", "het-hang-noi-ro", "ma-giam-gia-da-dung"],
    },
    {
        lessonId: "payment-idempotency",
        name: "idempotency-key",
        cases: ["mat-cau-tra-loi", "bam-hai-lan", "cung-khoa-khac-tien", "the-bi-tu-choi", "sap-giua-chung", "khoa-qua-han"],
    },
]

describe.each(OTHER_LESSONS)("the $name reference data", ({ lessonId, name, cases }) => {
    const comparison = COURSE_REFERENCE_COMPARISONS[lessonId]

    it("judges exactly the lab's unhappy cases with known verdicts", () => {
        expect(comparison).toBeDefined()
        expect(comparisonMatches(comparison as CourseReferenceComparison, cases)).toBe(true)
        expect(Object.values(comparison?.shows ?? {}).every((value) => (PRODUCTION_SHOWS as ReadonlyArray<string>).includes(value))).toBe(true)
    })

    it(`is shown on the named pages of its lesson, pinned to essential-${name}, and only for its own lesson`, () => {
        const view = referenceViewOf(lessonId, cases, true)
        expect(view?.repo).toBe(`starci-next/essential-${name}`)
        expect(view?.url).toMatch(new RegExp(`^https://github\.com/starci-next/essential-${name}/tree/[0-9a-f]{40}/typescript$`, "u"))
        expect(view?.command).toBe(`starci-relay ref ${name} --lang typescript`)
        expect(view?.shows.map((each) => each.caseId)).toEqual(cases)
        expect(LESSON_REFERENCES.find((each) => each.name === name)?.commit).toBe(view?.commit)
        expect(referenceViewOf(lessonId, SAGA_CASES, true)).toBeNull()
    })

    it("writes its note in the IT register", () => {
        expect(comparison?.note.vi).not.toMatch(/khách|đơn|shop/iu)
        expect(comparison?.note.en).not.toMatch(/shop|customer/iu)
    })
})

/** A reference as a lab record declares it (owner 2026-11-28: `reference` in starci-lab.yaml). */
const recordReference = (): CourseRecordReference => ({
    repo: "starci-next/essential-demo",
    commit: SHA,
    lang: "typescript",
    url: `https://github.com/starci-next/essential-demo/tree/${SHA}/typescript`,
    checked: "2026-11-28",
    command: "starci-relay ref demo-lesson --lang typescript",
    note: { vi: "Cùng bài, viết theo chuẩn StarCi.", en: "The same lesson, written to the StarCi standard." },
    variants: [
        { lang: "typescript", label: "TypeScript · NestJS", status: "ready", folder: "typescript" },
        { lang: "go", label: "Go", status: "soon", folder: "go" },
    ],
    stack: ["typescript", "nestjs", "postgresql"],
    libs: ["@nestjs/core", "pg"],
})

describe("recordReferenceViewOf", () => {
    it("draws the record's reference with its variants, stack and libs, and the comparison's verdicts when it matches", () => {
        expect(recordReferenceViewOf(recordReference(), "demo-lesson", ["b", "a"], true, { "demo-lesson": comparison })).toEqual({
            repo: "starci-next/essential-demo",
            commit: SHA,
            lang: "TypeScript · NestJS",
            url: `https://github.com/starci-next/essential-demo/tree/${SHA}/typescript`,
            checked: "2026-11-28",
            command: "starci-relay ref demo-lesson --lang typescript",
            shows: [
                { caseId: "b", value: "yes" },
                { caseId: "a", value: "partial" },
            ],
            note: { vi: "Cùng bài, viết theo chuẩn StarCi.", en: "The same lesson, written to the StarCi standard." },
            variants: [
                { lang: "typescript", label: "TypeScript · NestJS", status: "ready", folder: "typescript" },
                { lang: "go", label: "Go", status: "soon", folder: "go" },
            ],
            stack: ["typescript", "nestjs", "postgresql"],
            libs: ["@nestjs/core", "pg"],
        })
    })

    it("reads every verdict unknown when no comparison matches the lab, and holds back before the named pages", () => {
        const view = recordReferenceViewOf(recordReference(), "demo-lesson", ["a", "c"], true, { "demo-lesson": comparison })
        expect(view?.shows).toEqual([
            { caseId: "a", value: "unknown" },
            { caseId: "c", value: "unknown" },
        ])
        expect(recordReferenceViewOf(recordReference(), "demo-lesson", ["a", "b"], false, { "demo-lesson": comparison })).toBeNull()
    })
})
