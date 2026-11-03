import { Test } from "@nestjs/testing"
import { builder, FakeClock, mock, mockEntityManager } from "@starci/jest-preset"
import type { MockEntityManager } from "@starci/jest-preset"
import { KEYCLOAK } from "@modules/integrations/keycloak"
import type { KeycloakClient } from "@modules/integrations/keycloak"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { IdentityError, IdentityErrorCode } from "./errors/identity.error"
import { IDENTITY_OPTIONS } from "./identity.decorators"
import type { IdentityOptions } from "./identity.options"
import type { IdentityCallback } from "./session.contracts"
import type { IdentitySessionRow, LoginTransactionRow } from "./persistence/sessions.rows"
import {
    CLAIM_LOGIN_TRANSACTION,
    FIND_IDENTITY_SESSION,
    INSERT_IDENTITY_SESSION,
    INSERT_LOGIN_TRANSACTION,
    REVOKE_IDENTITY_SESSION,
} from "./persistence/sessions.sql"
import { pkceChallenge, referenceDigest, validReference } from "./session.policy"
import { SessionService } from "./session.service"

const NOW = "2026-01-01T00:00:00.000Z"
const STATE = "s".repeat(43)
const BINDING = "b".repeat(43)
const REFERENCE = "r".repeat(43)
const optionsOf = builder<IdentityOptions>({ sessionMaxSeconds: 28800, transactionTtlSeconds: 300 })
const callbackOf = builder<IdentityCallback>({ state: STATE, binding: BINDING, code: "one-use-code" })
const transactionOf = builder<LoginTransactionRow>({ nonce: "n".repeat(43), verifier: "v".repeat(43) })
const rowOf = builder<IdentitySessionRow>({
    issuer: "https://identity.example/realm",
    subject: "learner",
    roles: [],
    expires_at: new Date("2026-01-01T01:00:00.000Z"),
})
const build = async (
    entityManager: MockEntityManager = mockEntityManager(),
    overrides: Partial<IdentityOptions> = {},
) => {
    const options = builder<IdentityOptions>({ sessionMaxSeconds: 28800, transactionTtlSeconds: 300 })(overrides)
    const keycloak = mock<KeycloakClient>()
    const clock = new FakeClock(NOW)
    const moduleRef = await Test.createTestingModule({
        providers: [
            SessionService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: entityManager },
            { provide: CLOCK, useValue: clock },
            { provide: KEYCLOAK, useValue: keycloak },
            { provide: IDENTITY_OPTIONS, useValue: options },
        ],
    }).compile()
    return { service: moduleRef.get(SessionService), keycloak, clock, entityManager }
}

describe("SessionService", () => {
    describe("start", () => {
        it("persists hashed browser binding, nonce and S256 material with the exact transaction expiry", async () => {
            const { service, keycloak, entityManager } = await build(
                mockEntityManager({ query: [INSERT_LOGIN_TRANSACTION, []] }),
            )
            keycloak.authorization.mockResolvedValue("https://identity.example/auth")
            const result = await service.start()
            const proof = keycloak.authorization.mock.calls[0]?.[0]
            const params: ReadonlyArray<unknown> | undefined = entityManager.query.mock.calls[0]?.[1]
            expect(result.authorizationUrl).toBe("https://identity.example/auth")
            expect(result.maxAgeSeconds).toBe(300)
            expect(validReference(result.binding)).toBe(true)
            expect(params?.[0]).toBe(referenceDigest(proof?.state ?? ""))
            expect(params?.[1]).toBe(referenceDigest(result.binding))
            expect(params?.[2]).toBe(proof?.nonce)
            expect(proof?.challenge).toBe(pkceChallenge(String(params?.[3])))
            expect(params?.[4]).toEqual(new Date("2026-01-01T00:05:00.000Z"))
        })
        it("refuses unavailable discovery without writing a transaction", async () => {
            const { service, keycloak } = await build()
            keycloak.authorization.mockRejectedValue(new Error("network"))
            await expect(service.start()).rejects.toMatchObject({ code: IdentityErrorCode.ProviderUnavailable })
        })
        it("refuses uncertain transaction persistence without issuing a cookie", async () => {
            const { service, keycloak, entityManager } = await build()
            const cause = new Error("transaction persistence unavailable")
            entityManager.query.mockRejectedValueOnce(cause)
            keycloak.authorization.mockResolvedValue("https://identity.example/auth")
            await expect(service.start()).rejects.toMatchObject({ code: IdentityErrorCode.ProviderUnavailable, cause })
        })
    })
})

describe("SessionService", () => {
    describe("callback", () => {
        it.each([
            callbackOf({ state: undefined }),
            callbackOf({ binding: undefined }),
            callbackOf({ state: "foreign" }),
            callbackOf({ binding: "foreign" }),
        ])("refuses missing or malformed browser proof", async (input) => {
            const { service } = await build()
            await expect(service.callback(input)).resolves.toEqual({ kind: "error" })
        })
        it.each([
            callbackOf(),
            callbackOf({ error: "denied" }),
            callbackOf({ code: undefined }),
            callbackOf({ code: "" }),
            callbackOf({ code: "a".repeat(4097) }),
        ])("refuses missing, expired, replayed or invalid claimed transactions", async (input) => {
            const { service } = await build(mockEntityManager({ query: [CLAIM_LOGIN_TRANSACTION, []] }))
            await expect(service.callback(input)).resolves.toEqual({ kind: "error" })
        })
        it.each([
            callbackOf({ error: "denied" }),
            callbackOf({ code: undefined }),
            callbackOf({ code: "" }),
            callbackOf({ code: "a".repeat(4097) }),
        ])("consumes a valid transaction even when the provider response is refused", async (input) => {
            const { service } = await build(mockEntityManager({ query: [CLAIM_LOGIN_TRANSACTION, [transactionOf()]] }))
            await expect(service.callback(input)).resolves.toEqual({ kind: "error" })
        })
    })
})

describe("SessionService", () => {
    describe("callback", () => {
        it("exchanges once after claim and stores only the session digest with verified role assertions", async () => {
            const { service, keycloak, entityManager } = await build(
                mockEntityManager({
                    query: [
                        [CLAIM_LOGIN_TRANSACTION, [transactionOf()]],
                        [INSERT_IDENTITY_SESSION, []],
                    ],
                }),
            )
            keycloak.exchange.mockResolvedValue({
                issuer: "https://identity.example/realm",
                subject: "learner",
                roles: [],
                expiresAt: new Date("2026-01-01T01:00:00.000Z"),
            })
            const result = await service.callback(callbackOf({ issuer: "https://identity.example/realm" }))
            expect(result.kind).toBe("success")
            if (result.kind !== "success") throw new IdentityError({ code: IdentityErrorCode.SessionUnavailable })
            expect(result.maxAgeSeconds).toBe(3600)
            expect(validReference(result.reference)).toBe(true)
            expect(entityManager.query).toHaveBeenNthCalledWith(1, CLAIM_LOGIN_TRANSACTION, [
                referenceDigest(STATE),
                referenceDigest(BINDING),
                new Date(NOW),
            ])
            expect(entityManager.query).toHaveBeenNthCalledWith(2, INSERT_IDENTITY_SESSION, [
                referenceDigest(result.reference),
                "https://identity.example/realm",
                "learner",
                "[]",
                new Date("2026-01-01T01:00:00.000Z"),
            ])
            expect(keycloak.exchange).toHaveBeenCalledWith({
                code: "one-use-code",
                ...transactionOf(),
                issuer: "https://identity.example/realm",
            })
        })
    })
})

describe("SessionService", () => {
    describe("callback", () => {
        it("caps expiry at the configured local maximum", async () => {
            const { service, keycloak } = await build(
                mockEntityManager({
                    query: [
                        [CLAIM_LOGIN_TRANSACTION, [transactionOf()]],
                        [INSERT_IDENTITY_SESSION, []],
                    ],
                }),
                optionsOf({ sessionMaxSeconds: 60 }),
            )
            keycloak.exchange.mockResolvedValue({
                issuer: "https://identity.example/realm",
                subject: "learner",
                roles: ["author-editor"],
                expiresAt: new Date("2026-01-01T01:00:00.000Z"),
            })
            const result = await service.callback(callbackOf())
            expect(result).toMatchObject({ kind: "success", maxAgeSeconds: 60 })
        })
        it.each([NOW, "2025-12-31T23:59:59.000Z", "2026-01-01T00:00:00.999Z"])(
            "refuses a token with no complete second of remaining lifetime",
            async (expiry) => {
                const { service, keycloak } = await build(
                    mockEntityManager({ query: [CLAIM_LOGIN_TRANSACTION, [transactionOf()]] }),
                )
                keycloak.exchange.mockResolvedValue({
                    issuer: "https://identity.example/realm",
                    subject: "learner",
                    roles: [],
                    expiresAt: new Date(expiry),
                })
                await expect(service.callback(callbackOf())).resolves.toEqual({ kind: "error" })
            },
        )
        it("retains provider failure internally without issuing authentication", async () => {
            const { service, keycloak } = await build(
                mockEntityManager({ query: [CLAIM_LOGIN_TRANSACTION, [transactionOf()]] }),
            )
            const cause = new Error("provider unavailable")
            keycloak.exchange.mockRejectedValue(cause)
            await expect(service.callback(callbackOf())).resolves.toEqual({ kind: "error", cause })
        })
    })
})

describe("SessionService", () => {
    describe("callback", () => {
        it("fails closed when session persistence is uncertain after exchange", async () => {
            const { service, keycloak, entityManager } = await build(
                mockEntityManager({ query: [CLAIM_LOGIN_TRANSACTION, [transactionOf()]] }),
            )
            const cause = new Error("session persistence unavailable")
            entityManager.query.mockResolvedValueOnce([transactionOf()]).mockRejectedValueOnce(cause)
            keycloak.exchange.mockResolvedValue({
                issuer: "https://identity.example/realm",
                subject: "learner",
                roles: [],
                expiresAt: new Date("2026-01-01T01:00:00.000Z"),
            })
            await expect(service.callback(callbackOf())).resolves.toEqual({ kind: "error", cause })
        })
        it("revokes a prior browser session before refusing a malformed callback", async () => {
            const { service, entityManager } = await build(mockEntityManager({ query: [REVOKE_IDENTITY_SESSION, []] }))
            await expect(service.callback({ sessionReference: REFERENCE })).resolves.toEqual({ kind: "error" })
            expect(entityManager.query).toHaveBeenCalledWith(REVOKE_IDENTITY_SESSION, [
                referenceDigest(REFERENCE),
                new Date(NOW),
            ])
        })
        it("permits only the winner of concurrent state claims to exchange", async () => {
            const { service, keycloak } = await build(
                mockEntityManager({
                    query: [
                        [CLAIM_LOGIN_TRANSACTION, [transactionOf()]],
                        [CLAIM_LOGIN_TRANSACTION, []],
                        [INSERT_IDENTITY_SESSION, []],
                    ],
                }),
            )
            keycloak.exchange.mockResolvedValue({
                issuer: "https://identity.example/realm",
                subject: "learner",
                roles: [],
                expiresAt: new Date("2026-01-01T01:00:00.000Z"),
            })
            const results = await Promise.all([service.callback(callbackOf()), service.callback(callbackOf())])
            expect(results.map((result) => result.kind)).toEqual(["success", "error"])
            expect(keycloak.exchange.mock.calls).toHaveLength(1)
        })
    })
})

describe("SessionService", () => {
    describe("require", () => {
        it.each([undefined, "", "invalid"])(
            "refuses absent or malformed credentials before a database read",
            async (reference) => {
                const { service } = await build()
                await expect(service.require(reference)).rejects.toMatchObject({
                    code: IdentityErrorCode.SessionRequired,
                })
            },
        )
        it("returns only verified identity and the effective expiry", async () => {
            const { service, entityManager } = await build(
                mockEntityManager({ query: [FIND_IDENTITY_SESSION, [rowOf()]] }),
            )
            await expect(service.require(REFERENCE)).resolves.toEqual({
                identity: { issuer: "https://identity.example/realm", subject: "learner", roles: [] },
                expiresAt: "2026-01-01T01:00:00.000Z",
            })
            expect(entityManager.query).toHaveBeenCalledWith(FIND_IDENTITY_SESSION, [
                referenceDigest(REFERENCE),
                new Date(NOW),
            ])
        })
        it("refuses unknown, expired and revoked sessions", async () => {
            const { service } = await build(mockEntityManager({ query: [FIND_IDENTITY_SESSION, []] }))
            await expect(service.require(REFERENCE)).rejects.toMatchObject({ code: IdentityErrorCode.SessionRequired })
        })
        it("refuses unavailable durable state", async () => {
            const { service, entityManager } = await build()
            const cause = new Error("session lookup unavailable")
            entityManager.query.mockRejectedValueOnce(cause)
            await expect(service.require(REFERENCE)).rejects.toMatchObject({
                code: IdentityErrorCode.SessionUnavailable,
                cause,
            })
        })
    })
})

describe("SessionService", () => {
    describe("signOut", () => {
        it("revokes locally before provider navigation", async () => {
            const { service, entityManager, keycloak } = await build(
                mockEntityManager({ query: [REVOKE_IDENTITY_SESSION, []] }),
            )
            keycloak.logout.mockImplementation(() => {
                expect(entityManager.query).toHaveBeenCalledWith(REVOKE_IDENTITY_SESSION, [
                    referenceDigest(REFERENCE),
                    new Date(NOW),
                ])
                return Promise.resolve("https://identity.example/logout")
            })
            await expect(service.signOut(REFERENCE)).resolves.toEqual({
                redirectUrl: "https://identity.example/logout",
            })
        })
        it("cleans up idempotently without an application credential", async () => {
            const { service, keycloak } = await build()
            keycloak.logout.mockResolvedValue("https://identity.example/logout")
            await expect(service.signOut(undefined)).resolves.toEqual({
                redirectUrl: "https://identity.example/logout",
            })
        })
        it("retains local revocation when provider discovery fails", async () => {
            const { service, keycloak } = await build(mockEntityManager({ query: [REVOKE_IDENTITY_SESSION, []] }))
            const cause = new Error("provider unavailable")
            keycloak.logout.mockRejectedValue(cause)
            await expect(service.signOut(REFERENCE)).resolves.toEqual({ redirectUrl: "/sign-in?auth=error", cause })
        })
        it("refuses navigation when local revocation is uncertain", async () => {
            const { service, entityManager, keycloak } = await build()
            const cause = new Error("session revocation unavailable")
            entityManager.query.mockRejectedValueOnce(cause)
            await expect(service.signOut(REFERENCE)).rejects.toMatchObject({
                code: IdentityErrorCode.SessionUnavailable,
                cause,
            })
            expect(keycloak.logout).not.toHaveBeenCalled()
        })
    })
})
