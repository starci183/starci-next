import { createHash } from "node:crypto"

/**
 * The one grading result both halves of the lab relay are proved against: the learner CLI signs `GRADE_FIXTURE_CANONICAL` and the relay
 * verifies the canonical JSON it builds from the same facts. Written out by hand, not built by either implementation, so a change to
 * one side's key order, spacing or fields breaks its spec instead of passing silently.
 */
export const GRADE_FIXTURE = {
    submissionId: "7a1b2c3d-1111-4222-8333-444455556666",
    nonce: "a".repeat(64),
    commit: "b".repeat(40),
    tests: [
        { id: "h-order-total", passed: true, durationMs: 12, message: "" },
        { id: "h-stock-never-negative", passed: false, durationMs: 40, message: 'expected "0", got -1: tồn kho âm' },
    ],
} as const

/** The key-sorted canonical JSON of `{submissionId, nonce, commit, tests: [{id, passed, durationMs, message}]}` for the fixture. */
export const GRADE_FIXTURE_CANONICAL: string =
    `{"commit":"${"b".repeat(40)}","nonce":"${"a".repeat(64)}","submissionId":"7a1b2c3d-1111-4222-8333-444455556666",` +
    '"tests":[{"durationMs":12,"id":"h-order-total","message":"","passed":true},' +
    '{"durationMs":40,"id":"h-stock-never-negative","message":"expected \\"0\\", got -1: tồn kho âm","passed":false}]}'

/** The text of the one hidden file of the manifest fixture. */
export const LAB_HIDDEN_TEXT = "test('[scenario:h-b] hidden', () => {})"

/**
 * The `lab` section of a grade manifest as it travels, written out by hand: the relay's signed payload must equal it and the learner CLI
 * must read it whole, so a name one side changes (a key, a nesting, a route) breaks that side's spec instead of the lab at run time.
 */
export const LAB_MANIFEST_FIXTURE = {
    courseId: "shop",
    lessonId: "oversell",
    source: { url: "/api/relay/courses/shop/oversell/bugs.tgz", sha256: "c".repeat(64), commit: "d".repeat(40) },
    solution: { url: "/api/relay/courses/shop/oversell/solution.tgz", sha256: "e".repeat(64), commit: "d".repeat(40) },
    dir: "app",
    compose: "docker-compose.yml",
    project: "starci-shop-oversell",
    services: ["api", "db"],
    test: {
        command: "npm test",
        scenario: "npm test -- --scenario {id}",
        report: "reports/junit.xml",
        timeoutMs: 120_000,
    },
    files: ["src/order.ts"],
    chaos: [
        { id: "slow-db", on: "node chaos.js slow-db on", off: "node chaos.js slow-db off" },
        { id: "no-retry", on: "node chaos.js no-retry on", off: "node chaos.js no-retry off" },
    ],
    chaosOn: ["slow-db"],
    action: "grade",
    grade: {
        submissionId: "7a1b2c3d-1111-4222-8333-444455556666",
        nonce: "a".repeat(64),
        command: "npm run grade",
        seedOrder: ["h-b", "h-a"],
        commit: "b".repeat(40),
        files: [
            {
                path: "grader/order.spec.ts",
                sha256: createHash("sha256").update(LAB_HIDDEN_TEXT, "utf8").digest("hex"),
                content: Buffer.from(LAB_HIDDEN_TEXT, "utf8").toString("base64"),
            },
        ],
    },
}
