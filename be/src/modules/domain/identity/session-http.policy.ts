import { timingSafeEqual } from "node:crypto"
import { validReference } from "./session.policy"

const COOKIE_ATTRIBUTES = "Path=/; Secure; HttpOnly; SameSite=Lax"

/** Deletes an exact host-only authentication cookie with matching attributes. */
export const deleteIdentityCookie = (name: string): string =>
    `${name}=; ${COOKIE_ATTRIBUTES}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`

/** Issues a host-only credential bounded by the actual durable lifetime. */
export const issueIdentityCookie = (name: string, reference: string, seconds: number): string =>
    `${name}=${reference}; ${COOKIE_ATTRIBUTES}; Max-Age=${seconds}`

/** True when the browser's pre-authentication binding is exactly the state it returns with, compared in constant time. */
export const socialBindingHolds = (binding: string | undefined, state: string): boolean => {
    if (binding === undefined || !validReference(state)) return false
    const left = Buffer.from(binding, "utf8")
    const right = Buffer.from(state, "utf8")
    return left.length === right.length && timingSafeEqual(left, right)
}

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
