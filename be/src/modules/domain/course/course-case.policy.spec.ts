import { labRecordFixture } from "./course-lab.testing"
import {
    caseOrderOf,
    caseStatusOf,
    casesViewOf,
    hintDecisionOf,
    hintTextOf,
    lessonViewOf,
    unlockedIdsOf,
    type CaseMark,
    type CaseRun,
} from "./course-case.policy"
import { courseLabCheckOf, type CourseLabRecord } from "./course-lab-record.policy"

const record = (): CourseLabRecord => {
    const checked = courseLabCheckOf("saga-compensation", labRecordFixture())
    if (!checked.ok) throw new Error(checked.refusal)
    return checked.record
}

const green = (...caseIds: Array<string>): Array<CaseMark> =>
    caseIds.map((caseId) => ({ caseId, hintsOpened: 0, everGreen: true }))

const run = (caseId: string, status: CaseRun["status"]): CaseRun => ({
    caseId,
    status,
    ranAt: "2026-11-25T02:00:00.000Z",
    durationMs: 1200,
    learnerCommit: "a".repeat(40),
    failed:
        status === "green"
            ? null
            : { invariant: "wallet-restored", message: "wallet is 3.8m", expected: "5000000", actual: "3800000" },
})

describe("caseOrderOf and unlockedIdsOf", () => {
    it("orders every happy case, then every unhappy case, as written", () => {
        expect(caseOrderOf(record()).map((each) => [each.caseId, each.kind])).toEqual([
            ["h1", "happy"],
            ["h2", "happy"],
            ["u1", "unhappy"],
            ["u2", "unhappy"],
            ["u3", "unhappy"],
        ])
    })

    it("unlocks the first case, and each case only when the one before it was ever green", () => {
        const order = caseOrderOf(record())

        expect([...unlockedIdsOf(order, [])]).toEqual(["h1"])
        expect([...unlockedIdsOf(order, green("h1"))]).toEqual(["h1", "h2"])
        expect([...unlockedIdsOf(order, green("h1", "h2"))]).toEqual(["h1", "h2", "u1"])
    })

    it("stops at the first case that was not green: nothing after it is open", () => {
        const order = caseOrderOf(record())

        expect([...unlockedIdsOf(order, green("h1"))]).toEqual(["h1", "h2"])
        expect(unlockedIdsOf(order, green("h1")).has("u1")).toBe(false)
    })
})

describe("caseStatusOf", () => {
    it("is locked while locked, open before a first run, then the newest run's outcome", () => {
        expect(caseStatusOf(false, run("h1", "green"))).toBe("locked")
        expect(caseStatusOf(true, undefined)).toBe("open")
        expect(caseStatusOf(true, run("h1", "red"))).toBe("red")
        expect(caseStatusOf(true, run("h1", "error"))).toBe("error")
        expect(caseStatusOf(true, run("h1", "green"))).toBe("green")
    })
})

describe("casesViewOf", () => {
    const order = caseOrderOf(record())

    it("starts on the first happy case with everything after it locked", () => {
        const view = casesViewOf(order, [], [])

        expect(view.currentCaseId).toBe("h1")
        expect(view.cases.map((each) => each.status)).toEqual(["open", "locked", "locked", "locked", "locked"])
        expect(view.cases.every((each) => !each.everGreen && !each.diffAvailable && each.lastRun === null)).toBe(true)
    })

    it("offers the diff only once a case was green, even when its newest run is red again", () => {
        const view = casesViewOf(order, green("h1"), [run("h1", "red"), run("h2", "red")])

        expect(view.cases[0]).toMatchObject({ caseId: "h1", status: "red", everGreen: true, diffAvailable: true })
        expect(view.cases[1]).toMatchObject({ caseId: "h2", status: "red", everGreen: false, diffAvailable: false })
        expect(view.cases[1]?.lastRun?.failed).toEqual({
            invariant: "wallet-restored",
            message: "wallet is 3.8m",
            expected: "5000000",
            actual: "3800000",
        })
        expect(view.currentCaseId).toBe("h2")
    })

    it("offers the reset only on an unhappy case that has a reference", () => {
        const view = casesViewOf(order, green("h1", "h2", "u1", "u2"), [])
        const resets = view.cases.map((each) => [each.caseId, each.resetAvailable])

        expect(resets).toEqual([
            ["h1", false],
            ["h2", false],
            ["u1", true],
            ["u2", true],
            ["u3", false],
        ])
    })

    it("counts the hints opened and has no current case once every case was green", () => {
        const marks = [...green("h1", "h2", "u1", "u2", "u3")].map((mark) =>
            mark.caseId === "u1" ? { ...mark, hintsOpened: 2 } : mark,
        )
        const view = casesViewOf(order, marks, [run("u3", "green")])

        expect(view.currentCaseId).toBeNull()
        expect(view.cases.find((each) => each.caseId === "u1")?.hintsOpened).toBe(2)
        expect(view.cases.find((each) => each.caseId === "u3")).toMatchObject({ status: "green", lastRun: { failed: null } })
    })
})

describe("hintDecisionOf", () => {
    it("opens a level only when the level below is open", () => {
        expect(hintDecisionOf(0, 1, 3)).toBe("open")
        expect(hintDecisionOf(1, 2, 3)).toBe("open")
        expect(hintDecisionOf(0, 2, 3)).toBe("out-of-order")
        expect(hintDecisionOf(1, 3, 3)).toBe("out-of-order")
    })

    it("answers an open level again, and calls a level the case lacks missing", () => {
        expect(hintDecisionOf(2, 1, 3)).toBe("already-open")
        expect(hintDecisionOf(2, 2, 3)).toBe("already-open")
        expect(hintDecisionOf(0, 1, 0)).toBe("missing")
        expect(hintDecisionOf(1, 2, 1)).toBe("missing")
        expect(hintDecisionOf(0, 0, 3)).toBe("missing")
        expect(hintDecisionOf(0, 4, 5)).toBe("missing")
        expect(hintDecisionOf(0, 1.5, 3)).toBe("missing")
    })
})

describe("hintTextOf", () => {
    it("answers the asked locale and falls back to Vietnamese when English is missing", () => {
        expect(hintTextOf({ vi: "một", en: "one" }, "en")).toBe("one")
        expect(hintTextOf({ vi: "một", en: "one" }, "vi")).toBe("một")
        expect(hintTextOf({ vi: "ba" }, "en")).toBe("ba")
    })
})

describe("lessonViewOf", () => {
    const marks: Array<CaseMark> = [{ caseId: "u1", hintsOpened: 2, everGreen: false }]

    it("releases the text of the opened hint levels only", () => {
        const view = lessonViewOf(record(), "abc123", marks, "vi")
        const u1 = view.unhappy.find((each) => each.id === "u1")

        expect(u1?.hints).toEqual([
            { level: 1, text: "gợi ý 1", unlocked: true },
            { level: 2, text: "gợi ý 2", unlocked: true },
            { level: 3, text: null, unlocked: false },
        ])
        expect(view.unhappy.find((each) => each.id === "u2")?.hints).toEqual([{ level: 1, text: null, unlocked: false }])
        expect(JSON.stringify(view)).not.toContain("gợi ý 3")
        expect(JSON.stringify(view)).not.toContain("u2 gợi ý 1")
    })

    it("writes a hint in the asked locale", () => {
        const view = lessonViewOf(record(), "abc123", marks, "en")

        expect(view.unhappy[0]?.hints[0]?.text).toBe("hint 1")
    })

    it("shows the chaos as key and value, the invariants as id, vi and en, and a happy case without hints or a term", () => {
        const view = lessonViewOf(record(), "abc123", [], "vi")

        expect(view.unhappy[1]?.chaos).toEqual([
            { key: "STOCK_OUT", value: "1" },
            { key: "NET_FLAKY", value: "undo" },
        ])
        expect(view.happy[1]?.chaos).toEqual([{ key: "NET_SLOW", value: "true" }])
        expect(view.invariants).toEqual([
            { id: "wallet-restored", vi: "ví về 5 triệu", en: "wallet back to 5 million" },
            { id: "order-cancelled", vi: "đơn bị hủy", en: "order cancelled" },
        ])
        expect(view.happy[0]).toMatchObject({ teaches: null, hints: [], hasReference: false })
        expect(view.unhappy[0]).toMatchObject({ teaches: "compensating transaction", hasReference: true })
    })

    it("carries the stack and the framework map, with English missing where the record has none", () => {
        const view = lessonViewOf(record(), "abc123", [], "vi")

        expect(view).toMatchObject({ lessonId: "saga-compensation", version: "abc123", lab: "shop-giay", concept: "saga" })
        expect(view.stack.services[0]).toEqual({
            id: "orders",
            port: 4001,
            db: "orders",
            uses: [],
            role: { vi: "nhận checkout", en: null },
        })
        expect(view.stack.services[1]?.role).toEqual({ vi: "trừ tiền", en: "charges" })
        expect(view.nestjs).toEqual([{ from: "services/orders/src/saga.ts#STEPS", to: "apps/orders/src/saga/steps.ts" }])
    })

    it("shows the grader's matrix dimensions and nothing else of the grader", () => {
        const view = lessonViewOf(record(), "abc123", [], "vi")

        expect(view.grader).toEqual({
            steps: ["order", "payment", "stock"],
            faults: ["fail-before", "lost-response", "crash", "dup"],
        })
        expect(JSON.stringify(view)).not.toContain("matrix.spec")
        expect(JSON.stringify(view)).not.toContain("npm run grade")
    })
})
