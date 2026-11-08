import type { Response } from "express"
import {
    toIdentityReference,
    toSocialBinding,
    writeIdentityIssued,
    writeIdentityLogout,
    writeIdentitySession,
    writeSocialBinding,
    writeSocialIssued,
    type IdentityLogoutResult,
    type IdentityReadResult,
    type IdentitySessionView,
    type SessionIssued,
    type SocialSessionIssued,
    type SocialStarted,
} from "@modules/domain/identity"
import type { SocialExchangeResponse } from "./dto/social-exchange.response"
import type { SocialStartResponse } from "./dto/social-start.response"
import { toSocialStartResponse } from "./credential.mapper"
import type { CurrentSessionRequest } from "../../application/current-session.contracts"

/** Maps the cookie header through identity's exact credential reader. */
export const toSessionRequest = (cookie: string | undefined): CurrentSessionRequest => ({
    reference: toIdentityReference(cookie),
})

/** Sets the host-only session cookie for a freshly issued session. */
export const sendSessionIssued = (response: Response, issued: SessionIssued): void =>
    writeIdentityIssued(response, issued)

/** Reads the browser's social sign-in binding from the cookie header. */
export const toSocialBindingOf = (cookie: string | undefined): string | undefined => toSocialBinding(cookie)

/** Sets the pre-authentication cookie of a social start and answers only the provider URL. */
export const sendSocialStarted = (response: Response, started: SocialStarted): SocialStartResponse => {
    writeSocialBinding(response, started)
    return toSocialStartResponse(started)
}

/** Sets the session cookie of a social sign-in, deletes its binding cookie and answers only the validated landing path. */
export const sendSocialSession = (response: Response, issued: SocialSessionIssued): SocialExchangeResponse => {
    writeSocialIssued(response, issued)
    return { returnTo: issued.returnTo }
}

/** Applies identity's authenticated schema or explicit refusal. */
export const toSessionResponse = (response: Response, result: IdentityReadResult): IdentitySessionView =>
    writeIdentitySession(response, result)

/** Clears the credential and answers no content; a refused local revocation still clears it and then fails. */
export const sendSignedOut = (response: Response, result: IdentityLogoutResult): void =>
    writeIdentityLogout(response, result)
