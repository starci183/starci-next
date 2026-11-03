import type { Request, Response } from "express"
import {
    toIdentityCallback,
    toIdentityReference,
    writeIdentityLogout,
    writeIdentityRedirect,
    writeIdentitySession,
} from "@modules/domain/identity"
import type {
    IdentityLogoutResult,
    IdentityReadResult,
    IdentityRedirectView,
    IdentitySessionView,
} from "@modules/domain/identity"
import type { SignInCallbackRequest } from "../../application/sign-in-callback.contracts"
import type { CurrentSessionRequest } from "../../application/current-session.contracts"

/** Maps transient callback transport values through identity's bounded protocol reader. */
export const toCallbackRequest = (request: Request): SignInCallbackRequest =>
    toIdentityCallback(
        { state: request.query.state, code: request.query.code, error: request.query.error, iss: request.query.iss },
        request.headers.cookie,
    )

/** Maps the cookie header through identity's exact credential reader. */
export const toSessionRequest = (cookie: string | undefined): CurrentSessionRequest => ({
    reference: toIdentityReference(cookie),
})

/** Sends identity's cookie and redirect result without forwarding internal evidence. */
export const sendIdentityRedirect = (response: Response, result: IdentityRedirectView): void =>
    writeIdentityRedirect(response, result)

/** Applies identity's authenticated schema or explicit refusal. */
export const toSessionResponse = (response: Response, result: IdentityReadResult): IdentitySessionView =>
    writeIdentitySession(response, result)

/** Applies identity's browser cleanup before provider navigation. */
export const sendSignOutRedirect = (response: Response, result: IdentityLogoutResult): void =>
    writeIdentityLogout(response, result)
