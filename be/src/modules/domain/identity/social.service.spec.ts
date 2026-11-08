import { Test } from "@nestjs/testing"
import { builder, FakeClock, mockEntityManager } from "@starci/jest-preset"
import { Secret } from "@modules/platform/config"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { IdentityErrorCode } from "./errors/identity.error"
import { IDENTITY_OPTIONS } from "./identity.decorators"
import type { IdentityOptions } from "./identity.options"
import type { SocialBundleRow } from "./persistence/challenges.rows"
import { pkceChallenge, referenceDigest } from "./session.policy"
import { SocialService } from "./social.service"

const NOW = "2026-01-01T00:00:00.000Z"
const STATE = "s".repeat(43)
const bundleOf = builder<SocialBundleRow>({
    nonce: "n".repeat(43),
    code_verifier: "v".repeat(43),
    return_to: "/courses",
})
const build = async () => {
    const options = builder<IdentityOptions>({
        sessionMaxSeconds: null,
        challengeTtlSeconds: 600,
        challengeMaxAttempts: 5,
        sessionEncryptionKey: new Secret("k".repeat(40)),
    })()
    const entityManager = mockEntityManager()
    const moduleRef = await Test.createTestingModule({
        providers: [
            SocialService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: entityManager },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: IDENTITY_OPTIONS, useValue: options },
        ],
    }).compile()
    return { service: moduleRef.get(SocialService), entityManager }
}

describe("SocialService", () => {
    describe("begin", () => {
        it("stores the digest of the state with nonce, verifier, safe return path and expiry", async () => {
            const { service, entityManager } = await build()
            entityManager.query.mockResolvedValueOnce([])
            const bundle = await service.begin("/courses/intro")
            const params: ReadonlyArray<unknown> = entityManager.query.mock.calls[0]?.[1] ?? []
            expect(params[0]).toBe(referenceDigest(bundle.state))
            expect(params[1]).toBe(bundle.nonce)
            expect(bundle.codeChallenge).toBe(pkceChallenge(String(params[2])))
            expect(params.slice(3)).toEqual(["/courses/intro", new Date("2026-01-01T00:10:00.000Z"), new Date(NOW)])
            expect(bundle.maxAgeSeconds).toBe(600)
        })
        it("stores the home page for a return path that is not same-origin", async () => {
            const { service, entityManager } = await build()
            entityManager.query.mockResolvedValueOnce([])
            await service.begin("https://evil.example")
            const params: ReadonlyArray<unknown> = entityManager.query.mock.calls[0]?.[1] ?? []
            expect(params[3]).toBe("/")
        })
        it("refuses uncertain persistence", async () => {
            const { service, entityManager } = await build()
            const cause = new Error("database down")
            entityManager.query.mockRejectedValueOnce(cause)
            await expect(service.begin(undefined)).rejects.toMatchObject({
                code: IdentityErrorCode.SessionUnavailable,
                cause,
            })
        })
    })
})

describe("SocialService", () => {
    describe("claim", () => {
        it("consumes a live bundle and answers its secrets with a re-validated return path", async () => {
            const { service, entityManager } = await build()
            entityManager.query.mockResolvedValueOnce([bundleOf({ return_to: "//evil.example" })])
            await expect(service.claim(STATE)).resolves.toEqual({
                nonce: "n".repeat(43),
                codeVerifier: "v".repeat(43),
                returnTo: "/",
            })
            expect(entityManager.query.mock.calls[0]?.[1]).toEqual([referenceDigest(STATE), new Date(NOW)])
        })
        it("keeps a valid stored return path", async () => {
            const { service, entityManager } = await build()
            entityManager.query.mockResolvedValueOnce([bundleOf()])
            await expect(service.claim(STATE)).resolves.toMatchObject({ returnTo: "/courses" })
        })
        it("refuses an unknown, replayed or expired state", async () => {
            const { service, entityManager } = await build()
            entityManager.query.mockResolvedValueOnce([])
            await expect(service.claim(STATE)).rejects.toMatchObject({ code: IdentityErrorCode.SocialStateInvalid })
        })
        it("refuses a malformed state without touching the store", async () => {
            const { service, entityManager } = await build()
            await expect(service.claim("short")).rejects.toMatchObject({ code: IdentityErrorCode.SocialStateInvalid })
            expect(entityManager.query).not.toHaveBeenCalled()
        })
        it("refuses uncertain persistence", async () => {
            const { service, entityManager } = await build()
            const cause = new Error("database down")
            entityManager.query.mockRejectedValueOnce(cause)
            await expect(service.claim(STATE)).rejects.toMatchObject({
                code: IdentityErrorCode.SessionUnavailable,
                cause,
            })
        })
    })
})
