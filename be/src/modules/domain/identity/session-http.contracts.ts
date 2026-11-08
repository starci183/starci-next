import type { IdentitySessionView } from "./session.contracts"
import type { IdentityErrorCode } from "./errors/identity.error"
import type { Outcome } from "@modules/platform/primitives"

/** Identity writes only textual headers, including multiple independent host cookies. */
type IdentityHeaderValue = string | ReadonlyArray<string>

/** The minimal response effects used by identity's cookie policy. */
export interface IdentityResponseWriter {
    /** Sets one header without serializing an internal outcome. */
    setHeader(name: string, value: IdentityHeaderValue): void
}

/** Cookie cleanup and internal evidence accompany an outcome without entering its JSON payload. */
interface IdentityResponseCookies {
    /** Host-only issuance or cleanup instructions. */
    readonly cookies: ReadonlyArray<string>
    /** The cause retained internally when an operation failed. */
    readonly cause?: unknown
}

/** A session read carries cookie cleanup even when it must refuse. */
export type IdentityReadResult = Outcome<IdentitySessionView, IdentityErrorCode> & IdentityResponseCookies

/** Sign-out clears the browser credential even if local persistence cannot confirm revocation. */
export type IdentityLogoutResult = Outcome<null, IdentityErrorCode> & IdentityResponseCookies
