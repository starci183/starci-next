import { generateKeyPairSync, sign } from "node:crypto"
import { Test } from "@nestjs/testing"
import { ManifestPolicy } from "./manifest.policy"

const KEYS = generateKeyPairSync("ed25519")
const PUBLIC_PEM = KEYS.publicKey.export({ type: "spki", format: "pem" }).toString()
const CHECK = { id: "test", command: "npm test", cwd: ".", timeoutMs: 600_000 }

/** The base64 signature of a payload with the StarCi test key. */
const signatureOf = (payload: string): string =>
    sign(null, Buffer.from(payload, "utf8"), KEYS.privateKey).toString("base64")

/** A signed payload of a manifest body. */
const signed = (body: unknown): [string, string] => {
    const payload = typeof body === "string" ? body : JSON.stringify(body)
    return [payload, signatureOf(payload)]
}

const build = async (): Promise<ManifestPolicy> => {
    const moduleRef = await Test.createTestingModule({ providers: [ManifestPolicy] }).compile()
    return moduleRef.get(ManifestPolicy)
}

describe("ManifestPolicy", () => {
    it("reads the checks of a payload StarCi signed", async () => {
        const policy = await build()
        const [payload, signature] = signed({ manifestId: "m-1", taskId: "task-1", checks: [CHECK] })

        expect(policy.verified(payload, signature, PUBLIC_PEM)).toEqual({
            kind: "verified",
            manifest: { manifestId: "m-1", taskId: "task-1", checks: [CHECK] },
        })
    })

    it("reads the milestone plan of a project run", async () => {
        const policy = await build()
        const plan = { milestone: "bf-data-and-cache", report: "starci/reports/junit.xml", concepts: ["idempotency"] }
        const [payload, signature] = signed({ manifestId: "m-1", taskId: "task-1", checks: [CHECK], plan })

        expect(policy.verified(payload, signature, PUBLIC_PEM)).toEqual({
            kind: "verified",
            manifest: { manifestId: "m-1", taskId: "task-1", checks: [CHECK], plan },
        })
    })

    it.each([
        ["a plan that is not a record", "x"],
        ["a plan without a report", { milestone: "m", concepts: [] }],
        ["a plan whose concepts are not texts", { milestone: "m", report: "r.xml", concepts: [1] }],
    ])("rejects %s even when signed", async (_name, plan) => {
        const policy = await build()
        const [payload, signature] = signed({ manifestId: "m", taskId: "t", checks: [CHECK], plan })

        expect(policy.verified(payload, signature, PUBLIC_PEM).kind).toBe("rejected")
    })

    it("rejects a payload changed after signing, and a signature or key it cannot read", async () => {
        const policy = await build()
        const [payload, signature] = signed({ manifestId: "m-1", taskId: "task-1", checks: [CHECK] })

        expect(policy.verified(payload.replace("npm test", "rm -rf ~"), signature, PUBLIC_PEM)).toEqual({
            kind: "rejected",
            cause: "signature",
        })
        expect(policy.verified(payload, signature, "not a key").kind).toBe("rejected")
    })

    it.each([
        ["a payload that is not JSON", "{"],
        ["a body that is not a manifest", { manifestId: 1 }],
        ["checks that are not a list", { manifestId: "m", taskId: "t", checks: {} }],
        ["a check that is not a record", { manifestId: "m", taskId: "t", checks: [null] }],
        ["a check without a command", { manifestId: "m", taskId: "t", checks: [{ ...CHECK, command: 1 }] }],
        ["a check without a timeout", { manifestId: "m", taskId: "t", checks: [{ ...CHECK, timeoutMs: 0 }] }],
        ["a check above the workspace", { manifestId: "m", taskId: "t", checks: [{ ...CHECK, cwd: "../x" }] }],
        ["a check on an absolute path", { manifestId: "m", taskId: "t", checks: [{ ...CHECK, cwd: "/etc" }] }],
    ])("rejects %s even when signed", async (_name, body) => {
        const policy = await build()
        const [payload, signature] = signed(body)

        expect(policy.verified(payload, signature, PUBLIC_PEM).kind).toBe("rejected")
    })
})
