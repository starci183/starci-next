import { Test } from "@nestjs/testing"
import { conceptRunsOf, junitCasesOf } from "./junit.policy"

const POLICY: unique symbol = Symbol("spec.junit-policy")
const policy = { conceptRunsOf, junitCasesOf }

const build = async (): Promise<typeof policy> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policy }],
    }).compile()
    return moduleRef.get(POLICY)
}

const XML = `<?xml version="1.0" encoding="utf-8"?>
<testsuites name="root" tests="5">
  <testsuite name="orders" tests="4">
    <testcase name="[transactions-and-isolation] last item sells once" time="0.01" classname="test"/>
    <testcase name="[transactions-and-isolation] [idempotency] two buyers &amp; one stock" time="0.02" classname="test">
      <failure type="testCodeFailure" message="x">boom</failure>
    </testcase>
    <testcase name="[idempotency] same key, same answer" time="0.01" classname="test"/>
    <testcase name="[idempotency] skipped one" classname="test"><skipped type="skip"/></testcase>
    <testcase name="no tag at all" classname="test"/>
  </testsuite>
</testsuites>`

describe("junitCasesOf", () => {
    it("reads names, failures and skips, decoding entities", async () => {
        const subject = await build()
        const cases = subject.junitCasesOf(XML)

        expect(cases.map((test) => test.name)).toContain(
            "[transactions-and-isolation] [idempotency] two buyers & one stock",
        )
        expect(cases.filter((test) => test.passed)).toHaveLength(3)
        expect(cases.filter((test) => test.skipped)).toHaveLength(1)
    })

    it("names a test case with no name attribute as empty", async () => {
        const subject = await build()

        expect(subject.junitCasesOf('<testcase classname="x"/>')).toEqual([{ name: "", skipped: false, passed: true }])
    })

    it("reads nothing from a report without test cases", async () => {
        const subject = await build()
        expect(subject.junitCasesOf("<testsuites/>")).toEqual([])
    })
})

describe("conceptRunsOf", () => {
    it("groups tagged tests by concept; a failing test fails the concept and a skipped one counts for nothing", async () => {
        const subject = await build()
        const runs = subject.conceptRunsOf(subject.junitCasesOf(XML), [
            "transactions-and-isolation",
            "idempotency",
            "rate-limiting",
        ])

        expect(runs).toEqual([
            {
                conceptId: "transactions-and-isolation",
                passed: false,
                names: [
                    "[transactions-and-isolation] last item sells once",
                    "[transactions-and-isolation] [idempotency] two buyers & one stock",
                ],
            },
            {
                conceptId: "idempotency",
                passed: false,
                names: [
                    "[transactions-and-isolation] [idempotency] two buyers & one stock",
                    "[idempotency] same key, same answer",
                ],
            },
        ])
    })

    it("passes a concept whose running tests all passed", async () => {
        const subject = await build()
        const runs = subject.conceptRunsOf(subject.junitCasesOf(XML), ["no-such"])

        expect(runs).toEqual([])
        expect(
            subject.conceptRunsOf([{ name: "[idempotency] ok", passed: true, skipped: false }], ["idempotency"]),
        ).toEqual([{ conceptId: "idempotency", passed: true, names: ["[idempotency] ok"] }])
    })
})
