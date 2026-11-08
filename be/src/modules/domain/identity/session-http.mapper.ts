import { unwrapOutcome } from "@modules/platform/primitives"
import { IdentityError } from "./errors/identity.error"
import type { SocialSessionIssued, SocialStarted } from "./challenge.contracts"
import type { IdentitySessionView, OptionalIdentityReference, SessionIssued } from "./session.contracts"
import type { IdentityLogoutResult, IdentityReadResult, IdentityResponseWriter } from "./session-http.contracts"
import { deleteIdentityCookie, issueIdentityCookie, readIdentityCookie } from "./session-http.policy"
import { IDENTITY_SESSION_COOKIE, IDENTITY_SOCIAL_COOKIE } from "./session.policy"

/** Reads the exact opaque session credential without accepting a client identity claim. */
export const toIdentityReference = (cookie: OptionalIdentityReference): OptionalIdentityReference =>
    readIdentityCookie(cookie, IDENTITY_SESSION_COOKIE)

/** Clears a refused credential before the common error filter writes the refusal schema. */
export const writeIdentitySession = (
    response: IdentityResponseWriter,
    result: IdentityReadResult,
): IdentitySessionView => {
    response.setHeader("Cache-Control", "no-store")
    response.setHeader("Set-Cookie", result.cookies)
    return unwrapOutcome(result, IdentityError)
}

/** Sets the host-only session cookie of a session just issued, with the durable lifetime as its Max-Age. */
export const writeIdentityIssued = (response: IdentityResponseWriter, issued: SessionIssued): void => {
    response.setHeader("Cache-Control", "no-store")
    response.setHeader("Set-Cookie", [
        issueIdentityCookie(IDENTITY_SESSION_COOKIE, issued.reference, issued.maxAgeSeconds),
    ])
}

/** Reads the social sign-in binding of the browser's pre-authentication cookie, exactly as it was set. */
export const toSocialBinding = (cookie: OptionalIdentityReference): OptionalIdentityReference =>
    readIdentityCookie(cookie, IDENTITY_SOCIAL_COOKIE)

/** Binds a social sign-in just started to this browser with the short-lived host-only pre-authentication cookie. */
export const writeSocialBinding = (response: IdentityResponseWriter, started: SocialStarted): void => {
    response.setHeader("Cache-Control", "no-store")
    response.setHeader("Set-Cookie", [
        issueIdentityCookie(IDENTITY_SOCIAL_COOKIE, started.binding, started.bindingMaxAgeSeconds),
    ])
}

/** Sets the session cookie of a finished social sign-in and deletes its spent pre-authentication cookie. */
export const writeSocialIssued = (response: IdentityResponseWriter, issued: SocialSessionIssued): void => {
    response.setHeader("Cache-Control", "no-store")
    response.setHeader("Set-Cookie", [
        issueIdentityCookie(IDENTITY_SESSION_COOKIE, issued.reference, issued.maxAgeSeconds),
        deleteIdentityCookie(IDENTITY_SOCIAL_COOKIE),
    ])
}

/** Applies browser cleanup before unwrapping a failed local revocation. */
export const writeIdentityLogout = (response: IdentityResponseWriter, result: IdentityLogoutResult): void => {
    response.setHeader("Cache-Control", "no-store")
    response.setHeader("Set-Cookie", result.cookies)
    unwrapOutcome(result, IdentityError)
}
