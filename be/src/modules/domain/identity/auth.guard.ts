import { Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common"
import type { Reflector } from "@nestjs/core"
import { InjectReflector } from "@modules/platform/composition"
import { requestOf } from "@modules/platform/http-security"
import { unwrapOutcome } from "@modules/platform/primitives"
import { admit } from "./admission.policy"
import type { CredentialMetadata } from "./credential.contracts"
import { IdentityError } from "./errors/identity.error"
import type { PublicMetadata } from "./identity.contracts"
import { CREDENTIAL_KEY, PUBLIC_KEY } from "./identity.decorators"
import { SessionService } from "./session.service"
import { readIdentityCookie } from "./session-http.policy"
import { IDENTITY_SESSION_COOKIE } from "./session.policy"

@Injectable()
/**
 * The fourth app guard and the default-deny gate: a door is open only when it says `@Public({ reason })`, or when it is
 * marked `@Credential` and `CredentialGuard` has set the credential principal. It never calls another guard.
 */
export class AuthGuard implements CanActivate {
    constructor(
        @InjectReflector() private readonly reflector: Reflector,
        private readonly sessions: SessionService,
    ) {}

    /** Lets public and credential-authenticated doors through and refuses every other door. */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const targets = [context.getHandler(), context.getClass()]
        const required = this.reflector.getAllAndOverride<CredentialMetadata | undefined>(CREDENTIAL_KEY, targets)
        const metadata = this.reflector.getAllAndOverride<PublicMetadata | undefined>(PUBLIC_KEY, targets)
        const credential =
            required === undefined ? undefined : { required, principal: requestOf(context).credentialPrincipal }
        const admission = admit(metadata, credential)
        if (admission.kind === "refused" && required === undefined && metadata === undefined) {
            const request = requestOf(context)
            delete request.identityPrincipal
            request.identityPrincipal = (
                await this.sessions.require(readIdentityCookie(request.headers.cookie, IDENTITY_SESSION_COOKIE))
            ).identity
            return true
        }
        unwrapOutcome(admission, IdentityError)
        return true
    }
}
