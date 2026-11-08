import { Test } from "@nestjs/testing"

import { ciRunOf, ciSignatureOf, isCiFresh, isCiSignatureValid } from "./project-ci.policy"

const POLICY: unique symbol = Symbol("project.project-ci-policy")
const policies = { ciRunOf, ciSignatureOf, isCiFresh, isCiSignatureValid }

const build = async (): Promise<typeof policies> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policies }],
    }).compile()
    return moduleRef.get<typeof policies>(POLICY)
}

const BODY = {
    runId: "gh-100-1",
    commit: "ABC1234",
    passed: true,
    results: [
        { concept: "idempotency", slot: "test", ref: "[idempotency] twice", passed: true },
        { concept: "idempotency", slot: "probe", ref: "repeat-same-key", passed: false },
    ],
}

const rawOf = (value: unknown): Buffer => Buffer.from(JSON.stringify(value))

describe("the CI signature", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    const raw = rawOf(BODY)

    it("signs the timestamp and the raw body with the project's secret", () => {
        const signature = subject.ciSignatureOf("secret", "1790000000000", raw)

        expect(signature).toMatch(/^sha256=[0-9a-f]{64}$/u)
        expect(subject.isCiSignatureValid("secret", "1790000000000", raw, signature)).toBe(true)
    })

    it("refuses another secret, another timestamp, another body and a signature of another length", () => {
        const signature = subject.ciSignatureOf("secret", "1790000000000", raw)

        expect(subject.isCiSignatureValid("other", "1790000000000", raw, signature)).toBe(false)
        expect(subject.isCiSignatureValid("secret", "1790000000001", raw, signature)).toBe(false)
        expect(
            subject.isCiSignatureValid("secret", "1790000000000", rawOf({ ...BODY, passed: false }), signature),
        ).toBe(false)
        expect(subject.isCiSignatureValid("secret", "1790000000000", raw, "sha256=abc")).toBe(false)
    })
})

describe("isCiFresh", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    const now = new Date("2026-11-08T10:00:00.000Z")

    it("accepts a timestamp within the tolerance on either side", () => {
        expect(subject.isCiFresh(String(now.getTime() - 1000), now, 5000)).toBe(true)
        expect(subject.isCiFresh(String(now.getTime() + 5000), now, 5000)).toBe(true)
    })

    it("refuses a stale, a future and an unreadable timestamp", () => {
        expect(subject.isCiFresh(String(now.getTime() - 5001), now, 5000)).toBe(false)
        expect(subject.isCiFresh(String(now.getTime() + 5001), now, 5000)).toBe(false)
        expect(subject.isCiFresh("yesterday", now, 5000)).toBe(false)
    })
})

describe("ciRunOf", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("reads the signed document and lower-cases the commit", () => {
        expect(subject.ciRunOf(rawOf(BODY))).toEqual({
            runId: "gh-100-1",
            commit: "abc1234",
            passed: true,
            results: BODY.results.map((result) => ({ ...result })),
        })
    })

    it.each([
        ["no body", undefined],
        ["text", Buffer.from("not json")],
        ["an array", rawOf([])],
        ["a bad run id", rawOf({ ...BODY, runId: "has space" })],
        ["a run id that is not text", rawOf({ ...BODY, runId: 1 })],
        ["a bad commit", rawOf({ ...BODY, commit: "xyz" })],
        ["a commit that is not text", rawOf({ ...BODY, commit: 1 })],
        ["a passed flag that is not a boolean", rawOf({ ...BODY, passed: "yes" })],
        ["results that are not a list", rawOf({ ...BODY, results: {} })],
        ["too many results", rawOf({ ...BODY, results: Array.from({ length: 501 }, () => BODY.results[0]) })],
        ["a result that is not an object", rawOf({ ...BODY, results: ["x"] })],
        ["a concept that is not an id", rawOf({ ...BODY, results: [{ ...BODY.results[0], concept: "Bad Id" }] })],
        ["a concept that is not text", rawOf({ ...BODY, results: [{ ...BODY.results[0], concept: 3 }] })],
        ["a slot the action may not post", rawOf({ ...BODY, results: [{ ...BODY.results[0], slot: "code-read" }] })],
        ["an unknown slot", rawOf({ ...BODY, results: [{ ...BODY.results[0], slot: "lint" }] })],
        ["an empty ref", rawOf({ ...BODY, results: [{ ...BODY.results[0], ref: "  " }] })],
        ["a ref with a control character", rawOf({ ...BODY, results: [{ ...BODY.results[0], ref: "a\u0001b" }] })],
        ["a long ref", rawOf({ ...BODY, results: [{ ...BODY.results[0], ref: "r".repeat(301) }] })],
        ["a ref that is not text", rawOf({ ...BODY, results: [{ ...BODY.results[0], ref: 1 }] })],
        ["a result flag that is not a boolean", rawOf({ ...BODY, results: [{ ...BODY.results[0], passed: 1 }] })],
    ])("refuses %s as PROJECT_CI_PAYLOAD_INVALID", (_name, raw) => {
        expect(() => subject.ciRunOf(raw)).toThrow("PROJECT_CI_PAYLOAD_INVALID")
    })
})
