import { Test } from "@nestjs/testing"
import * as subject from "./judge0-wire.policy"
import { JUDGE0_BATCH_LIMIT, JUDGE0_LANGUAGE_IDS, JUDGE0_READ_FIELDS } from "./judge0-wire.policy"

const SUBJECT: unique symbol = Symbol("practice.judge0-wire.policy")

const b64 = (text: string): string => Buffer.from(text, "utf8").toString("base64")

describe("judge0 wire constants", () => {
    it("names the Judge0 language id the teacher's audited runs used for each language", () => {
        expect(JUDGE0_LANGUAGE_IDS).toEqual({ cpp: 54, java: 62, javascript: 63, python: 71, typescript: 74 })
        expect(JUDGE0_BATCH_LIMIT).toBe(20)
        expect(JUDGE0_READ_FIELDS).toContain("compile_output")
    })
})

describe("judge0BatchBody", () => {
    let judge0BatchBody: typeof subject.judge0BatchBody

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ judge0BatchBody } = moduleRef.get<typeof subject>(SUBJECT))
    })

    it("sends one base64 submission per test with the limits in seconds and kilobytes", () => {
        const body = judge0BatchBody(
            {
                correlationId: "c-1",
                language: "python",
                source: "print(1)",
                cases: [],
                cpuTimeLimitMs: 2500,
                memoryLimitKb: 262144,
            },
            [{ stdin: "2\n1 2", expectedOutput: "3" }],
            71,
        )

        expect(body).toEqual({
            submissions: [
                {
                    language_id: 71,
                    source_code: b64("print(1)"),
                    stdin: b64("2\n1 2"),
                    expected_output: b64("3"),
                    cpu_time_limit: 2.5,
                    memory_limit: 262144,
                },
            ],
        })
    })
})

describe("judge0TokensOf", () => {
    let judge0TokensOf: typeof subject.judge0TokensOf

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ judge0TokensOf } = moduleRef.get<typeof subject>(SUBJECT))
    })

    it.each([
        ["not a list", { token: "a" }],
        ["a list of another size", [{ token: "a" }]],
        ["an entry that is not an object", ["a", "b"]],
        ["an entry without a token", [{ token: "a" }, { other: 1 }]],
        ["an entry whose token is not text", [{ token: "a" }, { token: 2 }]],
    ])("refuses %s", (_name, body) => {
        expect(judge0TokensOf(body, 2)).toBeNull()
    })

    it("answers the tokens of a create answer in order", () => {
        expect(judge0TokensOf([{ token: "a" }, { token: "b" }], 2)).toEqual(["a", "b"])
    })
})

describe("judge0StatusOf", () => {
    let judge0StatusOf: typeof subject.judge0StatusOf

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ judge0StatusOf } = moduleRef.get<typeof subject>(SUBJECT))
    })

    it.each([
        [3, "accepted"],
        [4, "wrong-answer"],
        [5, "time-limit"],
        [6, "compile-error"],
        [7, "runtime-error"],
        [12, "runtime-error"],
        [13, "internal-error"],
        [14, "internal-error"],
        [1, "internal-error"],
    ])("maps the Judge0 status %i to %s", (id, status) => {
        expect(judge0StatusOf(id)).toBe(status)
    })
})

describe("judge0ResultOf", () => {
    let judge0IsPending: typeof subject.judge0IsPending
    let judge0ResultOf: typeof subject.judge0ResultOf

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ judge0IsPending, judge0ResultOf } = moduleRef.get<typeof subject>(SUBJECT))
    })

    it.each([
        ["not an object", "x"],
        ["an object without a status", {}],
        ["a status that is not an object", { status: 3 }],
        ["a status without a numeric id", { status: { id: "3" } }],
    ])("refuses %s", (_name, entry) => {
        expect(judge0ResultOf(entry)).toBeNull()
    })

    it.each([1, 2])("waits while Judge0 still holds the submission (status %i)", (id) => {
        expect(judge0IsPending({ status: { id } })).toBe(true)
        expect(judge0ResultOf({ status: { id } })).toBeNull()
    })

    it("reads a judged submission: decoded streams, time in milliseconds and memory in kilobytes", () => {
        expect(
            judge0ResultOf({
                status: { id: 4 },
                stdout: b64("5\n"),
                stderr: b64("warn"),
                compile_output: b64("cc"),
                time: "0.034",
                memory: 3604.4,
            }),
        ).toEqual({
            status: "wrong-answer",
            stdout: "5\n",
            stderr: "warn",
            compileOutput: "cc",
            timeMs: 34,
            memoryKb: 3604,
        })
    })

    it("reads a numeric time and treats missing or odd fields as empty and unmeasured", () => {
        expect(judge0ResultOf({ status: { id: 3 }, time: 1.5, memory: "big", stdout: null })).toEqual({
            status: "accepted",
            stdout: "",
            stderr: "",
            compileOutput: "",
            timeMs: 1500,
            memoryKb: null,
        })
        expect(judge0ResultOf({ status: { id: 6 }, time: "slow" })).toMatchObject({ timeMs: null })
        expect(judge0ResultOf({ status: { id: 6 }, time: Number.NaN })).toMatchObject({ timeMs: null })
    })
})

describe("judge0EntriesOf", () => {
    let judge0EntriesOf: typeof subject.judge0EntriesOf

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ judge0EntriesOf } = moduleRef.get<typeof subject>(SUBJECT))
    })

    it.each([
        ["a list", []],
        ["an object without submissions", {}],
        ["submissions that are not a list", { submissions: 1 }],
        ["submissions of another size", { submissions: [1] }],
    ])("refuses %s", (_name, body) => {
        expect(judge0EntriesOf(body, 2)).toBeNull()
    })

    it("answers the submissions of a batch read", () => {
        expect(judge0EntriesOf({ submissions: [1, 2] }, 2)).toEqual([1, 2])
    })
})
