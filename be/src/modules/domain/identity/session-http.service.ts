import { Injectable } from "@nestjs/common"
import { IdentityError, IdentityErrorCode } from "./errors/identity.error"
import type { OptionalIdentityReference } from "./session.contracts"
import type { IdentityLogoutResult, IdentityReadResult } from "./session-http.contracts"
import { deleteIdentityCookie } from "./session-http.policy"
import { IDENTITY_SESSION_COOKIE } from "./session.policy"
import { SessionService } from "./session.service"

@Injectable()
/** Owns session response policy: a refused read or a sign-out always clears the browser credential. */
export class SessionHttpService {
    constructor(private readonly sessions: SessionService) {}

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
            await this.sessions.signOut(reference)
            return { kind: "ok", value: null, cookies }
        } catch (cause) {
            return { kind: "refused", code: IdentityErrorCode.SessionUnavailable, cause, cookies }
        }
    }
}
