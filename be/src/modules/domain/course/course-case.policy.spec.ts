import { labRecordFixture, labRecordWithRungsFixture } from "./course-lab.testing"
import {
    caseOrderOf,
    caseRunEventIdOf,
    caseRunsOfUpload,
    caseStatusOf,
    casesViewOf,
    hintDecisionOf,
    hintTextOf,
    architectureViewOf,
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
        // a green case with no reference rung has nothing to diff against
        expect(casesViewOf(order, green("h1", "h2"), []).cases[1]).toMatchObject({ everGreen: true, diffAvailable: false })
        expect(view.cases[1]?.lastRun?.failed).toEqual({
            invariant: "wallet-restored",
            message: "wallet is 3.8m",
            expected: "5000000",
            actual: "3800000",
        })
        expect(view.currentCaseId).toBe("h2")
    })

    it("offers the reset only on a case that has a reference: unhappy ones, and a happy one the starter breaks", () => {
        const view = casesViewOf(order, green("h1", "h2", "u1", "u2"), [])
        const resets = view.cases.map((each) => [each.caseId, each.resetAvailable])

        expect(resets).toEqual([
            ["h1", true],
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
        expect(view.cases.find((each) => each.caseId === "u3")).toMatchObject({
            status: "green",
            lastRun: { failed: null },
        })
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
        expect(view.unhappy.find((each) => each.id === "u2")?.hints).toEqual([
            { level: 1, text: null, unlocked: false },
        ])
        expect(JSON.stringify(view)).not.toContain("gợi ý 3")
        expect(JSON.stringify(view)).not.toContain("u2 gợi ý 1")
    })

    it("lists the chaos labels the lab declares, in both languages, and none while it declares none", () => {
        const labelled = courseLabCheckOf("saga-compensation", {
            ...labRecordFixture(),
            chaos: [{ id: "STOCK_OUT", label: { vi: "Kho hết hàng", en: "Out of stock" } }],
        })
        if (!labelled.ok) throw new Error(labelled.refusal)

        expect(lessonViewOf(labelled.record, "abc123", [], "vi").chaos).toEqual([
            { id: "STOCK_OUT", label: { vi: "Kho hết hàng", en: "Out of stock" } },
        ])
        expect(lessonViewOf(record(), "abc123", [], "vi").chaos).toEqual([])
    })

    it("writes a hint in the asked locale", () => {
        const view = lessonViewOf(record(), "abc123", marks, "en")

        expect(view.unhappy[0]?.hints[0]?.text).toBe("hint 1")
    })

    it("shows the chaos as key and value, the invariants as id, vi and en, the focus of each case, and a happy case without hints or a term", () => {
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
        expect(view.happy[1]).toMatchObject({ teaches: null, hints: [], hasReference: false, focus: null })
        // a happy case the starter breaks has its rung, its closed hint and its focus lines
        expect(view.happy[0]).toMatchObject({
            teaches: null,
            hints: [{ level: 1, text: null, unlocked: false }],
            hasReference: true,
            focus: { file: "services/orders/src/checkout.ts", lines: [41, 45] },
        })
        expect(view.unhappy[0]?.focus).toEqual({ file: "services/orders/src/checkout.ts", lines: [15, 22] })
        expect(view.architecture).toBeNull()
        expect(view.unhappy[0]).toMatchObject({ teaches: "compensating transaction", hasReference: true })
    })

    it("carries the stack and the framework map, with English missing where the record has none", () => {
        const view = lessonViewOf(record(), "abc123", [], "vi")

        expect(view).toMatchObject({
            lessonId: "saga-compensation",
            version: "abc123",
            lab: "shop-giay",
            concept: "saga",
        })
        expect(view.stack.services[0]).toEqual({
            id: "orders",
            port: 4001,
            db: "orders",
            uses: [],
            role: { vi: "nhận checkout", en: null },
            icon: null,
        })
        expect(view.stack.services[1]?.role).toEqual({ vi: "trừ tiền", en: "charges" })
        expect(view.nestjs).toEqual([
            { from: "services/orders/src/checkout.ts#STEPS", to: "apps/orders/src/saga/steps.ts" },
        ])
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

describe("caseRunsOfUpload", () => {
    const event = (caseId: string, kind: "happy" | "unhappy", upTo: ReadonlyArray<[string, "green" | "red"]>) => ({
        caseId,
        kind,
        status: "green" as const,
        upTo: upTo.map(([id, status]) => ({ caseId: id, status })),
    })

    it("answers the covered cases in the lab's order with their kinds, the named case with the upload's status", () => {
        const runs = caseRunsOfUpload(
            caseOrderOf(record()),
            event("u1", "unhappy", [
                ["u1", "red"],
                ["h1", "green"],
                ["h2", "red"],
            ]),
        )

        expect(runs).toEqual([
            { caseId: "h1", kind: "happy", status: "green" },
            { caseId: "h2", kind: "happy", status: "red" },
            { caseId: "u1", kind: "unhappy", status: "green" },
        ])
    })

    it("refuses an unknown case, a repeated case and a case after the named one", () => {
        const order = caseOrderOf(record())

        expect(caseRunsOfUpload(order, event("h2", "happy", [["zz", "green"]]))).toBeNull()
        expect(
            caseRunsOfUpload(
                order,
                event("h2", "happy", [
                    ["h1", "green"],
                    ["h1", "red"],
                ]),
            ),
        ).toBeNull()
        expect(caseRunsOfUpload(order, event("h1", "happy", [["h2", "green"]]))).toBeNull()
    })
})

describe("caseRunEventIdOf", () => {
    it("derives a stable UUID per upload and case", () => {
        const id = caseRunEventIdOf("0c9a2b1e-9a2c-4b6e-8f1a-2b3c4d5e6f70", "h1")

        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u)
        expect(caseRunEventIdOf("0c9a2b1e-9a2c-4b6e-8f1a-2b3c4d5e6f70", "h1")).toBe(id)
        expect(caseRunEventIdOf("0c9a2b1e-9a2c-4b6e-8f1a-2b3c4d5e6f70", "h2")).not.toBe(id)
    })
})

describe("architectureViewOf", () => {
    /** The shared ladder with the saga lab's architecture block, trimmed: three requests, the tables of two services, one learner excerpt. */
    const withArchitecture = (over: Record<string, unknown> = {}): CourseLabRecord => {
        const value = labRecordWithRungsFixture({
            rungs: [
                { tag: "c0-start", content: "line 1\nline 2\nline 3\nline 4\n" },
                { tag: "c0-naive", content: "// c0\n" },
                { tag: "c1-compensate", content: "// c1\n" },
                { tag: "c2-retry", content: "// c2\n" },
            ],
            architecture: {
                flow: [{ vi: "frontend gửi POST /checkout tới orders", icon: "browser" }],
                requests: [
                    { n: 2, from: "orders", to: "payments", method: "POST", path: "/charges", does: "payments trừ tiền", undo: { method: "POST", path: "/charges/:orderId/refund" } },
                    { n: 1, from: "orders", to: "notify", method: "POST", path: "/emails", does: { vi: "notify gửi email", en: "notify sends the email" }, undo: null },
                ],
                tables: { payments: ["wallets", "charges"], orders: ["orders", "checkout_steps"] },
                why: { vi: "Không transaction nào bao trọn các database." },
                learner: { now: { vi: "gọi lần lượt" }, excerpt: { from: 2, to: 3 }, marks: [{ line: 2, request: 1 }, { line: 3, request: 2 }] },
            },
            ...over,
        })
        const checked = courseLabCheckOf("saga-compensation", value)
        if (!checked.ok) throw new Error(checked.refusal)
        return checked.record
    }

    it("is null for a record cut before the page", () => {
        expect(architectureViewOf(record())).toBeNull()
    })

    it("orders the requests by number, the tables by the stack's services, and keeps every line as { vi, en }", () => {
        const view = architectureViewOf(withArchitecture())

        expect(view?.requests.map((each) => `${String(each.n)} ${each.method} ${each.path}`)).toEqual(["1 POST /emails", "2 POST /charges"])
        expect(view?.requests[0]?.does).toEqual({ vi: "notify gửi email", en: "notify sends the email" })
        expect(view?.requests[1]?.undo).toEqual({ method: "POST", path: "/charges/:orderId/refund" })
        expect(view?.tables).toEqual([
            { serviceId: "orders", tables: ["orders", "checkout_steps"] },
            { serviceId: "payments", tables: ["wallets", "charges"] },
        ])
        expect(view?.flow).toEqual([{ text: { vi: "frontend gửi POST /checkout tới orders", en: null }, icon: "browser" }])
        expect(view?.why).toEqual({ vi: "Không transaction nào bao trọn các database.", en: null })
    })

    it("cuts the one learner file's excerpt from the base rung only, with its marks", () => {
        const view = architectureViewOf(withArchitecture())

        expect(view?.files).toEqual([
            {
                path: "services/orders/src/checkout.ts",
                role: null,
                excerpt: { from: 2, to: 3, code: "line 2\nline 3" },
                marks: [{ line: 2, request: 1 }, { line: 3, request: 2 }],
            },
        ])
        expect(JSON.stringify(view)).not.toContain("// c0")
    })

    it("lists several learner files with their roles; only the record's learner file carries code", () => {
        const base = withArchitecture()
        const learner = { ...base.architecture?.learner, files: [
            { path: "services/orders/src/checkout.ts", role: "điều phối các bước" },
            { path: "db/001_outbox.sql", role: { vi: "bảng outbox" }, excerpt: { from: 1, to: 4 }, marks: [] },
        ] }
        const view = architectureViewOf(withArchitecture({ architecture: { ...base.architecture, learner } }))

        expect(view?.files[0]).toMatchObject({ role: { vi: "điều phối các bước", en: null }, excerpt: { from: 2, to: 3, code: "line 2\nline 3" } })
        expect(view?.files[1]).toEqual({ path: "db/001_outbox.sql", role: { vi: "bảng outbox", en: null }, excerpt: { from: 1, to: 4, code: null }, marks: [] })
    })
})
