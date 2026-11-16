import { lessonOf } from "./lesson.policy"

const SCENARIO = {
    id: "dup-submit",
    title: "Duplicate submit",
    brief: "Send the same command twice.",
    concepts: ["idempotency"],
    command: "npm test -- --scenario dup-submit",
    cwd: ".",
    report: "reports/junit.xml",
    timeoutMs: 300_000,
    guards: [{ name: "idempotency-key", env: "GUARD_IDEMPOTENCY_KEY", off: "off" }],
}
const LESSON = {
    lessonId: "outbox",
    source: {
        url: "https://files.starci.test/lesson-outbox.tar.gz?sig=abc",
        sha256: "e".repeat(64),
        commit: "a".repeat(40),
    },
    dir: ".",
    compose: ".docker",
    project: "outbox",
    invariants: { "idempotency-key": "One command, one effect" },
    scenarios: [SCENARIO],
}

describe("lessonOf", () => {
    it("is undefined when the payload has no lesson", () => {
        expect(lessonOf(undefined)).toBeUndefined()
    })

    it("reads a well formed lesson, files defaulted", () => {
        const lesson = lessonOf(LESSON)

        expect(lesson?.scenarios[0]).toMatchObject({
            id: "dup-submit",
            files: [],
            guards: [{ name: "idempotency-key" }],
        })
        expect(lesson?.invariants["idempotency-key"]).toBe("One command, one effect")
    })

    it.each([
        ["a non-https source url", { ...LESSON, source: { ...LESSON.source, url: "http://x.test/s.tar.gz" } }],
        ["a source url with credentials", { ...LESSON, source: { ...LESSON.source, url: "https://u:p@x.test/s.tgz" } }],
        ["a source url with spaces", { ...LESSON, source: { ...LESSON.source, url: "https://x.test/a b.tgz" } }],
        ["a short sha256", { ...LESSON, source: { ...LESSON.source, sha256: "abc" } }],
        ["an upper-case sha256", { ...LESSON, source: { ...LESSON.source, sha256: "E".repeat(64) } }],
        ["a short commit", { ...LESSON, source: { ...LESSON.source, commit: "abc" } }],
        ["a git clone repo instead of a source", { ...LESSON, source: undefined, repo: LESSON.source }],
        ["a compose folder above the repo", { ...LESSON, compose: "../x" }],
        ["an absolute dir", { ...LESSON, dir: "/etc" }],
        ["a project name with spaces", { ...LESSON, project: "a b" }],
        ["a scenario cwd with a drive", { ...LESSON, scenarios: [{ ...SCENARIO, cwd: "C:/x" }] }],
        ["a scenario with a zero timeout", { ...LESSON, scenarios: [{ ...SCENARIO, timeoutMs: 0 }] }],
        [
            "a guard env in lower case",
            { ...LESSON, scenarios: [{ ...SCENARIO, guards: [{ name: "a", env: "x", off: "off" }] }] },
        ],
        [
            "a hidden file above the repo",
            { ...LESSON, scenarios: [{ ...SCENARIO, files: [{ path: "../x.ts", contentBase64: "AA==" }] }] },
        ],
    ])("rejects %s", (_name, payload) => {
        expect(lessonOf(payload)).toBeNull()
    })

    it("reads a source path on StarCi's own origin", () => {
        expect(
            lessonOf({ ...LESSON, source: { ...LESSON.source, url: "/api/relay/lessons/outbox/source.tgz" } }),
        ).not.toBeNull()
    })

    it("reads the hidden scenarios of a challenge tier with their files", () => {
        const hidden = { ...SCENARIO, id: "h1", files: [{ path: "tests/hidden/h1.spec.ts", contentBase64: "aGk=" }] }
        const lesson = lessonOf({ ...LESSON, challenge: { tier: "medium", scenarios: [hidden] } })

        expect(lesson?.challenge?.tier).toBe("medium")
        expect(lesson?.challenge?.scenarios[0]?.files).toEqual([
            { path: "tests/hidden/h1.spec.ts", contentBase64: "aGk=" },
        ])
    })

    it("rejects hidden files over the size limit", () => {
        const big = Buffer.alloc(1_048_577).toString("base64")
        const hidden = { ...SCENARIO, files: [{ path: "a.ts", contentBase64: big }] }

        expect(lessonOf({ ...LESSON, scenarios: [hidden] })).toBeNull()
    })
})
