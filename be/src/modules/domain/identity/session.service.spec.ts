import { Test } from "@nestjs/testing"
import { builder, FakeClock, mock, mockEntityManager } from "@starci/jest-preset"
import { KEYCLOAK_GATEWAY, KeycloakError, KeycloakErrorCode } from "@modules/integrations/keycloak"
import type { KeycloakGateway, KeycloakTokens } from "@modules/integrations/keycloak"
import { CLOCK } from "@modules/platform/clock"
import { Secret } from "@modules/platform/config"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LOGGER } from "@modules/platform/logging"
import type { Logger } from "@modules/platform/logging"
import { IdentityErrorCode } from "./errors/identity.error"
import { IDENTITY_OPTIONS } from "./identity.decorators"
import { IdentityLogEvent } from "./identity.log-events"
import type { IdentityOptions } from "./identity.options"
import type { IdentitySessionRow } from "./persistence/sessions.rows"
import { deriveKey, seal, unseal } from "./secret.policy"
import type { SessionTokens } from "./session.contracts"
import { referenceDigest } from "./session.policy"
import { SessionService } from "./session.service"

const NOW = new Date("2026-01-01T00:00:00.000Z")
const at = (seconds: number): Date => new Date(NOW.getTime() + seconds * 1000)
const SECRET = new Secret("k".repeat(40))
const SEAL_KEY = deriveKey(SECRET, "seal")
const REFERENCE = "r".repeat(43)
const rowOf = builder<IdentitySessionRow>({
    subject: "learner-1",
    roles: ["student"],
    display_name: "Ada L",
    email: "ada@example.com",
    refresh_ciphertext: seal("refresh-old", SEAL_KEY),
    refresh_expires_at: at(3600),
    expires_at: at(3600),
    issued_at: NOW,
})
const dueOf = (): IdentitySessionRow => rowOf({ refresh_expires_at: at(200), expires_at: at(200) })
const tokensOf = builder<KeycloakTokens>({
    subject: "learner-1",
    roles: ["student", "mentor"],
    email: null,
    username: null,
    name: null,
    refreshToken: "refresh-new",
    refreshExpiresAt: at(1800),
})
const sessionTokensOf = builder<SessionTokens>({
    subject: "learner-1",
    roles: ["student", "mentor"],
    displayName: "Ada L",
    email: "ada@example.com",
    refreshToken: "refresh-new",
    refreshExpiresAt: at(1800),
})
const build = async (overrides: Partial<IdentityOptions> = {}) => {
    const options = builder<IdentityOptions>({
        sessionMaxSeconds: null,
        challengeTtlSeconds: 600,
        challengeMaxAttempts: 5,
        sessionEncryptionKey: SECRET,
    })(overrides)
    const entityManager = mockEntityManager()
    const gateway = mock<KeycloakGateway>()
    const logger = mock<Logger>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            SessionService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: entityManager },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: LOGGER, useValue: logger },
            { provide: KEYCLOAK_GATEWAY, useValue: gateway },
            { provide: IDENTITY_OPTIONS, useValue: options },
        ],
    }).compile()
    return { service: moduleRef.get(SessionService), entityManager, gateway, logger }
}

describe("SessionService", () => {
    describe("issue", () => {
        it("persists only the digest and the sealed refresh token, then returns the raw reference", async () => {
            const { service, entityManager } = await build()
            entityManager.query.mockResolvedValueOnce([])
            const issued = await service.issue(
                sessionTokensOf({ refreshToken: "refresh-1", refreshExpiresAt: at(1800), roles: ["student"] }),
            )
            const params: ReadonlyArray<unknown> = entityManager.query.mock.calls[0]?.[1] ?? []
            expect(issued).toEqual({ reference: issued.reference, expiresAt: at(1800), maxAgeSeconds: 1800 })
            expect(issued.reference).toMatch(/^[A-Za-z0-9_-]{43}$/)
            expect(params.slice(0, 3)).toEqual([referenceDigest(issued.reference), "learner-1", '["student"]'])
            expect(unseal(String(params[3]), SEAL_KEY)).toBe("refresh-1")
            expect(params.slice(4)).toEqual([at(1800), at(1800), NOW, "Ada L", "ada@example.com"])
        })
        it("stores a null name and email for a session issued without them", async () => {
            const { service, entityManager } = await build()
            entityManager.query.mockResolvedValueOnce([])
            await service.issue(sessionTokensOf({ displayName: null, email: null }))
            expect(entityManager.query.mock.calls[0]?.[1]?.slice(7)).toEqual([null, null])
        })
        it("ends the session at the local maximum when it comes first", async () => {
            const { service, entityManager } = await build({ sessionMaxSeconds: 600 })
            entityManager.query.mockResolvedValueOnce([])
            await expect(service.issue(sessionTokensOf())).resolves.toMatchObject({
                expiresAt: at(600),
                maxAgeSeconds: 600,
            })
        })
        it("refuses tokens that are already expired without writing", async () => {
            const { service, entityManager } = await build()
            await expect(service.issue(sessionTokensOf({ refreshExpiresAt: at(0) }))).rejects.toMatchObject({
                code: IdentityErrorCode.SessionUnavailable,
            })
            expect(entityManager.query).not.toHaveBeenCalled()
        })
        it("refuses uncertain persistence so no cookie can be issued", async () => {
            const { service, entityManager } = await build()
            const cause = new Error("database down")
            entityManager.query.mockRejectedValueOnce(cause)
            await expect(service.issue(sessionTokensOf())).rejects.toMatchObject({
                code: IdentityErrorCode.SessionUnavailable,
                cause,
            })
        })
    })
})

describe("SessionService", () => {
    describe("require", () => {
        it("answers the stored subject, roles, name, email and expiry without any token", async () => {
            const { service, entityManager, gateway } = await build()
            entityManager.query.mockResolvedValueOnce([rowOf()])
            await expect(service.require(REFERENCE)).resolves.toEqual({
                identity: { subject: "learner-1", roles: ["student"], displayName: "Ada L", email: "ada@example.com" },
                expiresAt: at(3600).toISOString(),
            })
            expect(entityManager.query.mock.calls[0]?.[1]).toEqual([referenceDigest(REFERENCE), NOW])
            expect(gateway.refresh).not.toHaveBeenCalled()
        })
        it("refuses a missing or malformed credential without reading", async () => {
            const { service, entityManager } = await build()
            await expect(service.require(undefined)).rejects.toMatchObject({ code: IdentityErrorCode.SessionRequired })
            await expect(service.require("short")).rejects.toMatchObject({ code: IdentityErrorCode.SessionRequired })
            expect(entityManager.query).not.toHaveBeenCalled()
        })
        it("refuses an unknown, expired or revoked session", async () => {
            const { service, entityManager } = await build()
            entityManager.query.mockResolvedValueOnce([])
            await expect(service.require(REFERENCE)).rejects.toMatchObject({ code: IdentityErrorCode.SessionRequired })
        })
        it("refuses uncertain reads as unavailable", async () => {
            const { service, entityManager } = await build()
            const cause = new Error("database down")
            entityManager.query.mockRejectedValueOnce(cause)
            await expect(service.require(REFERENCE)).rejects.toMatchObject({
                code: IdentityErrorCode.SessionUnavailable,
                cause,
            })
        })
    })
})

describe("SessionService", () => {
    describe("require with a closing refresh token", () => {
        it("refreshes a closing refresh token server-side and stores the rotated one with the new roles", async () => {
            const { service, entityManager, gateway } = await build()
            gateway.refresh.mockResolvedValue(tokensOf())
            entityManager.query.mockResolvedValueOnce([dueOf()]).mockResolvedValueOnce([{ expires_at: at(1800) }])
            await expect(service.require(REFERENCE)).resolves.toEqual({
                identity: {
                    subject: "learner-1",
                    roles: ["student", "mentor"],
                    displayName: "Ada L",
                    email: "ada@example.com",
                },
                expiresAt: at(1800).toISOString(),
            })
            expect(gateway.refresh).toHaveBeenCalledWith("refresh-old")
            const params: ReadonlyArray<unknown> = entityManager.query.mock.calls[1]?.[1] ?? []
            expect(params[0]).toBe(referenceDigest(REFERENCE))
            expect(params[1]).toBe(dueOf().refresh_ciphertext)
            expect(unseal(String(params[2]), SEAL_KEY)).toBe("refresh-new")
            expect(params.slice(3)).toEqual([at(1800), at(1800), '["student","mentor"]', NOW, null, null])
        })
        it("takes the name and email the refreshed token asserts, and keeps the stored ones when it asserts none", async () => {
            const { service, entityManager, gateway } = await build()
            gateway.refresh.mockResolvedValue(
                tokensOf({ username: "ada.new", name: "Ada New", email: "new@example.com" }),
            )
            entityManager.query.mockResolvedValueOnce([dueOf()]).mockResolvedValueOnce([{ expires_at: at(1800) }])
            await expect(service.require(REFERENCE)).resolves.toMatchObject({
                identity: { displayName: "ada.new", email: "new@example.com" },
            })
            expect(entityManager.query.mock.calls[1]?.[1]?.slice(7)).toEqual(["ada.new", "new@example.com"])
        })
        it("coalesces concurrent refreshes of one session into one provider call", async () => {
            const { service, entityManager, gateway } = await build()
            gateway.refresh.mockResolvedValue(tokensOf())
            entityManager.query
                .mockResolvedValueOnce([dueOf()])
                .mockResolvedValueOnce([dueOf()])
                .mockResolvedValueOnce([{ expires_at: at(1800) }])
            const [first, second] = await Promise.all([service.require(REFERENCE), service.require(REFERENCE)])
            expect(first).toEqual(second)
            expect(gateway.refresh).toHaveBeenCalledTimes(1)
        })
        it("starts a new refresh for a later request once the earlier one finished", async () => {
            const { service, entityManager, gateway } = await build()
            gateway.refresh.mockResolvedValue(tokensOf())
            entityManager.query
                .mockResolvedValueOnce([dueOf()])
                .mockResolvedValueOnce([{ expires_at: at(1800) }])
                .mockResolvedValueOnce([dueOf()])
                .mockResolvedValueOnce([{ expires_at: at(1800) }])
            await service.require(REFERENCE)
            await service.require(REFERENCE)
            expect(gateway.refresh).toHaveBeenCalledTimes(2)
        })
        it("re-reads the session when another replica rotated the tokens first", async () => {
            const { service, entityManager, gateway } = await build()
            gateway.refresh.mockResolvedValue(tokensOf())
            entityManager.query
                .mockResolvedValueOnce([dueOf()])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([rowOf({ roles: ["mentor"] })])
            await expect(service.require(REFERENCE)).resolves.toMatchObject({
                identity: { subject: "learner-1", roles: ["mentor"], displayName: "Ada L" },
            })
        })
    })
})

describe("SessionService", () => {
    describe("require when the refresh fails", () => {
        it("ends the session when the provider refuses the refresh", async () => {
            const { service, entityManager, gateway } = await build()
            const cause = new KeycloakError({ code: KeycloakErrorCode.CredentialsRejected })
            gateway.refresh.mockRejectedValue(cause)
            entityManager.query.mockResolvedValueOnce([dueOf()]).mockResolvedValueOnce([])
            await expect(service.require(REFERENCE)).rejects.toMatchObject({
                code: IdentityErrorCode.SessionRequired,
                cause,
            })
            expect(entityManager.query.mock.calls[1]?.[1]).toEqual([referenceDigest(REFERENCE), NOW])
        })
        it("keeps the session while the provider is unreachable and records the outage", async () => {
            const { service, entityManager, gateway, logger } = await build()
            const cause = new KeycloakError({ code: KeycloakErrorCode.Unavailable })
            gateway.refresh.mockRejectedValue(cause)
            entityManager.query.mockResolvedValueOnce([dueOf()])
            await expect(service.require(REFERENCE)).resolves.toMatchObject({ expiresAt: at(200).toISOString() })
            expect(logger.error).toHaveBeenCalledWith(IdentityLogEvent.RefreshUnavailable, cause)
            expect(entityManager.query).toHaveBeenCalledTimes(1)
        })
        it("ends the session when its sealed refresh token cannot be opened", async () => {
            const { service, entityManager, gateway } = await build()
            entityManager.query
                .mockResolvedValueOnce([
                    rowOf({ refresh_ciphertext: "garbage", refresh_expires_at: at(200), expires_at: at(200) }),
                ])
                .mockResolvedValueOnce([])
            await expect(service.require(REFERENCE)).rejects.toMatchObject({ code: IdentityErrorCode.SessionRequired })
            expect(gateway.refresh).not.toHaveBeenCalled()
        })
        it("refuses uncertain persistence of the rotated tokens", async () => {
            const { service, entityManager, gateway } = await build()
            const cause = new Error("database down")
            gateway.refresh.mockResolvedValue(tokensOf())
            entityManager.query.mockResolvedValueOnce([dueOf()]).mockRejectedValueOnce(cause)
            await expect(service.require(REFERENCE)).rejects.toMatchObject({
                code: IdentityErrorCode.SessionUnavailable,
                cause,
            })
        })
        it("does not refresh when the local maximum leaves nothing to gain", async () => {
            const { service, entityManager, gateway } = await build({ sessionMaxSeconds: 200 })
            entityManager.query.mockResolvedValueOnce([dueOf()])
            await service.require(REFERENCE)
            expect(gateway.refresh).not.toHaveBeenCalled()
        })
    })
})

describe("SessionService", () => {
    describe("signOut", () => {
        it("revokes locally first and then revokes the provider refresh token", async () => {
            const { service, entityManager, gateway } = await build()
            entityManager.query.mockResolvedValueOnce([{ refresh_ciphertext: seal("refresh-old", SEAL_KEY) }])
            await service.signOut(REFERENCE)
            expect(entityManager.query.mock.calls[0]?.[1]).toEqual([referenceDigest(REFERENCE), NOW])
            expect(gateway.revoke).toHaveBeenCalledWith("refresh-old")
        })
        it("is idempotent for an absent, malformed or already revoked session", async () => {
            const { service, entityManager, gateway } = await build()
            entityManager.query.mockResolvedValueOnce([])
            await service.signOut(undefined)
            await service.signOut("short")
            await service.signOut(REFERENCE)
            expect(entityManager.query).toHaveBeenCalledTimes(1)
            expect(gateway.revoke).not.toHaveBeenCalled()
        })
        it("stays signed out locally and records a provider revocation failure", async () => {
            const { service, entityManager, gateway, logger } = await build()
            const cause = new KeycloakError({ code: KeycloakErrorCode.Unavailable })
            gateway.revoke.mockRejectedValue(cause)
            entityManager.query.mockResolvedValueOnce([{ refresh_ciphertext: seal("refresh-old", SEAL_KEY) }])
            await expect(service.signOut(REFERENCE)).resolves.toBeUndefined()
            expect(logger.error).toHaveBeenCalledWith(IdentityLogEvent.ProviderRevokeFailed, cause)
        })
        it("refuses uncertain local revocation before any provider call", async () => {
            const { service, entityManager, gateway } = await build()
            const cause = new Error("database down")
            entityManager.query.mockRejectedValueOnce(cause)
            await expect(service.signOut(REFERENCE)).rejects.toMatchObject({
                code: IdentityErrorCode.SessionUnavailable,
                cause,
            })
            expect(gateway.revoke).not.toHaveBeenCalled()
        })
    })
})

describe("SessionService", () => {
    describe("revokeAllOf", () => {
        it("revokes every live session of the learner at the current time", async () => {
            const { service, entityManager } = await build()
            entityManager.query.mockResolvedValueOnce([])
            await service.revokeAllOf("learner-1")
            expect(entityManager.query.mock.calls[0]?.[1]).toEqual(["learner-1", NOW])
        })
        it("refuses uncertain persistence", async () => {
            const { service, entityManager } = await build()
            const cause = new Error("database down")
            entityManager.query.mockRejectedValueOnce(cause)
            await expect(service.revokeAllOf("learner-1")).rejects.toMatchObject({
                code: IdentityErrorCode.SessionUnavailable,
                cause,
            })
        })
    })
})
