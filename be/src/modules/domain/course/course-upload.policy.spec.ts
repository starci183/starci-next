import { caseHintFactsOf, caseResetFactsOf, caseResultFactsOf } from "./course-upload.policy"

const result = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
    eventId: "0c9a2b1e-9a2c-4b6e-8f1a-2b3c4d5e6f70",
    lessonId: "saga-compensation",
    caseId: "u1",
    kind: "unhappy",
    status: "red",
    ranAt: "2026-11-25T02:00:00.000Z",
    durationMs: 900,
    learnerCommit: "b".repeat(40),
    chaos: { STOCK_OUT: 1 },
    upTo: [{ caseId: "h1", status: "green" }],
    failed: { invariant: "wallet-restored", message: "wallet is 3.8m", expected: "5000000", actual: "3800000" },
    ...over,
})

describe("caseResultFactsOf", () => {
    it("accepts a red run with its failure and a green run without one", () => {
        expect(caseResultFactsOf(result())).toMatchObject({ caseId: "u1", status: "red" })
        const { failed: _failed, ...rest } = result({ status: "green" })

        expect(caseResultFactsOf(rest)).toMatchObject({ status: "green" })
    })

    it("refuses a green run that carries a failure", () => {
        expect(caseResultFactsOf(result({ status: "green" }))).toBeNull()
    })

    it("refuses a bad event id, commit, status, kind, time or duration, and unknown fields", () => {
        for (const bad of [
            { eventId: "not-a-uuid" },
            { learnerCommit: "abc" },
            { status: "yellow" },
            { kind: "sad" },
            { ranAt: "yesterday" },
            { durationMs: -1 },
            { durationMs: 1.5 },
            { caseId: "U 1" },
            { extra: true },
            { upTo: [{ caseId: "h1", status: "maybe" }] },
        ]) {
            expect(caseResultFactsOf(result(bad))).toBeNull()
        }
        expect(caseResultFactsOf(null)).toBeNull()
    })

    it("bounds the text a machine may send", () => {
        const long = "x".repeat(2001)

        expect(caseResultFactsOf(result({ failed: { invariant: "i", message: long } }))).toBeNull()
        expect(caseResultFactsOf(result({ upTo: Array.from({ length: 51 }, () => ({ caseId: "h1", status: "green" })) }))).toBeNull()
    })
})

describe("caseHintFactsOf", () => {
    it("accepts levels 1 to 3 only", () => {
        const hint = (level: number) => ({ lessonId: "saga-compensation", caseId: "u1", level, at: "2026-11-25T02:00:00.000Z" })

        expect(caseHintFactsOf(hint(1))).toMatchObject({ level: 1 })
        expect(caseHintFactsOf(hint(3))).toMatchObject({ level: 3 })
        expect(caseHintFactsOf(hint(0))).toBeNull()
        expect(caseHintFactsOf(hint(4))).toBeNull()
        expect(caseHintFactsOf({ ...hint(1), at: "soon" })).toBeNull()
    })
})

describe("caseResetFactsOf", () => {
    it("needs the stashed branch and a time", () => {
        const reset = { lessonId: "saga-compensation", caseId: "u1", stashedBranch: "cua-toi-luu-u1", at: "2026-11-25T02:00:00.000Z" }

        expect(caseResetFactsOf(reset)).toMatchObject({ stashedBranch: "cua-toi-luu-u1" })
        expect(caseResetFactsOf({ ...reset, stashedBranch: "" })).toBeNull()
        expect(caseResetFactsOf({ ...reset, at: "later" })).toBeNull()
    })
})
