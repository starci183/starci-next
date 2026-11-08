import { Test } from "@nestjs/testing"
import type { Judge0CaseResult } from "@modules/integrations/judge0"
import * as subject from "./practice-verdict.policy"
import { MAX_COMPILE_OUTPUT, MAX_EXAMPLE_ACTUAL } from "./practice-verdict.policy"
import type { PracticeVerdict } from "./practice.contracts"

const SUBJECT: unique symbol = Symbol("practice.practice-verdict.policy")

const result = (overrides: Partial<Judge0CaseResult> = {}): Judge0CaseResult => ({
    status: "accepted",
    stdout: "3",
    stderr: "",
    compileOutput: "",
    timeMs: 10,
    memoryKb: 100,
    ...overrides,
})

describe("verdictOf", () => {
    let verdictOf: typeof subject.verdictOf

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ verdictOf } = moduleRef.get<typeof subject>(SUBJECT))
    })

    it("accepts a submission whose every test passed", () => {
        expect(verdictOf([result(), result()])).toBe("accepted")
    })

    it("names the first test that did not pass", () => {
        expect(verdictOf([result(), result({ status: "time-limit" }), result({ status: "wrong-answer" })])).toBe(
            "time-limit-exceeded",
        )
        expect(verdictOf([result({ status: "wrong-answer" })])).toBe("wrong-answer")
        expect(verdictOf([result({ status: "runtime-error" })])).toBe("runtime-error")
    })

    it("lets a compile error anywhere win over a failure before it", () => {
        expect(verdictOf([result({ status: "wrong-answer" }), result({ status: "compile-error" })])).toBe(
            "compile-error",
        )
    })

    it("lets an internal error of the judge win over a plain failure", () => {
        expect(verdictOf([result({ status: "wrong-answer" }), result({ status: "internal-error" })])).toBe(
            "internal-error",
        )
    })
})

describe("summariesOf", () => {
    let summariesOf: typeof subject.summariesOf

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ summariesOf } = moduleRef.get<typeof subject>(SUBJECT))
    })

    it("keeps the position, flag, status, time and memory of every test and nothing of a hidden test", () => {
        const summaries = summariesOf(
            [result(), result({ status: "wrong-answer", stdout: "secret" })],
            [{ input: "1 2", output: "3" }],
        )

        expect(summaries).toEqual([
            {
                index: 0,
                passed: true,
                status: "Accepted",
                timeMs: 10,
                memoryKb: 100,
                example: { input: "1 2", expected: "3", actual: "3" },
            },
            { index: 1, passed: false, status: "Wrong Answer", timeMs: 10, memoryKb: 100, example: null },
        ])
        expect(JSON.stringify(summaries)).not.toContain("secret")
    })

    it("labels every judge status", () => {
        const statuses = (["time-limit", "compile-error", "runtime-error", "internal-error"] as const).map(
            (status) => summariesOf([result({ status })], [])[0]?.status,
        )

        expect(statuses).toEqual(["Time Limit Exceeded", "Compilation Error", "Runtime Error", "Internal Error"])
    })

    it("clips what an example program printed", () => {
        const [summary] = summariesOf(
            [result({ stdout: "x".repeat(MAX_EXAMPLE_ACTUAL + 5) })],
            [{ input: "", output: "" }],
        )

        expect(summary?.example?.actual).toBe(`${"x".repeat(MAX_EXAMPLE_ACTUAL)}…`)
    })
})

describe("compileOutputOf", () => {
    let compileOutputOf: typeof subject.compileOutputOf

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ compileOutputOf } = moduleRef.get<typeof subject>(SUBJECT))
    })

    it("answers null when no test has compiler output", () => {
        expect(compileOutputOf([result()])).toBeNull()
    })

    it("answers the compiler output of the first test that has one, clipped", () => {
        expect(compileOutputOf([result(), result({ compileOutput: "boom" })])).toBe("boom")
        expect(compileOutputOf([result({ compileOutput: "y".repeat(MAX_COMPILE_OUTPUT + 1) })])).toBe(
            `${"y".repeat(MAX_COMPILE_OUTPUT)}…`,
        )
    })
})

describe("peakOf", () => {
    let peakOf: typeof subject.peakOf

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ peakOf } = moduleRef.get<typeof subject>(SUBJECT))
    })

    it("answers the largest measure of the tests that ran", () => {
        expect(peakOf([3, null, 9, 4])).toBe(9)
    })

    it("answers null when no test ran", () => {
        expect(peakOf([null, null])).toBeNull()
        expect(peakOf([])).toBeNull()
    })
})

describe("isGraded", () => {
    let isGraded: typeof subject.isGraded

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ isGraded } = moduleRef.get<typeof subject>(SUBJECT))
    })

    it("counts every verdict where the judge ran the program", () => {
        const verdicts: ReadonlyArray<PracticeVerdict> = [
            "accepted",
            "wrong-answer",
            "time-limit-exceeded",
            "compile-error",
            "runtime-error",
        ]

        expect(verdicts.map((verdict) => isGraded(verdict))).toEqual([true, true, true, true, true])
    })

    it("does not count an internal error or a submission still in flight", () => {
        expect(isGraded("internal-error")).toBe(false)
        expect(isGraded("queued")).toBe(false)
        expect(isGraded("running")).toBe(false)
    })
})
