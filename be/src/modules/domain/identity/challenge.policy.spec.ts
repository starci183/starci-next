import { Test } from "@nestjs/testing"
import {
    challengeExpiry,
    codeDigest,
    generateCode,
    maskEmail,
    minutesLeft,
    normalizeEmail,
    passwordAcceptable,
    usernameAcceptable,
} from "./challenge.policy"

const POLICY: unique symbol = Symbol("identity.challenge-policy")
const policies = {
    challengeExpiry,
    codeDigest,
    generateCode,
    maskEmail,
    minutesLeft,
    normalizeEmail,
    passwordAcceptable,
    usernameAcceptable,
}
const NOW = new Date("2026-01-01T00:00:00.000Z")

describe("challenge policy", () => {
    let subject: typeof policies
    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: POLICY, useFactory: () => policies }],
        }).compile()
        subject = moduleRef.get<typeof policies>(POLICY)
    })

    it("draws six-digit codes, zero padded", () => {
        for (let draw = 0; draw < 50; draw += 1) expect(subject.generateCode()).toMatch(/^\d{6}$/)
    })

    it("keys the code digest by challenge and code", () => {
        const key = Buffer.alloc(32, 1)
        const digest = subject.codeDigest(key, "challenge", "123456")
        expect(digest).toMatch(/^[0-9a-f]{64}$/)
        expect(subject.codeDigest(key, "challenge", "123456")).toBe(digest)
        expect(subject.codeDigest(key, "other", "123456")).not.toBe(digest)
        expect(subject.codeDigest(key, "challenge", "123457")).not.toBe(digest)
    })

    it("normalizes and masks emails", () => {
        expect(subject.normalizeEmail("  Ada@Example.COM ")).toBe("ada@example.com")
        expect(subject.maskEmail("ada@example.com")).toBe("a***@example.com")
        expect(subject.maskEmail("@example.com")).toBe("***")
        expect(subject.maskEmail("nobody")).toBe("***")
    })

    it.each([
        [5, false],
        [6, true],
        [256, true],
        [257, false],
    ])("accepts a password of %i characters: %s", (length, accepted) => {
        expect(subject.passwordAcceptable("p".repeat(length))).toBe(accepted)
    })

    it.each([
        [2, false],
        [3, true],
        [100, true],
        [101, false],
    ])("accepts a username of %i characters: %s", (length, accepted) => {
        expect(subject.usernameAcceptable("u".repeat(length))).toBe(accepted)
    })

    it("computes the expiry and the whole minutes left, at least one", () => {
        const expiresAt = subject.challengeExpiry(NOW, 600)
        expect(expiresAt).toEqual(new Date("2026-01-01T00:10:00.000Z"))
        expect(subject.minutesLeft(expiresAt, NOW)).toBe(10)
        expect(subject.minutesLeft(expiresAt, new Date("2026-01-01T00:00:01.000Z"))).toBe(10)
        expect(subject.minutesLeft(expiresAt, new Date("2026-01-01T00:09:30.000Z"))).toBe(1)
        expect(subject.minutesLeft(expiresAt, new Date("2026-01-01T00:11:00.000Z"))).toBe(1)
    })
})
