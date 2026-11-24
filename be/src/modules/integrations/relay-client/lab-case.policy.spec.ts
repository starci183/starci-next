import { CASE_RESULT_EVENT } from "@modules/platform/relay-protocol"
import {
    caseResultEventOf,
    caseStatusOf,
    hintOf,
    hintsOpenedOf,
    inspectUrlOf,
    labRunCaseResultOf,
} from "./lab-case.policy"
import { caseOf, labManifestOf, type LabCase, type LabManifest } from "./lab-manifest.policy"
import { manifestYaml, reportXml, WALLET_FAILURE } from "./lab-manifest.testing"
import { scenarioCasesOf } from "./scenario-report.policy"

const MANIFEST = ((): LabManifest => {
    const read = labManifestOf(manifestYaml())
    if (read.kind !== "read") throw new Error(read.problems.join("\n"))
    return read.manifest
})()

const caseNamed = (id: string): LabCase => {
    const item = caseOf(MANIFEST, id)
    if (item === undefined) throw new Error(id)
    return item
}

const REPORT = reportXml([
    { name: "[case:checkout-in-stock] confirms the order" },
    { name: "[case:out-of-stock] [invariant:money-back] gives the money back", failure: WALLET_FAILURE },
])

describe("caseStatusOf", () => {
    const tests = scenarioCasesOf(REPORT)

    it("reads a red case's invariant and Jest's expected and received values, without colour codes", () => {
        expect(caseStatusOf(tests, "out-of-stock")).toMatchObject({
            state: "red",
            failing: ["gives the money back"],
            invariant: "money-back",
            expected: "5000000",
            actual: "3800000",
        })
    })

    it("tells a green case from one the report does not name", () => {
        expect(caseStatusOf(tests, "checkout-in-stock")).toMatchObject({
            state: "green",
            invariant: null,
            message: null,
        })
        expect(caseStatusOf(tests, "flaky-undo").state).toBe("not-run")
    })
})

describe("hintOf", () => {
    const item = caseNamed("out-of-stock")

    it("opens levels strictly in order, shows an open level again without counting it, and counts the levels opened", () => {
        expect(hintOf(item, 2, {})).toEqual({ kind: "locked", next: 1 })
        const first = hintOf(item, 1, {})
        expect(first).toEqual({
            kind: "unlocked",
            level: 1,
            text: "Gợi ý 1 của out-of-stock",
            ledger: { "out-of-stock": 1 },
        })
        expect(hintOf(item, 1, { "out-of-stock": 1 })).toMatchObject({ kind: "already", level: 1 })
        expect(hintOf(item, 4, {})).toEqual({ kind: "out-of-range" })
        expect(hintOf(caseNamed("checkout-in-stock"), 1, {})).toEqual({ kind: "no-hints" })
        expect(hintsOpenedOf({ "out-of-stock": 2, "flaky-undo": 1 })).toBe(3)
    })
})

describe("inspectUrlOf", () => {
    it("fills only a declared view, with id-shaped values, URL-encoded", () => {
        expect(inspectUrlOf(MANIFEST, "wallet", { customerId: "c-minh" })).toEqual({
            kind: "url",
            url: "http://localhost:4002/wallets/c-minh",
        })
        expect(inspectUrlOf(MANIFEST, "secrets", {})).toEqual({ kind: "unknown-view" })
        expect(inspectUrlOf(MANIFEST, "wallet", {})).toEqual({
            kind: "bad-params",
            missing: ["customerId"],
            invalid: [],
        })
        expect(inspectUrlOf(MANIFEST, "wallet", { customerId: "../../admin" })).toEqual({
            kind: "bad-params",
            missing: [],
            invalid: ["customerId"],
        })
    })
})

describe("caseResultEventOf", () => {
    it("builds a case.result the protocol accepts, with the failure and every case the run covered", () => {
        const tests = scenarioCasesOf(REPORT)
        const event = caseResultEventOf(MANIFEST, caseNamed("out-of-stock"), {
            ranAt: "2026-11-25T08:00:00.000Z",
            durationMs: 1234.4,
            learnerCommit: null,
            statuses: ["checkout-in-stock", "checkout-slow-net", "out-of-stock"].map((id) => caseStatusOf(tests, id)),
        })

        expect(CASE_RESULT_EVENT.parse(event)).toEqual(event)
        expect(event).toMatchObject({
            status: "red",
            durationMs: 1234,
            chaos: { STOCK_OUT: "on" },
            upTo: [
                { caseId: "checkout-in-stock", status: "green" },
                { caseId: "checkout-slow-net", status: "error" },
                { caseId: "out-of-stock", status: "red" },
            ],
            failed: { invariant: "money-back", expected: "5000000", actual: "3800000" },
        })
    })
})

describe("labRunCaseResultOf", () => {
    const FACTS = { ranAt: "2026-11-25T08:00:00.000Z", durationMs: 4000, learnerCommit: "a".repeat(40) }

    it("turns a whole-lab run into the run of the last case it reports, so a fresh boot on buggy code shows red again", () => {
        const event = labRunCaseResultOf(MANIFEST, FACTS, REPORT)
        if (event === null) throw new Error("no event")

        expect(CASE_RESULT_EVENT.parse(event)).toEqual(event)
        expect(event).toMatchObject({
            caseId: "out-of-stock",
            kind: "unhappy",
            status: "red",
            learnerCommit: "a".repeat(40),
        })
        expect(event.upTo).toEqual([
            { caseId: "checkout-in-stock", status: "green" },
            { caseId: "out-of-stock", status: "red" },
        ])
    })

    it("leaves out a case the report does not name instead of calling it an error", () => {
        const event = labRunCaseResultOf(MANIFEST, FACTS, REPORT)

        expect(event?.upTo.map((entry) => entry.caseId)).not.toContain("checkout-slow-net")
    })

    it("sends nothing for a report that names no case", () => {
        expect(labRunCaseResultOf(MANIFEST, FACTS, reportXml([{ name: "a test with no case tag" }]))).toBeNull()
    })
})
