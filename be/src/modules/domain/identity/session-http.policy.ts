import { IDENTITY_LOGIN_COOKIE, IDENTITY_SESSION_COOKIE, validReference } from "./session.policy"
import type { IdentityCallbackResult } from "./session.contracts"
import type { IdentityRedirectView } from "./session-http.contracts"

const COOKIE_ATTRIBUTES = "Path=/; Secure; HttpOnly; SameSite=Lax"

/** Deletes an exact host-only authentication cookie with matching attributes. */
export const deleteIdentityCookie = (name: string): string =>
    `${name}=; ${COOKIE_ATTRIBUTES}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`

/** Issues a host-only credential bounded by the actual durable lifetime. */
export const issueIdentityCookie = (name: string, reference: string, seconds: number): string =>
    `${name}=${reference}; ${COOKIE_ATTRIBUTES}; Max-Age=${seconds}`

/** Reads one exact cookie, rejecting duplicate, malformed and encoded credentials. */
export const readIdentityCookie = (header: string | undefined, name: string): string | undefined => {
    const values =
        header
            ?.split(";")
            .map((part) => part.trim())
            .filter((part) => part.startsWith(`${name}=`)) ?? []
    if (values.length !== 1) return undefined
    const reference = values[0]?.slice(name.length + 1)
    return validReference(reference) ? reference : undefined
}

/** Maps a consumed callback to fixed safe navigation and exact cookie issuance or cleanup. */
export const callbackRedirect = (result: IdentityCallbackResult): IdentityRedirectView => ({
    url: result.kind === "success" ? "/sign-in?auth=success" : "/sign-in?auth=error",
    cookies: [
        deleteIdentityCookie(IDENTITY_LOGIN_COOKIE),
        result.kind === "success"
            ? issueIdentityCookie(IDENTITY_SESSION_COOKIE, result.reference, result.maxAgeSeconds)
            : deleteIdentityCookie(IDENTITY_SESSION_COOKIE),
    ],
    ...(result.kind === "error" ? { cause: result.cause } : {}),
})
