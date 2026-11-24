import { createHash, generateKeyPairSync, sign, type KeyObject } from "node:crypto"
import { Test } from "@nestjs/testing"
import {
    GRADE_FIXTURE,
    GRADE_FIXTURE_CANONICAL,
    LAB_HIDDEN_TEXT,
    LAB_MANIFEST_FIXTURE,
} from "@tests/fixtures/builders/relay-lab.builder"
import type { RelayUpload } from "./relay-feed.contracts"
import { manifestPayloadOf, publicKeyPemOf, signManifest, signingKeyOf, uploadValid } from "./relay-feed.policy"
import type {
    RelayLabContract,
    RelayLabFile,
    RelayLabFileFact,
    RelayLabGradeFacts,
    RelayLabHiddenFile,
} from "./relay-lab.contracts"
import {
    LAB_FILE_TEXT_MAX_BYTES,
    canonicalJson,
    chaosOnOf,
    deviceKeyValid,
    gradePayloadOf,
    gradeSectionOf,
    gradeSignatureValid,
    gradeVerdictOf,
    hiddenFilesValid,
    labArchiveOf,
    labArchivePathOf,
    labIdsOfTask,
    labPhaseOf,
    labSectionOf,
    labSourceOf,
    logTailOf,
    mergedLabFilesOf,
    nonceOf,
    normalizedPairCode,
    pairCodeDigestOf,
    pairCodeOf,
    seedOrderOf,
} from "./relay-lab.policy"

const POLICY: unique symbol = Symbol("spec.relay-lab-policy")
const policy = {
    canonicalJson,
    chaosOnOf,
    deviceKeyValid,
    gradePayloadOf,
    gradeSectionOf,
    gradeSignatureValid,
    gradeVerdictOf,
    hiddenFilesValid,
    labArchiveOf,
    labArchivePathOf,
    labIdsOfTask,
    labPhaseOf,
    labSectionOf,
    labSourceOf,
    logTailOf,
    manifestPayloadOf,
    mergedLabFilesOf,
    nonceOf,
    normalizedPairCode,
    pairCodeDigestOf,
    pairCodeOf,
    seedOrderOf,
    signManifest,
    signingKeyOf,
    uploadValid,
}

const build = async (): Promise<typeof policy> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policy }],
    }).compile()
    return moduleRef.get(POLICY)
}

const LEARNER = "b8099f0e-58c7-4685-8292-f3a49ec994b1"
const OTHER_LEARNER = "c9199f0e-58c7-4685-8292-f3a49ec994b2"
const SUBMISSION = "7a1b2c3d-1111-4222-8333-444455556666"
const NONCE = "a".repeat(64)
const COMMIT = "b".repeat(40)
const HIDDEN = ["h-order-total", "h-stock-never-negative", "h-idempotent-pay"]
const EVENT = "0c9a2b1e-9a2c-4b6e-8f1a-2b3c4d5e6f70"
const RUNNING = { learnerId: LEARNER, nonce: NONCE, status: "running" }

interface Device {
    readonly privateKey: KeyObject
    readonly publicKey: string
}

/** A device key pair as the CLI registers it: the base64 SPKI (DER) public half. */
const deviceOf = (): Device => {
    const pair = generateKeyPairSync("ed25519")
    return {
        privateKey: pair.privateKey,
        publicKey: pair.publicKey.export({ type: "spki", format: "der" }).toString("base64"),
    }
}

const testsOf = (ids: ReadonlyArray<string>, passed = true) =>
    ids.map((id) => ({ id, passed, durationMs: 12, message: passed ? "" : "expected 3, received 2" }))

/** A grading result signed by the device over the canonical text, as the CLI does. */
const signedFacts = (
    device: Device,
    overrides: Partial<Omit<RelayLabGradeFacts, "signature">> = {},
): RelayLabGradeFacts => {
    const unsigned = {
        submissionId: SUBMISSION,
        nonce: NONCE,
        commit: COMMIT,
        tests: testsOf(HIDDEN),
        ...overrides,
    }
    const signature = sign(null, Buffer.from(gradePayloadOf({ ...unsigned, signature: "" }), "utf8"), device.privateKey)
    return { ...unsigned, signature: signature.toString("base64") }
}

describe("relay lab grade verdict", () => {
    it("accepts a result the device signed over the submission's own nonce, covering every hidden test once", async () => {
        const { gradeVerdictOf: verdict } = await build()
        const device = deviceOf()

        expect(
            verdict({
                facts: signedFacts(device),
                submission: RUNNING,
                deviceLearnerId: LEARNER,
                deviceKey: device.publicKey,
                hiddenIds: HIDDEN,
            }),
        ).toEqual({ kind: "accepted", passed: true })
    })

    it("accepts a result with a red test as graded and not passed", async () => {
        const { gradeVerdictOf: verdict } = await build()
        const device = deviceOf()
        const facts = signedFacts(device, {
            tests: [...testsOf(HIDDEN.slice(0, 2)), ...testsOf(HIDDEN.slice(2), false)],
        })

        expect(
            verdict({
                facts,
                submission: RUNNING,
                deviceLearnerId: LEARNER,
                deviceKey: device.publicKey,
                hiddenIds: HIDDEN,
            }),
        ).toEqual({ kind: "accepted", passed: false })
    })

    it("rejects a signature made by another key", async () => {
        const { gradeVerdictOf: verdict } = await build()
        const registered = deviceOf()
        const forger = deviceOf()

        expect(
            verdict({
                facts: signedFacts(forger),
                submission: RUNNING,
                deviceLearnerId: LEARNER,
                deviceKey: registered.publicKey,
                hiddenIds: HIDDEN,
            }),
        ).toEqual({ kind: "rejected", reason: "signature-invalid" })
    })

    it("rejects a result whose tests were changed after signing", async () => {
        const { gradeVerdictOf: verdict } = await build()
        const device = deviceOf()
        const honest = signedFacts(device, { tests: testsOf(HIDDEN, false) })
        const tampered = { ...honest, tests: testsOf(HIDDEN, true) }

        expect(
            verdict({
                facts: tampered,
                submission: RUNNING,
                deviceLearnerId: LEARNER,
                deviceKey: device.publicKey,
                hiddenIds: HIDDEN,
            }),
        ).toEqual({ kind: "rejected", reason: "signature-invalid" })
    })

    it("rejects a nonce that is not the submission's, even when it is signed", async () => {
        const { gradeVerdictOf: verdict } = await build()
        const device = deviceOf()

        expect(
            verdict({
                facts: signedFacts(device, { nonce: "c".repeat(64) }),
                submission: RUNNING,
                deviceLearnerId: LEARNER,
                deviceKey: device.publicKey,
                hiddenIds: HIDDEN,
            }),
        ).toEqual({ kind: "rejected", reason: "nonce-mismatch" })
    })

    it("refuses, without rejecting, a submission that belongs to another learner", async () => {
        const { gradeVerdictOf: verdict } = await build()
        const device = deviceOf()

        expect(
            verdict({
                facts: signedFacts(device),
                submission: RUNNING,
                deviceLearnerId: OTHER_LEARNER,
                deviceKey: device.publicKey,
                hiddenIds: HIDDEN,
            }),
        ).toEqual({ kind: "foreign" })
    })

    it.each(["queued", "graded", "rejected"])(
        "rejects a result for a submission that is %s, not running",
        async (status) => {
            const { gradeVerdictOf: verdict } = await build()
            const device = deviceOf()

            expect(
                verdict({
                    facts: signedFacts(device),
                    submission: { ...RUNNING, status },
                    deviceLearnerId: LEARNER,
                    deviceKey: device.publicKey,
                    hiddenIds: HIDDEN,
                }),
            ).toEqual({ kind: "rejected", reason: "not-running" })
        },
    )

    it.each(["abc", "B".repeat(40), "b".repeat(39), "b".repeat(41), ""])(
        "rejects the commit %j that is not 40 lowercase hex",
        async (commit) => {
            const { gradeVerdictOf: verdict } = await build()
            const device = deviceOf()

            expect(
                verdict({
                    facts: signedFacts(device, { commit }),
                    submission: RUNNING,
                    deviceLearnerId: LEARNER,
                    deviceKey: device.publicKey,
                    hiddenIds: HIDDEN,
                }),
            ).toEqual({ kind: "rejected", reason: "commit-invalid" })
        },
    )

    it("rejects a result from a device that registered no key", async () => {
        const { gradeVerdictOf: verdict } = await build()

        expect(
            verdict({
                facts: signedFacts(deviceOf()),
                submission: RUNNING,
                deviceLearnerId: LEARNER,
                deviceKey: null,
                hiddenIds: HIDDEN,
            }),
        ).toEqual({ kind: "rejected", reason: "device-key-missing" })
    })

    it.each([
        ["a hidden test id missing", HIDDEN.slice(0, 2)],
        ["a hidden test id twice", [...HIDDEN, HIDDEN[0] ?? ""]],
        ["an id that is not hidden", [...HIDDEN.slice(0, 2), "h-unknown"]],
        ["no test at all", []],
    ])("rejects a validly signed result with %s", async (_case, ids) => {
        const { gradeVerdictOf: verdict } = await build()
        const device = deviceOf()

        expect(
            verdict({
                facts: signedFacts(device, { tests: testsOf(ids) }),
                submission: RUNNING,
                deviceLearnerId: LEARNER,
                deviceKey: device.publicKey,
                hiddenIds: HIDDEN,
            }),
        ).toEqual({ kind: "rejected", reason: "tests-mismatch" })
    })

    it("rejects every result of a lab that holds no hidden test", async () => {
        const { gradeVerdictOf: verdict } = await build()
        const device = deviceOf()

        expect(
            verdict({
                facts: signedFacts(device, { tests: [] }),
                submission: RUNNING,
                deviceLearnerId: LEARNER,
                deviceKey: device.publicKey,
                hiddenIds: [],
            }),
        ).toEqual({ kind: "rejected", reason: "tests-mismatch" })
    })
})

describe("relay lab grade signature fixture shared with the learner CLI", () => {
    it("builds the canonical text the CLI signs from the same facts, byte for byte", async () => {
        const { gradePayloadOf: payload } = await build()

        expect(payload({ ...GRADE_FIXTURE, tests: [...GRADE_FIXTURE.tests], signature: "" })).toBe(
            GRADE_FIXTURE_CANONICAL,
        )
    })

    it("verifies a signature made over the fixture text, and not one made over anything else", async () => {
        const { gradeSignatureValid: valid } = await build()
        const device = deviceOf()
        const signed = (text: string): RelayLabGradeFacts => ({
            ...GRADE_FIXTURE,
            tests: [...GRADE_FIXTURE.tests],
            signature: sign(null, Buffer.from(text, "utf8"), device.privateKey).toString("base64"),
        })

        expect(valid(device.publicKey, signed(GRADE_FIXTURE_CANONICAL))).toBe(true)
        expect(
            valid(device.publicKey, signed(GRADE_FIXTURE_CANONICAL.replace('"passed":false', '"passed":true'))),
        ).toBe(false)
        expect(valid(device.publicKey, signed(`${GRADE_FIXTURE_CANONICAL} `))).toBe(false)
    })

    it("leaves the test name out of the signed text, since the machine uploads a name the relay never reads", async () => {
        const { gradePayloadOf: payload } = await build()
        const named = GRADE_FIXTURE.tests.map((test) => ({ ...test, name: "a hidden test title" }))

        expect(payload({ ...GRADE_FIXTURE, tests: named as never, signature: "" })).toBe(GRADE_FIXTURE_CANONICAL)
    })
})

describe("relay lab canonical text and keys", () => {
    it("canonicalises with sorted keys and no whitespace, whatever order the object was built in", async () => {
        const { canonicalJson: canonical } = await build()

        expect(canonical({ b: 1, a: [{ d: true, c: null }], e: "x" })).toBe('{"a":[{"c":null,"d":true}],"b":1,"e":"x"}')
        expect(canonical({ a: 1, b: 2 })).toBe(canonical({ b: 2, a: 1 }))
    })

    it("signs the canonical JSON of submission, nonce, commit and tests", async () => {
        const { gradePayloadOf: payload } = await build()
        const facts = signedFacts(deviceOf(), { tests: testsOf(["t1"]) })

        expect(payload(facts)).toBe(
            `{"commit":"${COMMIT}","nonce":"${NONCE}","submissionId":"${SUBMISSION}","tests":[{"durationMs":12,"id":"t1","message":"","passed":true}]}`,
        )
    })

    it("accepts only a base64 SPKI Ed25519 public key", async () => {
        const { deviceKeyValid: valid } = await build()

        expect(valid(deviceOf().publicKey)).toBe(true)
        expect(valid("not a key")).toBe(false)
        expect(valid("")).toBe(false)
        const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 }).publicKey.export({
            type: "spki",
            format: "der",
        })
        expect(valid(rsa.toString("base64"))).toBe(false)
    })
})

describe("relay lab seed order and nonce", () => {
    it("shuffles the hidden test ids into a permutation of them", async () => {
        const { seedOrderOf: order } = await build()
        const ids = Array.from({ length: 20 }, (_, index) => `h-${index}`)

        const first = order(ids)
        const second = order(ids)

        expect([...first].sort()).toEqual([...ids].sort())
        expect(first).not.toEqual(second)
        expect(ids[0]).toBe("h-0")
    })

    it("mints a different 256-bit hex nonce every time", async () => {
        const { nonceOf: nonce } = await build()

        const first = nonce()

        expect(first).toMatch(/^[0-9a-f]{64}$/u)
        expect(first).not.toBe(nonce())
    })
})

describe("relay lab pairing code", () => {
    it("issues six digits and keeps the leading zeros", async () => {
        const { pairCodeOf: code } = await build()

        for (let count = 0; count < 50; count += 1) expect(code()).toMatch(/^\d{6}$/u)
    })

    it("reads a typed code with spaces or a dash and refuses anything that is not six digits", async () => {
        const { normalizedPairCode: normalized } = await build()

        expect(normalized("123 456")).toBe("123456")
        expect(normalized("123-456")).toBe("123456")
        expect(normalized("000042")).toBe("000042")
        expect(normalized("12345")).toBeNull()
        expect(normalized("1234567")).toBeNull()
        expect(normalized("12a456")).toBeNull()
    })

    it("stores a code only as a digest that is not the code", async () => {
        const { pairCodeDigestOf: digest } = await build()

        expect(digest("123456")).toMatch(/^[0-9a-f]{64}$/u)
        expect(digest("123456")).not.toContain("123456")
        expect(digest("123456")).toBe(digest("123456"))
        expect(digest("123456")).not.toBe(digest("123457"))
    })
})

const labUpload = (overrides: Partial<RelayUpload>): RelayUpload => ({
    eventId: EVENT,
    kind: "lab.files",
    taskId: "course:shop/oversell",
    runId: "run-1",
    ...overrides,
})

const textOf = (bytes: number): string => "a".repeat(bytes)

describe("relay lab upload validity", () => {
    it("takes a file text of exactly 64 KiB and refuses one byte more", async () => {
        const { uploadValid: valid } = await build()
        const file = (text: string | null): RelayUpload =>
            labUpload({
                labFiles: { commit: COMMIT, files: [{ path: "src/order.ts", sha256: "d".repeat(64), text }] },
            })

        expect(valid(file(textOf(LAB_FILE_TEXT_MAX_BYTES)))).toBe(true)
        expect(valid(file(textOf(LAB_FILE_TEXT_MAX_BYTES + 1)))).toBe(false)
        expect(valid(file(null))).toBe(true)
    })

    it("counts the cap in UTF-8 bytes, not characters", async () => {
        const { uploadValid: valid } = await build()
        const file = (text: string): RelayUpload =>
            labUpload({ labFiles: { commit: COMMIT, files: [{ path: "a.ts", sha256: "d".repeat(64), text }] } })

        expect(valid(file("é".repeat(LAB_FILE_TEXT_MAX_BYTES / 2)))).toBe(true)
        expect(valid(file("é".repeat(LAB_FILE_TEXT_MAX_BYTES / 2 + 1)))).toBe(false)
    })

    it.each(["../etc/passwd", "/abs/path", "a/../../b", ""])("refuses the file path %j", async (path) => {
        const { uploadValid: valid } = await build()

        expect(
            valid(labUpload({ labFiles: { commit: COMMIT, files: [{ path, sha256: "d".repeat(64), text: "x" }] } })),
        ).toBe(false)
    })

    it("bounds the boot detail at 300 characters and the test message at 1000", async () => {
        const { uploadValid: valid } = await build()
        const boot = (detail: string): RelayUpload =>
            labUpload({ kind: "lab.boot", boot: { stage: "clone", status: "running", detail, durationMs: 5 } })
        const tests = (message: string): RelayUpload =>
            labUpload({
                kind: "lab.tests",
                labTests: {
                    commit: COMMIT,
                    chaosOn: [],
                    tests: [{ id: "t1", name: "adds", passed: false, durationMs: 1, message }],
                },
            })

        expect(valid(boot("d".repeat(300)))).toBe(true)
        expect(valid(boot("d".repeat(301)))).toBe(false)
        expect(valid(tests("m".repeat(1000)))).toBe(true)
        expect(valid(tests("m".repeat(1001)))).toBe(false)
    })

    it("takes a lab kind only on a lab task, and only logs, acks and lab kinds on a lab task", async () => {
        const { uploadValid: valid } = await build()
        const boot = { stage: "seed" as const, status: "done" as const, detail: "ok", durationMs: 1 }

        expect(valid(labUpload({ kind: "lab.boot", boot }))).toBe(true)
        expect(valid(labUpload({ kind: "lab.boot", boot, taskId: "lesson:outbox" }))).toBe(false)
        expect(valid(labUpload({ kind: "check.started", checkId: "test" }))).toBe(false)
        expect(valid(labUpload({ kind: "check.result", checkId: "test", passed: true }))).toBe(false)
        expect(valid(labUpload({ kind: "log", checkId: "api", text: "listening" }))).toBe(true)
    })

    it("refuses a lab kind without its facts and a grade with a bad nonce or too many tests", async () => {
        const { uploadValid: valid } = await build()
        const grade = (overrides: Partial<RelayLabGradeFacts>): RelayUpload =>
            labUpload({
                kind: "lab.grade",
                grade: {
                    submissionId: SUBMISSION,
                    nonce: NONCE,
                    commit: COMMIT,
                    tests: [],
                    signature: "c2ln",
                    ...overrides,
                },
            })

        expect(valid(labUpload({ kind: "lab.boot" }))).toBe(false)
        expect(valid(grade({}))).toBe(true)
        expect(valid(grade({ nonce: "short" }))).toBe(false)
        expect(valid(grade({ tests: testsOf(Array.from({ length: 201 }, (_, index) => `t${index}`)) }))).toBe(false)
    })
})

describe("relay lab task, phase and tails", () => {
    it("reads a lab task id and refuses any other shape", async () => {
        const { labIdsOfTask: ids } = await build()

        expect(ids("course:shop/oversell")).toEqual({ courseId: "shop", lessonId: "oversell" })
        expect(ids("course:shop")).toBeNull()
        expect(ids("course:shop/a/b")).toBeNull()
        expect(ids("course:Shop/oversell")).toBeNull()
        expect(ids("lesson:oversell")).toBeNull()
    })

    it("says setup with nothing reported, booting while stages run and ready once the first run is done", async () => {
        const { labPhaseOf: phase } = await build()

        expect(phase([])).toBe("setup")
        expect(phase([{ stage: "clone", status: "running" }])).toBe("booting")
        expect(phase([{ stage: "first-run", status: "failed" }])).toBe("booting")
        expect(phase([{ stage: "first-run", status: "done" }])).toBe("ready")
    })

    it("keeps the last 200 lines of a service across chunks", async () => {
        const { logTailOf: tail } = await build()
        const chunks = [
            Array.from({ length: 150 }, (_, index) => `line ${index}`).join("\n"),
            Array.from({ length: 150 }, (_, index) => `line ${150 + index}`).join("\n"),
        ]

        const lines = tail(chunks)

        expect(lines).toHaveLength(200)
        expect(lines[0]).toBe("line 100")
        expect(lines[199]).toBe("line 299")
    })
})

const CONTRACT: RelayLabContract = {
    lab: "shop-oversell",
    branch: "oversell",
    commit: null,
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
        {
            id: "slow-db",
            on: "node chaos.js slow-db on",
            off: "node chaos.js slow-db off",
            label: { vi: "Cơ sở dữ liệu chậm", en: "Database slow" },
        },
        {
            id: "no-retry",
            on: "node chaos.js no-retry on",
            off: "node chaos.js no-retry off",
            label: { vi: "Không thử lại", en: "No retry" },
        },
    ],
    tests: [{ id: "t-1", name: { vi: "tạo đơn hàng", en: "creates an order" } }],
    grading: { command: "npm run grade", into: "grader/", scenarios: ["h-b", "h-a"] },
}

const LINKS = {
    source: { url: "/api/relay/courses/shop/oversell/bugs.tgz", sha256: "c".repeat(64), commit: "d".repeat(40) },
}

describe("relay lab manifest", () => {
    it("signs the lab section with the tarball link, the compose project, the chaos commands and the action", async () => {
        const p = await build()
        const key = p.signingKeyOf(null)
        const lab = p.labSectionOf({ courseId: "shop", lessonId: "oversell" }, CONTRACT, LINKS, "test", ["slow-db"])

        const signed = p.signManifest(
            {
                manifestId: "m-1",
                taskId: "course:shop/oversell",
                learnerId: LEARNER,
                deviceId: "11111111-1111-4111-8111-111111111111",
                issuedAt: "2026-11-25T02:00:00.000Z",
                checks: [],
                lab,
            },
            key,
        )

        const parsed: { lab: Record<string, unknown> } = JSON.parse(p.manifestPayloadOf(signed.body))
        expect(parsed.lab).toMatchObject({
            courseId: "shop",
            lessonId: "oversell",
            project: "starci-shop-oversell",
            dir: "app",
            compose: "docker-compose.yml",
            chaosOn: ["slow-db"],
            action: "test",
            source: LINKS.source,
            test: { command: "npm test", scenario: "npm test -- --scenario {id}", report: "reports/junit.xml" },
            chaos: [
                { id: "slow-db", on: "node chaos.js slow-db on", off: "node chaos.js slow-db off" },
                { id: "no-retry", on: "node chaos.js no-retry on", off: "node chaos.js no-retry off" },
            ],
        })
        expect(parsed.lab).not.toHaveProperty("grade")
        expect(parsed.lab).not.toHaveProperty("solution")
        expect(parsed.lab).not.toHaveProperty("repo")
        expect(JSON.stringify(parsed.lab)).not.toContain("Database slow")
        expect(signed.payload).toBe(p.manifestPayloadOf(signed.body))
        expect(publicKeyPemOf(key)).toContain("PUBLIC KEY")
    })

    it("signs exactly the lab section the learner CLI reads, name for name (the fixture both specs share)", async () => {
        const p = await build()
        const grade = p.gradeSectionOf({
            submissionId: LAB_MANIFEST_FIXTURE.grade.submissionId,
            nonce: LAB_MANIFEST_FIXTURE.grade.nonce,
            command: "npm run grade",
            seedOrder: ["h-b", "h-a"],
            commit: COMMIT,
            hidden: [
                {
                    path: "grader/order.spec.ts",
                    sha256: createHash("sha256").update(LAB_HIDDEN_TEXT).digest("hex"),
                    text: LAB_HIDDEN_TEXT,
                },
            ],
        })
        const lab = p.labSectionOf(
            { courseId: "shop", lessonId: "oversell" },
            CONTRACT,
            { ...LINKS, solution: LAB_MANIFEST_FIXTURE.solution },
            "grade",
            ["slow-db"],
            grade,
        )

        const signed = p.signManifest(
            {
                manifestId: "m-3",
                taskId: "course:shop/oversell",
                learnerId: LEARNER,
                deviceId: "11111111-1111-4111-8111-111111111111",
                issuedAt: "2026-11-25T02:00:00.000Z",
                checks: [],
                lab,
            },
            p.signingKeyOf(null),
        )

        expect((JSON.parse(signed.payload) as { lab: unknown }).lab).toEqual(LAB_MANIFEST_FIXTURE)
    })

    it("carries the solution link only when it is given", async () => {
        const p = await build()
        const solution = {
            url: "/api/relay/courses/shop/oversell/solution.tgz",
            sha256: "e".repeat(64),
            commit: "d".repeat(40),
        }

        const lab = p.labSectionOf(
            { courseId: "shop", lessonId: "oversell" },
            CONTRACT,
            { ...LINKS, solution },
            "boot",
            [],
        )
        const signed = p.signManifest(
            {
                manifestId: "m-2",
                taskId: "course:shop/oversell",
                learnerId: LEARNER,
                deviceId: "11111111-1111-4111-8111-111111111111",
                issuedAt: "2026-11-25T02:00:00.000Z",
                checks: [],
                lab,
            },
            p.signingKeyOf(null),
        )

        expect((JSON.parse(signed.payload) as { lab: { solution: unknown } }).lab.solution).toEqual(solution)
    })

    it("turns on only the chaos switches the lab names, in the lab's order", async () => {
        const { chaosOnOf: chaosOn } = await build()

        expect(chaosOn(CONTRACT, ["no-retry", "slow-db"])).toEqual(["slow-db", "no-retry"])
        expect(chaosOn(CONTRACT, [])).toEqual([])
        expect(chaosOn(CONTRACT, ["slow-db", "made-up"])).toBeNull()
    })

    it("carries the hidden files as base64 in the grade section only, with the command, the random order and the nonce", async () => {
        const p = await build()
        const text = "test('hidden', () => {})"
        const hidden: ReadonlyArray<RelayLabHiddenFile> = [
            { path: "grader/order.spec.ts", sha256: createHash("sha256").update(text).digest("hex"), text },
        ]
        const grade = p.gradeSectionOf({
            submissionId: SUBMISSION,
            nonce: NONCE,
            command: "npm run grade",
            seedOrder: ["h-b", "h-a"],
            commit: COMMIT,
            hidden,
        })

        const lab = p.labSectionOf({ courseId: "shop", lessonId: "oversell" }, CONTRACT, LINKS, "grade", [], grade)

        expect(lab.grade).toMatchObject({
            submissionId: SUBMISSION,
            nonce: NONCE,
            command: "npm run grade",
            seedOrder: ["h-b", "h-a"],
            commit: COMMIT,
        })
        expect(Buffer.from(lab.grade?.files[0]?.content ?? "", "base64").toString("utf8")).toBe(text)
    })

    it("accepts hidden files only under the grading folder, with a matching hash, inside the lab folder", async () => {
        const p = await build()
        const file = (path: string, text = "x"): RelayLabHiddenFile => ({
            path,
            sha256: createHash("sha256").update(text).digest("hex"),
            text,
        })
        const grading = CONTRACT.grading

        expect(p.hiddenFilesValid([file("grader/a.spec.ts"), file("grader/deep/b.spec.ts")], grading)).toBe(true)
        expect(
            p.hiddenFilesValid([file("grader/a.spec.ts")], { command: "npm run grade", into: "grader", scenarios: [] }),
        ).toBe(true)
        expect(p.hiddenFilesValid([{ ...file("grader/a.spec.ts"), sha256: "0".repeat(64) }], grading)).toBe(false)
        expect(p.hiddenFilesValid([file("../escape.ts")], grading)).toBe(false)
        expect(p.hiddenFilesValid([file("grader/../../escape.ts")], grading)).toBe(false)
        expect(p.hiddenFilesValid([file("/grader/a.ts")], grading)).toBe(false)
        expect(p.hiddenFilesValid([file("src/order.ts")], grading)).toBe(false)
        expect(p.hiddenFilesValid([file("grader-other/a.ts")], grading)).toBe(false)
        expect(p.hiddenFilesValid([file("grader/")], grading)).toBe(false)
        expect(p.hiddenFilesValid([file("grader/a.spec.ts")], null)).toBe(false)
    })
})

describe("relay lab tarball", () => {
    const files: ReadonlyArray<RelayLabFile> = [
        { path: "src/order.ts", text: "export const order = 1\n" },
        { path: "docker-compose.yml", text: "services: {}\n" },
    ]

    it("makes the same bytes and the same hash whatever order the files come in", async () => {
        const p = await build()

        const forward = p.labArchiveOf(CONTRACT, files)
        const backward = p.labArchiveOf(CONTRACT, [...files].reverse())

        expect(forward).not.toBeNull()
        expect(forward?.sha256).toBe(backward?.sha256)
        expect(forward?.content.equals(backward?.content ?? Buffer.alloc(0))).toBe(true)
        expect(forward?.sha256).toBe(
            createHash("sha256")
                .update(forward?.content ?? Buffer.alloc(0))
                .digest("hex"),
        )
    })

    it("pins the contract's commit when it has one, else a 40-hex hash of the tarball", async () => {
        const p = await build()

        expect(p.labArchiveOf({ ...CONTRACT, commit: "f".repeat(40) }, files)?.commit).toBe("f".repeat(40))
        expect(p.labArchiveOf(CONTRACT, files)?.commit).toMatch(/^[0-9a-f]{40}$/u)
        expect(p.labArchiveOf(CONTRACT, files)?.commit).toBe(p.labArchiveOf(CONTRACT, files)?.commit)
    })

    it.each([
        ["an empty cut", []],
        ["a path above the folder", [{ path: "../x", text: "x" }]],
        ["an absolute path", [{ path: "/etc/x", text: "x" }]],
        ["a backslash path", [{ path: "a\\b", text: "x" }]],
        ["a path inside .git", [{ path: ".git/config", text: "x" }]],
        ["a hidden folder", [{ path: "hidden/t.ts", text: "x" }]],
        [
            "a repeated path",
            [
                { path: "a.ts", text: "x" },
                { path: "a.ts", text: "y" },
            ],
        ],
    ])("refuses to cut %s", async (_name, cut) => {
        const p = await build()

        expect(p.labArchiveOf(CONTRACT, cut)).toBeNull()
    })

    it("routes the two cuts under the course and lesson, and links a tarball by route, hash and commit", async () => {
        const p = await build()
        const archive = p.labArchiveOf(CONTRACT, files)

        expect(p.labArchivePathOf("shop", "oversell", "bugs")).toBe("/api/relay/courses/shop/oversell/bugs.tgz")
        expect(p.labArchivePathOf("shop", "oversell", "solution")).toBe("/api/relay/courses/shop/oversell/solution.tgz")
        expect(p.labSourceOf({ courseId: "shop", lessonId: "oversell" }, "solution", archive as never)).toEqual({
            url: "/api/relay/courses/shop/oversell/solution.tgz",
            sha256: archive?.sha256,
            commit: archive?.commit,
        })
    })
})

describe("relay lab mirrored files", () => {
    const fact = (path: string, text: string | null, sha: string): RelayLabFileFact => ({
        path,
        text,
        sha256: sha.repeat(64),
    })

    it("replaces the paths an upload names and keeps every other held file, in path order", async () => {
        const { mergedLabFilesOf: merge } = await build()
        const held = [fact("src/b.ts", "old b", "1"), fact("src/a.ts", "old a", "2"), fact("src/c.ts", "old c", "3")]

        const merged = merge(held, [fact("src/b.ts", "new b", "4"), fact("src/d.ts", "new d", "5")])

        expect(merged.map((file) => [file.path, file.text])).toEqual([
            ["src/a.ts", "old a"],
            ["src/b.ts", "new b"],
            ["src/c.ts", "old c"],
            ["src/d.ts", "new d"],
        ])
    })

    it("starts from nothing and takes an upload that names no file as no change", async () => {
        const { mergedLabFilesOf: merge } = await build()
        const held = [fact("src/a.ts", "a", "1")]

        expect(merge([], held)).toEqual(held)
        expect(merge(held, [])).toEqual(held)
    })
})
