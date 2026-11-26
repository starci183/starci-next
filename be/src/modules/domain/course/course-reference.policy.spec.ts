import { LESSON_REFERENCES, type LessonReference } from "@modules/platform/relay-protocol"
import { PRODUCTION_SHOWS } from "./course-lab-record.policy"
import {
    COURSE_REFERENCE_COMPARISONS,
    comparisonMatches,
    referenceViewOf,
    type CourseReferenceComparison,
} from "./course-reference.policy"

/** The unhappy case ids of the Saga lab, in order. */
const SAGA_CASES = [
    "out-of-stock",
    "flaky-undo",
    "refund-twice",
    "crash-mid-saga",
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

    it("writes its note in Vietnamese without an English term inside the sentence", () => {
        expect(saga?.note.vi).not.toMatch(/\b(saga|compensation|retry|rollback|outbox|queue)\b/iu)
    })
})
