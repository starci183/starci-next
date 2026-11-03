import { Injectable } from "@nestjs/common"
import { IdentityError, IdentityErrorCode } from "./errors/identity.error"
import type { IdentityCallback, OptionalIdentityReference } from "./session.contracts"
import type { IdentityLogoutResult, IdentityReadResult, IdentityRedirectView } from "./session-http.contracts"
import { callbackRedirect, deleteIdentityCookie, issueIdentityCookie } from "./session-http.policy"
import { IDENTITY_LOGIN_COOKIE, IDENTITY_SESSION_COOKIE } from "./session.policy"
import { SessionService } from "./session.service"

@Injectable()
/** Owns session response policy, keeping redirect-only callback failures out of the HTTP error channel. */
export class SessionHttpService {
    constructor(private readonly sessions: SessionService) {}

    /** Starts the browser handshake with its separate five-minute binding cookie. */
    async start(): Promise<IdentityRedirectView> {
        const result = await this.sessions.start()
        return {
            url: result.authorizationUrl,
            cookies: [issueIdentityCookie(IDENTITY_LOGIN_COOKIE, result.binding, result.maxAgeSeconds)],
        }
    }

    /** Always answers a fixed safe app redirect after consuming the provider response. */
    async callback(input: IdentityCallback): Promise<IdentityRedirectView> {
        return callbackRedirect(await this.sessions.callback(input))
    }

    /** Returns the authenticated schema or an explicit refusal with browser cleanup. */
    async current(reference: OptionalIdentityReference): Promise<IdentityReadResult> {
        try {
            return { kind: "ok", value: await this.sessions.require(reference), cookies: [] }
        } catch (cause) {
            return {
                kind: "refused",
                code: cause instanceof IdentityError ? cause.code : IdentityErrorCode.SessionUnavailable,
                cause,
                cookies: [deleteIdentityCookie(IDENTITY_SESSION_COOKIE)],
            }
        }
    }

    /** Always clears the browser credential, including uncertain durable revocation. */
    async signOut(reference: OptionalIdentityReference): Promise<IdentityLogoutResult> {
        const cookies = [deleteIdentityCookie(IDENTITY_SESSION_COOKIE)]
        try {
            const result = await this.sessions.signOut(reference)
            return { kind: "ok", value: { url: result.redirectUrl, cookies, cause: result.cause }, cookies }
        } catch (cause) {
            return { kind: "refused", code: IdentityErrorCode.SessionUnavailable, cause, cookies }
        }
    }
}
