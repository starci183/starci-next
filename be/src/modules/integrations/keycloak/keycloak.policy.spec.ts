import { Test } from "@nestjs/testing"
import type { Secret } from "@modules/platform/config"
import { mock } from "@starci/jest-preset"
import type { KeycloakOptions } from "./keycloak.options"
import { validateKeycloakOptions } from "./keycloak.policy"
import type { JWTPayload } from "jose"
import { builder } from "@starci/jest-preset"
import { KeycloakErrorCode } from "./errors/keycloak.error"
import { isKeycloakJwks, readKeycloakIdentity, readKeycloakMetadata } from "./keycloak.policy"

const ISSUER = "https://identity.example/realm"
const metadataOf = builder({
    issuer: ISSUER,
    authorization_endpoint: `${ISSUER}/auth`,
    token_endpoint: `${ISSUER}/token`,
    jwks_uri: `${ISSUER}/keys`,
    end_session_endpoint: `${ISSUER}/logout`,
})
const claimsOf = builder<JWTPayload>({ sub: "learner", exp: 1767229200, nonce: "nonce" })
const claimsWithout = (claim: "sub" | "exp"): JWTPayload => {
    const claims = claimsOf()
    delete claims[claim]
    return claims
}

const optionsOf = builder<KeycloakOptions>({
    issuer: ISSUER,
    clientId: "test-client",
    clientSecret: mock<Secret>(),
    callbackUri: "https://app.example/api/identity/session/callback",
    postLogoutUri: "https://app.example/sign-in",
    timeoutMs: 10000,
})
const POLICY: unique symbol = Symbol("keycloak.policy")
const policies = { isKeycloakJwks, readKeycloakIdentity, readKeycloakMetadata, validateKeycloakOptions }
describe("Keycloak policy", () => {
    let subject: typeof policies
    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: POLICY, useFactory: () => policies }],
        }).compile()
        subject = moduleRef.get<typeof policies>(POLICY)
    })
    it("accepts exact HTTPS client registration", () => {
        const options = optionsOf()
        expect(subject.validateKeycloakOptions(options)).toBe(options)
    })
    it.each([
        optionsOf({ issuer: "invalid" }),
        optionsOf({ issuer: "http://identity.example/realm" }),
        optionsOf({ issuer: "https://user@identity.example/realm" }),
        optionsOf({ issuer: "https://:pass@identity.example/realm" }),
        optionsOf({ issuer: `${ISSUER}?query=value` }),
        optionsOf({ issuer: `${ISSUER}#fragment` }),
        optionsOf({ callbackUri: "https://app.example/wrong" }),
        optionsOf({ postLogoutUri: "https://foreign.example/sign-in" }),
        optionsOf({ timeoutMs: 0 }),
    ])("refuses unsafe registered destinations and nonpositive deadlines", (options) => {
        expect(() => subject.validateKeycloakOptions(options)).toThrow(KeycloakErrorCode.ConfigurationInvalid)
    })
    it("accepts only issuer-owned HTTPS discovery locations", () => {
        expect(subject.readKeycloakMetadata(metadataOf(), ISSUER)).toEqual({
            authorizationEndpoint: `${ISSUER}/auth`,
            tokenEndpoint: `${ISSUER}/token`,
            jwksUri: `${ISSUER}/keys`,
            logoutEndpoint: `${ISSUER}/logout`,
        })
    })
    it.each([
        null,
        {},
        metadataOf({ issuer: "https://foreign.example" }),
        metadataOf({ authorization_endpoint: "invalid" }),
        metadataOf({ authorization_endpoint: "http://identity.example/auth" }),
        metadataOf({ authorization_endpoint: "https://foreign.example/auth" }),
        metadataOf({ authorization_endpoint: "https://user@identity.example/auth" }),
        metadataOf({ authorization_endpoint: "https://:pass@identity.example/auth" }),
        metadataOf({ authorization_endpoint: `${ISSUER}/auth#fragment` }),
        { ...metadataOf(), authorization_endpoint: 3 },
    ])("refuses unsafe or malformed discovery metadata", (value) => {
        expect(() => subject.readKeycloakMetadata(value, ISSUER)).toThrow(KeycloakErrorCode.Rejected)
    })
    it("accepts bounded public RSA key sets", () => {
        expect(subject.isKeycloakJwks({ keys: [{ kty: "RSA", n: "public-modulus", e: "AQAB" }] })).toBe(true)
    })
    it.each([
        null,
        {},
        { keys: "bad" },
        { keys: [] },
        { keys: Array.from({ length: 101 }, () => ({})) },
        { keys: [null] },
        { keys: [{ kty: "oct" }] },
        { keys: [{ kty: "RSA" }] },
        { keys: [{ kty: "RSA", n: "public" }] },
        { keys: [{ kty: "RSA", n: "public", e: "AQAB", d: "private" }] },
    ])("refuses malformed, private, symmetric and oversized key sets", (value) => {
        expect(subject.isKeycloakJwks(value)).toBe(false)
    })
})

describe("Keycloak policy", () => {
    let subject: typeof policies
    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: POLICY, useFactory: () => policies }],
        }).compile()
        subject = moduleRef.get<typeof policies>(POLICY)
    })
    it("accepts verified provider roles and does not require a learner role", () => {
        expect(subject.readKeycloakIdentity(claimsOf(), ISSUER, "nonce").roles).toEqual([])
        expect(
            subject.readKeycloakIdentity(claimsOf({ realm_access: { roles: ["author-editor"] } }), ISSUER, "nonce")
                .roles,
        ).toEqual(["author-editor"])
    })
    it.each([
        claimsWithout("sub"),
        claimsOf({ sub: "" }),
        claimsOf({ sub: "a".repeat(256) }),
        claimsWithout("exp"),
        claimsOf({ exp: 1.5 }),
        claimsOf({ nonce: undefined }),
        claimsOf({ nonce: "wrong" }),
        claimsOf({ nonce: "longer-nonce" }),
        claimsOf({ realm_access: null }),
        claimsOf({ realm_access: {} }),
        claimsOf({ realm_access: { roles: Array.from({ length: 129 }, () => "role") } }),
        claimsOf({ realm_access: { roles: [3] } }),
        claimsOf({ realm_access: { roles: [""] } }),
        claimsOf({ realm_access: { roles: ["a".repeat(257)] } }),
    ])("refuses malformed identity, role assertions and mismatched nonces", (claims) => {
        expect(() => subject.readKeycloakIdentity(claims, ISSUER, "nonce")).toThrow(KeycloakErrorCode.Rejected)
    })
})
