import { Test } from "@nestjs/testing"
import { builder, FakeClock, mock } from "@starci/jest-preset"
import { exportJWK, generateKeyPair, SignJWT } from "jose"
import { CLOCK } from "@modules/platform/clock"
import type { Secret } from "@modules/platform/config"
import { HTTP_CLIENT } from "@modules/platform/http"
import type { HttpClient } from "@modules/platform/http"
import { KeycloakClient } from "./keycloak.client"
import { KEYCLOAK_OPTIONS } from "./keycloak.decorators"
import type { KeycloakOptions } from "./keycloak.options"
import { KeycloakErrorCode } from "./errors/keycloak.error"

const ISSUER = "https://identity.example/realms/app"
const NOW = "2026-01-01T00:00:00.000Z"
const METADATA = {
    issuer: ISSUER,
    authorization_endpoint: `${ISSUER}/auth`,
    token_endpoint: `${ISSUER}/token`,
    jwks_uri: `${ISSUER}/keys`,
    end_session_endpoint: `${ISSUER}/logout`,
}
const secret = mock<Secret>()
secret.reveal.mockReturnValue("synthetic-fixture")
const optionsOf = builder<KeycloakOptions>({
    issuer: ISSUER,
    clientId: "app-test-client",
    clientSecret: secret,
    callbackUri: "https://app.example/api/identity/session/callback",
    postLogoutUri: "https://app.example/sign-in",
    timeoutMs: 10000,
})
const build = async () => {
    const http = mock<HttpClient>()
    const options = builder<KeycloakOptions>({
        issuer: ISSUER,
        clientId: "app-test-client",
        clientSecret: secret,
        callbackUri: "https://app.example/api/identity/session/callback",
        postLogoutUri: "https://app.example/sign-in",
        timeoutMs: 10000,
    })()
    const moduleRef = await Test.createTestingModule({
        providers: [
            KeycloakClient,
            { provide: HTTP_CLIENT, useValue: http },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: KEYCLOAK_OPTIONS, useValue: options },
        ],
    }).compile()
    return { client: moduleRef.get(KeycloakClient), http }
}

describe("KeycloakClient", () => {
    describe("authorization", () => {
        it("uses discovered endpoints, exact registration and PKCE S256 with a bounded outbound call", async () => {
            const { client, http } = await build()
            http.request.mockResolvedValue({ status: 200, body: METADATA })
            const url = new URL(await client.authorization({ state: "state", nonce: "nonce", challenge: "challenge" }))
            expect(url.origin + url.pathname).toBe(`${ISSUER}/auth`)
            expect(Object.fromEntries(url.searchParams)).toEqual({
                response_type: "code",
                client_id: "app-test-client",
                redirect_uri: optionsOf().callbackUri,
                scope: "openid",
                state: "state",
                nonce: "nonce",
                code_challenge: "challenge",
                code_challenge_method: "S256",
            })
            expect(http.request).toHaveBeenCalledWith({
                correlationId: "identity-keycloak",
                method: "GET",
                url: `${ISSUER}/.well-known/openid-configuration`,
                timeoutMs: 10000,
            })
        })
        it("wraps network failures with their cause", async () => {
            const { client, http } = await build()
            const cause = new Error("network")
            http.request.mockRejectedValue(cause)
            await expect(
                client.authorization({ state: "state", nonce: "nonce", challenge: "challenge" }),
            ).rejects.toMatchObject({ code: KeycloakErrorCode.Unavailable, cause })
        })
        it("refuses an unsuccessful discovery response", async () => {
            const { client, http } = await build()
            http.request.mockResolvedValue({ status: 503, body: {} })
            await expect(
                client.authorization({ state: "state", nonce: "nonce", challenge: "challenge" }),
            ).rejects.toMatchObject({ code: KeycloakErrorCode.Unavailable })
        })
    })
})

describe("KeycloakClient", () => {
    describe("exchange", () => {
        it("refuses a foreign authorization issuer before exchanging any code", async () => {
            const { client } = await build()
            await expect(
                client.exchange({
                    code: "code",
                    verifier: "verifier",
                    nonce: "nonce",
                    issuer: "https://foreign.example",
                }),
            ).rejects.toMatchObject({ code: KeycloakErrorCode.Rejected })
        })
    })
})

describe("KeycloakClient", () => {
    describe("exchange", () => {
        it("verifies RS256 issuer, audience, expiry and nonce, permitting an account without realm roles", async () => {
            const { client, http } = await build()
            const keys = await generateKeyPair("RS256")
            const jwk = await exportJWK(keys.publicKey)
            const token = await new SignJWT({ nonce: "nonce" })
                .setProtectedHeader({ alg: "RS256" })
                .setIssuer(ISSUER)
                .setAudience("app-test-client")
                .setSubject("learner")
                .setExpirationTime(1767229200)
                .sign(keys.privateKey)
            http.request
                .mockResolvedValueOnce({ status: 200, body: METADATA })
                .mockResolvedValueOnce({ status: 200, body: { id_token: token } })
                .mockResolvedValueOnce({ status: 200, body: { keys: [jwk] } })
            await expect(
                client.exchange({ code: "code", verifier: "verifier", nonce: "nonce", issuer: ISSUER }),
            ).resolves.toEqual({
                issuer: ISSUER,
                subject: "learner",
                roles: [],
                expiresAt: new Date("2026-01-01T01:00:00.000Z"),
            })
            expect(http.request).toHaveBeenNthCalledWith(2, {
                correlationId: "identity-keycloak",
                method: "POST",
                url: `${ISSUER}/token`,
                timeoutMs: 10000,
                form: {
                    grant_type: "authorization_code",
                    client_id: "app-test-client",
                    client_secret: "synthetic-fixture",
                    redirect_uri: optionsOf().callbackUri,
                    code: "code",
                    code_verifier: "verifier",
                },
            })
            expect(http.request).toHaveBeenNthCalledWith(3, {
                correlationId: "identity-keycloak",
                method: "GET",
                url: `${ISSUER}/keys`,
                timeoutMs: 10000,
            })
        })
    })
})

describe("KeycloakClient", () => {
    describe("exchange", () => {
        it.each(["issuer", "audience", "nonce", "expiry", "signature", "algorithm"])(
            "refuses a token with invalid %s",
            async (invalid) => {
                const { client, http } = await build()
                const keys = await generateKeyPair(invalid === "algorithm" ? "PS256" : "RS256")
                const foreign = await generateKeyPair("RS256")
                const jwk = await exportJWK(keys.publicKey)
                const claims = new SignJWT({ nonce: invalid === "nonce" ? "other" : "nonce" })
                    .setProtectedHeader({ alg: invalid === "algorithm" ? "PS256" : "RS256" })
                    .setIssuer(invalid === "issuer" ? "https://foreign.example" : ISSUER)
                    .setAudience(invalid === "audience" ? "other" : "app-test-client")
                    .setSubject("learner")
                    .setExpirationTime(invalid === "expiry" ? 1767225600 : 1767229200)
                const token = await claims.sign(invalid === "signature" ? foreign.privateKey : keys.privateKey)
                http.request
                    .mockResolvedValueOnce({ status: 200, body: METADATA })
                    .mockResolvedValueOnce({ status: 200, body: { id_token: token } })
                    .mockResolvedValueOnce({ status: 200, body: { keys: [jwk] } })
                await expect(
                    client.exchange({ code: "code", verifier: "verifier", nonce: "nonce" }),
                ).rejects.toMatchObject({ code: KeycloakErrorCode.Rejected })
            },
        )
        it.each([
            { status: 400, body: {} },
            { status: 200, body: null },
            { status: 200, body: {} },
        ])("refuses malformed or rejected token responses", async (response) => {
            const { client, http } = await build()
            http.request.mockResolvedValueOnce({ status: 200, body: METADATA }).mockResolvedValueOnce(response)
            await expect(client.exchange({ code: "code", verifier: "verifier", nonce: "nonce" })).rejects.toMatchObject(
                { code: KeycloakErrorCode.Rejected },
            )
        })
        it("refuses unusable public keys before token verification", async () => {
            const { client, http } = await build()
            http.request
                .mockResolvedValueOnce({ status: 200, body: METADATA })
                .mockResolvedValueOnce({ status: 200, body: { id_token: "invalid" } })
                .mockResolvedValueOnce({ status: 200, body: { keys: [] } })
            await expect(client.exchange({ code: "code", verifier: "verifier", nonce: "nonce" })).rejects.toMatchObject(
                { code: KeycloakErrorCode.Rejected },
            )
        })
    })
})

describe("KeycloakClient", () => {
    describe("exchange", () => {
        it("retains a token endpoint network failure as the cause", async () => {
            const { client, http } = await build()
            const cause = new Error("network")
            http.request.mockResolvedValueOnce({ status: 200, body: METADATA }).mockRejectedValueOnce(cause)
            await expect(client.exchange({ code: "code", verifier: "verifier", nonce: "nonce" })).rejects.toMatchObject(
                { code: KeycloakErrorCode.Unavailable, cause },
            )
        })
    })
    describe("logout", () => {
        it("uses only client registration and the fixed post-logout URI without an ID-token hint", async () => {
            const { client, http } = await build()
            http.request.mockResolvedValue({ status: 200, body: METADATA })
            const url = new URL(await client.logout())
            expect(url.origin + url.pathname).toBe(`${ISSUER}/logout`)
            expect(Object.fromEntries(url.searchParams)).toEqual({
                client_id: "app-test-client",
                post_logout_redirect_uri: "https://app.example/sign-in",
            })
        })
    })
})
