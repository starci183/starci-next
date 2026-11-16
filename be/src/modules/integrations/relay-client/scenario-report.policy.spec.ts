import type { LessonScenario } from "./lesson.contracts"
import { ledgerLinesOf, ledgerTextOf, scenarioCasesOf, scenarioResultOf } from "./scenario-report.policy"

const SCENARIO: LessonScenario = {
    id: "dup-submit",
    title: "Duplicate submit",
    brief: "",
    concepts: ["idempotency", "outbox"],
    command: "x",
    cwd: ".",
    report: "r.xml",
    timeoutMs: 1,
    guards: [],
    files: [],
}

const XML = `<testsuites>
  <testcase name="[scenario:dup-submit] [idempotency] same key, one effect" time="0.25">
    <system-out><![CDATA[noise
[ledger] debit 100 key=k1
[ledger] debit 100 key=k1 (replayed)
[timeline] 0 submit
[timeline] 12 submit again]]></system-out>
  </testcase>
  <testcase name="[scenario:dup-submit] [idempotency] second call does not charge" time="0.5">
    <failure message="[invariant:idempotency-key] the second submit charged again &amp; shipped">stack</failure>
  </testcase>
  <testcase name="[scenario:other] [outbox] unrelated" time="0.1"/>
  <testcase name="[scenario:dup-submit] [outbox] skipped one"><skipped/></testcase>
</testsuites>`

describe("scenarioResultOf", () => {
    const cases = scenarioCasesOf(XML)

    it("reads time, messages, ledger and timeline of the cases", () => {
        expect(cases[0]).toMatchObject({
            timeMs: 250,
            passed: true,
            ledger: ["debit 100 key=k1", "debit 100 key=k1 (replayed)"],
            timeline: ["0 submit", "12 submit again"],
        })
        expect(cases[1]?.message).toBe("[invariant:idempotency-key] the second submit charged again & shipped")
    })

    it("fails the scenario on one red test and names the broken invariant", () => {
        const result = scenarioResultOf(cases, SCENARIO)

        expect(result).toMatchObject({
            passed: false,
            concepts: ["idempotency"],
            invariantIds: ["idempotency-key"],
            why: "[invariant:idempotency-key] the second submit charged again & shipped",
        })
        expect(result.tests).toHaveLength(2)
    })

    it("does not pass a scenario with no tagged running test", () => {
        const result = scenarioResultOf(cases, { ...SCENARIO, id: "missing" })

        expect(result).toMatchObject({ passed: false, tests: [], concepts: [] })
        expect(ledgerLinesOf(result, {})[0]).toContain("not run")
    })

    it("passes when every tagged test ran and passed", () => {
        const green = scenarioCasesOf(`<testcase name="[scenario:dup-submit] [outbox] a" time="1"/>`)

        expect(scenarioResultOf(green, SCENARIO)).toMatchObject({ passed: true, concepts: ["outbox"], why: null })
    })

    it("prints the timeline, ledger and why of a red result, and uploads a bounded ledger", () => {
        const result = scenarioResultOf(cases, SCENARIO)
        const lines = ledgerLinesOf(result, { "idempotency-key": "One command, one effect" })

        expect(lines).toContain('  Why wrong: invariant "One command, one effect" (idempotency-key) is broken')
        expect(lines.some((line) => line.includes("ledger    debit 100 key=k1"))).toBe(true)
        expect(ledgerTextOf(result)).toContain("t+12 submit again")
    })

    it("counts [concept:<id>] and the bare [<id>] as concepts, never a scenario or invariant tag", () => {
        const tagged = scenarioCasesOf(
            '<testcase name="[scenario:dup-submit] [concept:idempotency] a" time="1"/>' +
                '<testcase name="[scenario:dup-submit] [outbox] b" time="1"/>' +
                '<testcase name="[scenario:dup-submit] [invariant:x] c" time="1"/>',
        )
        const result = scenarioResultOf(tagged, { ...SCENARIO, concepts: ["idempotency", "outbox", "x", "scenario"] })

        expect(result.concepts).toEqual(["idempotency", "outbox"])
        expect(result.passed).toBe(true)
    })
})
