import { Test } from "@nestjs/testing"
import { builder, FakeClock, mockEntityManager } from "@starci/jest-preset"
import { Secret } from "@modules/platform/config"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { codeDigest } from "./challenge.policy"
import { ChallengeService } from "./challenge.service"
import { IdentityErrorCode } from "./errors/identity.error"
import { IDENTITY_OPTIONS } from "./identity.decorators"
import type { IdentityOptions } from "./identity.options"
import type { ChallengeAttemptRow, ChallengeRotatedRow } from "./persistence/challenges.rows"
import { deriveKey, seal } from "./secret.policy"
import { referenceDigest } from "./session.policy"

const NOW = "2026-01-01T00:00:00.000Z"
const SECRET = new Secret("k".repeat(40))
const CHALLENGE = "c".repeat(43)
const attemptOf = builder<ChallengeAttemptRow>({
    matched: true,
    attempts_left: 5,
    email: "ada@example.com",
    payload: null,
})
const rotatedOf = builder<ChallengeRotatedRow>({
    purpose: "sign-in",
    email: "ada@example.com",
    locale: "vi",
    deliver: true,
    expires_at: new Date("2026-01-01T00:10:00.000Z"),
})
const build = async () => {
    const options = builder<IdentityOptions>({
        sessionMaxSeconds: null,
        challengeTtlSeconds: 600,
        challengeMaxAttempts: 5,
        sessionEncryptionKey: SECRET,
    })()
    const entityManager = mockEntityManager()
    const clock = new FakeClock(NOW)
    const moduleRef = await Test.createTestingModule({
        providers: [
            ChallengeService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: entityManager },
            { provide: CLOCK, useValue: clock },
            { provide: IDENTITY_OPTIONS, useValue: options },
        ],
    }).compile()
    return { service: moduleRef.get(ChallengeService), entityManager }
}

describe("ChallengeService", () => {
    describe("issue", () => {
        it("stores only digests, a sealed payload, the exact attempts and expiry, and returns the raw code once", async () => {
            const { service, entityManager } = await build()
            entityManager.query.mockResolvedValueOnce([])
            const issued = await service.issue({
                purpose: "sign-up",
                email: "ada@example.com",
                locale: "en",
                deliver: true,
                payload: { email: "a@b.c", username: "ada", password: "secret1" },
            })
            const params: ReadonlyArray<unknown> = entityManager.query.mock.calls[0]?.[1] ?? []
            const digest = referenceDigest(issued.challenge)
            expect(issued.code).toMatch(/^\d{6}$/)
            expect(issued.expiresAt).toEqual(new Date("2026-01-01T00:10:00.000Z"))
            expect(params.slice(0, 4)).toEqual([digest, "sign-up", "ada@example.com", "en"])
            expect(params[4]).toBe(codeDigest(deriveKey(SECRET, "code"), digest, issued.code))
            expect(params.slice(5, 7)).toEqual([5, true])
            expect(String(params[7])).not.toContain("secret1")
            expect(params.slice(8)).toEqual([new Date("2026-01-01T00:10:00.000Z"), new Date(NOW)])
        })
        it("refuses uncertain persistence without returning a code", async () => {
            const { service, entityManager } = await build()
            const cause = new Error("database down")
            entityManager.query.mockRejectedValueOnce(cause)
            await expect(
                service.issue({
                    purpose: "sign-in",
                    email: "ada@example.com",
                    locale: "vi",
                    deliver: true,
                    payload: { email: "a@b.c", username: "ada", password: "x" },
                }),
            ).rejects.toMatchObject({ code: IdentityErrorCode.SessionUnavailable, cause })
        })
    })
})

describe("ChallengeService", () => {
    describe("attempt", () => {
        it("releases the unsealed payload to the winner of a right code", async () => {
            const { service, entityManager } = await build()
            const payload = seal('{"subject":"learner-1"}', deriveKey(SECRET, "seal"))
            entityManager.query.mockResolvedValueOnce([attemptOf({ payload })])
            await expect(service.attempt("password-reset", CHALLENGE, "123456")).resolves.toEqual({
                email: "ada@example.com",
                payload: '{"subject":"learner-1"}',
            })
            const params: ReadonlyArray<unknown> = entityManager.query.mock.calls[0]?.[1] ?? []
            expect(params).toEqual([
                referenceDigest(CHALLENGE),
                "password-reset",
                codeDigest(deriveKey(SECRET, "code"), referenceDigest(CHALLENGE), "123456"),
                new Date(NOW),
            ])
        })
        it("spends an attempt on a wrong code and says how many are left", async () => {
            const { service, entityManager } = await build()
            entityManager.query.mockResolvedValueOnce([attemptOf({ matched: false, attempts_left: 3 })])
            await expect(service.attempt("sign-in", CHALLENGE, "000000")).rejects.toMatchObject({
                code: IdentityErrorCode.CodeMismatch,
                params: { attemptsLeft: 3 },
            })
        })
        it("refuses an unknown, consumed, expired or exhausted challenge", async () => {
            const { service, entityManager } = await build()
            entityManager.query.mockResolvedValueOnce([])
            await expect(service.attempt("sign-in", CHALLENGE, "123456")).rejects.toMatchObject({
                code: IdentityErrorCode.ChallengeExpired,
            })
        })
        it("refuses a malformed reference without touching the store", async () => {
            const { service, entityManager } = await build()
            await expect(service.attempt("sign-in", "short", "123456")).rejects.toMatchObject({
                code: IdentityErrorCode.ChallengeExpired,
            })
            expect(entityManager.query).not.toHaveBeenCalled()
        })
        it("refuses a matched row that lost its payload", async () => {
            const { service, entityManager } = await build()
            entityManager.query.mockResolvedValueOnce([attemptOf()])
            await expect(service.attempt("sign-in", CHALLENGE, "123456")).rejects.toMatchObject({
                code: IdentityErrorCode.SessionUnavailable,
            })
        })
        it("refuses uncertain persistence", async () => {
            const { service, entityManager } = await build()
            const cause = new Error("database down")
            entityManager.query.mockRejectedValueOnce(cause)
            await expect(service.attempt("sign-in", CHALLENGE, "123456")).rejects.toMatchObject({
                code: IdentityErrorCode.SessionUnavailable,
                cause,
            })
        })
    })
})

describe("ChallengeService", () => {
    describe("rotate", () => {
        it("replaces the code, restores the attempts and keeps the expiry", async () => {
            const { service, entityManager } = await build()
            entityManager.query.mockResolvedValueOnce([rotatedOf()])
            const rotated = await service.rotate(CHALLENGE)
            const params: ReadonlyArray<unknown> = entityManager.query.mock.calls[0]?.[1] ?? []
            expect(rotated).toMatchObject({
                purpose: "sign-in",
                email: "ada@example.com",
                locale: "vi",
                deliver: true,
                expiresAt: new Date("2026-01-01T00:10:00.000Z"),
            })
            expect(rotated.code).toMatch(/^\d{6}$/)
            expect(params).toEqual([
                referenceDigest(CHALLENGE),
                codeDigest(deriveKey(SECRET, "code"), referenceDigest(CHALLENGE), rotated.code),
                5,
                new Date(NOW),
            ])
        })
        it("refuses an unknown, consumed or expired challenge and a malformed reference", async () => {
            const { service, entityManager } = await build()
            entityManager.query.mockResolvedValueOnce([])
            await expect(service.rotate(CHALLENGE)).rejects.toMatchObject({ code: IdentityErrorCode.ChallengeExpired })
            await expect(service.rotate("short")).rejects.toMatchObject({ code: IdentityErrorCode.ChallengeExpired })
            expect(entityManager.query).toHaveBeenCalledTimes(1)
        })
        it("refuses uncertain persistence", async () => {
            const { service, entityManager } = await build()
            const cause = new Error("database down")
            entityManager.query.mockRejectedValueOnce(cause)
            await expect(service.rotate(CHALLENGE)).rejects.toMatchObject({
                code: IdentityErrorCode.SessionUnavailable,
                cause,
            })
        })
    })
})
