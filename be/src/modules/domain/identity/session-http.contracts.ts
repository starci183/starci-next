import type { IdentitySessionView } from "./session.contracts"
import type { IdentityErrorCode } from "./errors/identity.error"
import type { Outcome } from "@modules/platform/primitives"

/** Transient provider query values remain untrusted until the identity reader narrows them. */
export interface IdentityCallbackQuery {
    /** Untrusted provider state, including duplicate query shapes. */
    readonly state?: unknown
    /** Untrusted one-use authorization code. */
    readonly code?: unknown
    /** Provider refusal evidence, never forwarded as prose. */
    readonly error?: unknown
    /** Optional authorization response issuer. */
    readonly iss?: unknown
}

/** Identity writes only textual headers, including multiple independent host cookies. */
type IdentityHeaderValue = string | ReadonlyArray<string>

/** The minimal response effects used by identity's cookie and navigation policy. */
export interface IdentityResponseWriter {
    /** Sets one header without serializing an internal outcome. */
    setHeader(name: string, value: IdentityHeaderValue): void
    /** Sends the fixed redirect status and its validated destination. */
    redirect(status: number, url: string): void
}

/** Cookie instructions for a completed identity operation; raw credentials never enter JSON. */
export interface IdentityRedirectView {
    /** Fixed application outcome or validated provider destination. */
    readonly url: string
    /** Exact host-only cookies, including deletion instructions. */
    readonly cookies: ReadonlyArray<string>
    /** Internal failure cause, never sent by the transport. */
    readonly cause?: unknown
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
export type IdentityLogoutResult = Outcome<IdentityRedirectView, IdentityErrorCode> & IdentityResponseCookies
