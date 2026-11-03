import { unwrapOutcome } from "@modules/platform/primitives"
import { IdentityError } from "./errors/identity.error"
import type { IdentityCallback, IdentitySessionView, OptionalIdentityReference } from "./session.contracts"
import type {
    IdentityCallbackQuery,
    IdentityLogoutResult,
    IdentityReadResult,
    IdentityRedirectView,
    IdentityResponseWriter,
} from "./session-http.contracts"
import { readIdentityCookie } from "./session-http.policy"
import { IDENTITY_LOGIN_COOKIE, IDENTITY_SESSION_COOKIE } from "./session.policy"

const issuerOf = (value: unknown): string | undefined => {
    if (value === undefined) return undefined
    return typeof value === "string" ? value : ""
}

/** Narrows transient OIDC query fields without turning callback refusals into validation HTTP errors. */
export const toIdentityCallback = (
    query: IdentityCallbackQuery,
    cookie: OptionalIdentityReference,
): IdentityCallback => ({
    state: typeof query.state === "string" ? query.state : undefined,
    code: typeof query.code === "string" ? query.code : undefined,
    error: query.error === undefined ? undefined : "provider-refused",
    issuer: issuerOf(query.iss),
    binding: readIdentityCookie(cookie, IDENTITY_LOGIN_COOKIE),
    sessionReference: readIdentityCookie(cookie, IDENTITY_SESSION_COOKIE),
})

/** Reads the exact opaque session credential without accepting a client identity claim. */
export const toIdentityReference = (cookie: OptionalIdentityReference): OptionalIdentityReference =>
    readIdentityCookie(cookie, IDENTITY_SESSION_COOKIE)

/** Writes only cookie headers and safe navigation; the internal outcome cause never enters a response. */
export const writeIdentityRedirect = (response: IdentityResponseWriter, result: IdentityRedirectView): void => {
    response.setHeader("Cache-Control", "no-store")
    response.setHeader("Set-Cookie", result.cookies)
    response.redirect(303, result.url)
}

/** Clears a refused credential before the common error filter writes the refusal schema. */
export const writeIdentitySession = (
    response: IdentityResponseWriter,
    result: IdentityReadResult,
): IdentitySessionView => {
    response.setHeader("Cache-Control", "no-store")
    response.setHeader("Set-Cookie", result.cookies)
    return unwrapOutcome(result, IdentityError)
}

/** Applies browser cleanup before unwrapping a failed local revocation. */
export const writeIdentityLogout = (response: IdentityResponseWriter, result: IdentityLogoutResult): void => {
    response.setHeader("Cache-Control", "no-store")
    response.setHeader("Set-Cookie", result.cookies)
    response.redirect(303, unwrapOutcome(result, IdentityError).url)
}
