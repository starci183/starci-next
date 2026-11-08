import { Test } from "@nestjs/testing"
import { Secret } from "@modules/platform/config"
import { IdentityErrorCode } from "./errors/identity.error"
import { deriveKey, keyedDigest, seal, unseal } from "./secret.policy"

const POLICY: unique symbol = Symbol("identity.secret-policy")
const policies = { deriveKey, keyedDigest, seal, unseal }
const SECRET = new Secret("s".repeat(40))

describe("secret policy", () => {
    let subject: typeof policies
    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: POLICY, useFactory: () => policies }],
        }).compile()
        subject = moduleRef.get<typeof policies>(POLICY)
    })

    it("derives distinct stable 256-bit keys per use", () => {
        const sealing = subject.deriveKey(SECRET, "seal")
        expect(sealing).toHaveLength(32)
        expect(subject.deriveKey(SECRET, "seal").equals(sealing)).toBe(true)
        expect(subject.deriveKey(SECRET, "code").equals(sealing)).toBe(false)
        expect(subject.deriveKey(new Secret("t".repeat(40)), "seal").equals(sealing)).toBe(false)
    })

    it("seals a text so that only the same key opens it and each seal differs", () => {
        const key = subject.deriveKey(SECRET, "seal")
        const sealed = subject.seal("refresh-token-value", key)
        expect(sealed.startsWith("v1.")).toBe(true)
        expect(sealed).not.toContain("refresh-token-value")
        expect(subject.seal("refresh-token-value", key)).not.toBe(sealed)
        expect(subject.unseal(sealed, key)).toBe("refresh-token-value")
    })

    it("refuses a value sealed under another key", () => {
        const sealed = subject.seal("x", subject.deriveKey(SECRET, "code"))
        expect(() => subject.unseal(sealed, subject.deriveKey(SECRET, "seal"))).toThrow(
            IdentityErrorCode.SessionUnavailable,
        )
    })

    it("refuses an altered value", () => {
        const key = subject.deriveKey(SECRET, "seal")
        const sealed = subject.seal("x", key)
        const flipped = `${sealed.slice(0, 10)}${sealed[10] === "A" ? "B" : "A"}${sealed.slice(11)}`
        expect(() => subject.unseal(flipped, key)).toThrow(IdentityErrorCode.SessionUnavailable)
    })

    it("refuses an unknown version and a value without a body", () => {
        const key = subject.deriveKey(SECRET, "seal")
        expect(() => subject.unseal(subject.seal("x", key).replace("v1.", "v2."), key)).toThrow(
            IdentityErrorCode.SessionUnavailable,
        )
        expect(() => subject.unseal("v1", key)).toThrow(IdentityErrorCode.SessionUnavailable)
    })

    it("keys a digest by scope and value", () => {
        const key = subject.deriveKey(SECRET, "code")
        const digest = subject.keyedDigest(key, "challenge-1", "123456")
        expect(digest).toMatch(/^[0-9a-f]{64}$/)
        expect(subject.keyedDigest(key, "challenge-1", "123456")).toBe(digest)
        expect(subject.keyedDigest(key, "challenge-2", "123456")).not.toBe(digest)
        expect(subject.keyedDigest(key, "challenge-1", "654321")).not.toBe(digest)
    })
})
