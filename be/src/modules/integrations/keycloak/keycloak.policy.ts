import { timingSafeEqual } from "node:crypto"
import type { JSONWebKeySet, JWTPayload } from "jose"
import { isRecord } from "@modules/platform/primitives"
import { KeycloakError, KeycloakErrorCode } from "./errors/keycloak.error"
import type { KeycloakOptions } from "./keycloak.options"
import type { KeycloakIdentity, KeycloakMetadata } from "./keycloak.contracts"

const endpoint = (value: unknown, issuer: string): string => {
    if (typeof value !== "string" || !URL.canParse(value)) throw new KeycloakError({ code: KeycloakErrorCode.Rejected })
    const url = new URL(value)
    if (
        url.protocol !== "https:" ||
        url.origin !== new URL(issuer).origin ||
        url.username !== "" ||
        url.password !== "" ||
        url.hash !== ""
    )
        throw new KeycloakError({ code: KeycloakErrorCode.Rejected })
    return value
}

/** Narrows provider discovery before an endpoint can receive credentials or a browser redirect. */
export const readKeycloakMetadata = (value: unknown, issuer: string): KeycloakMetadata => {
    if (!isRecord(value) || value.issuer !== issuer) throw new KeycloakError({ code: KeycloakErrorCode.Rejected })
    return {
        authorizationEndpoint: endpoint(value.authorization_endpoint, issuer),
        tokenEndpoint: endpoint(value.token_endpoint, issuer),
        jwksUri: endpoint(value.jwks_uri, issuer),
        logoutEndpoint: endpoint(value.end_session_endpoint, issuer),
    }
}

/** Accepts bounded public RSA key material only; private or symmetric key sets are never verification input. */
export const isKeycloakJwks = (value: unknown): value is JSONWebKeySet =>
    isRecord(value) &&
    Array.isArray(value.keys) &&
    value.keys.length > 0 &&
    value.keys.length <= 100 &&
    value.keys.every(
        (key: unknown) =>
            isRecord(key) &&
            key.kty === "RSA" &&
            typeof key.n === "string" &&
            typeof key.e === "string" &&
            key.d === undefined,
    )

const readRoles = (value: unknown): ReadonlyArray<string> => {
    if (value === undefined) return []
    if (
        !isRecord(value) ||
        !Array.isArray(value.roles) ||
        value.roles.length > 128 ||
        !value.roles.every((role: unknown) => typeof role === "string" && role.length > 0 && role.length <= 256)
    )
        throw new KeycloakError({ code: KeycloakErrorCode.Rejected })
    return value.roles.filter((role: unknown): role is string => typeof role === "string")
}

/** Builds identity from already signature-verified claims and compares the retained nonce in constant time. */
export const readKeycloakIdentity = (claims: JWTPayload, issuer: string, nonce: string): KeycloakIdentity => {
    if (
        typeof claims.sub !== "string" ||
        claims.sub.length === 0 ||
        claims.sub.length > 255 ||
        typeof claims.exp !== "number" ||
        !Number.isSafeInteger(claims.exp) ||
        typeof claims.nonce !== "string"
    )
        throw new KeycloakError({ code: KeycloakErrorCode.Rejected })
    const expected = Buffer.from(nonce)
    const received = Buffer.from(claims.nonce)
    if (expected.length !== received.length || !timingSafeEqual(expected, received))
        throw new KeycloakError({ code: KeycloakErrorCode.Rejected })
    return {
        issuer,
        subject: claims.sub,
        roles: readRoles(claims.realm_access),
        expiresAt: new Date(claims.exp * 1000),
    }
}

const configuredHttps = (value: string, key: string, path?: string): void => {
    if (!URL.canParse(value)) throw new KeycloakError({ code: KeycloakErrorCode.ConfigurationInvalid, params: { key } })
    const url = new URL(value)
    if (
        url.protocol !== "https:" ||
        url.username !== "" ||
        url.password !== "" ||
        url.search !== "" ||
        url.hash !== "" ||
        (path !== undefined && url.pathname !== path)
    )
        throw new KeycloakError({ code: KeycloakErrorCode.ConfigurationInvalid, params: { key } })
}

/** Refuses unsafe deployment destinations before any provider request or browser navigation. */
export const validateKeycloakOptions = (options: KeycloakOptions): KeycloakOptions => {
    configuredHttps(options.issuer, "IDENTITY_KEYCLOAK_ISSUER")
    configuredHttps(options.callbackUri, "IDENTITY_KEYCLOAK_CALLBACK_URI", "/api/identity/session/callback")
    configuredHttps(options.postLogoutUri, "IDENTITY_KEYCLOAK_POST_LOGOUT_URI", "/sign-in")
    if (options.timeoutMs <= 0 || new URL(options.callbackUri).origin !== new URL(options.postLogoutUri).origin)
        throw new KeycloakError({
            code: KeycloakErrorCode.ConfigurationInvalid,
            params: {
                key: options.timeoutMs <= 0 ? "IDENTITY_PROVIDER_TIMEOUT_MS" : "IDENTITY_KEYCLOAK_POST_LOGOUT_URI",
            },
        })
    return options
}
