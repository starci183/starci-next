import { Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common"
import type { Reflector } from "@nestjs/core"
import type { EntityManager } from "typeorm"
import type { VerifyAccessToken } from "@modules/integrations/passport"
import { InjectReflector } from "@modules/platform/composition"
import type { Principal } from "@modules/platform/cqrs"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { requestOf } from "@modules/platform/http-security"
import { unwrapOutcome } from "@modules/platform/primitives"
import { admit } from "./admission.policy"
import type { CredentialMetadata } from "./credential.contracts"
import { IdentityError, IdentityErrorCode } from "./errors/identity.error"
import { PublicReason, type IdentityPrincipal, type PublicMetadata } from "./identity.contracts"
import { CREDENTIAL_KEY, InjectAccessTokenVerifier, PUBLIC_KEY } from "./identity.decorators"
import { rolesOf } from "./account-roles.policy"
import { accountDoors, fullNameOf } from "./persistence/account-doors.port"

const toPrincipalOf = (identity: IdentityPrincipal): Principal => ({
    id: identity.subject,
    role: "authenticated",
    ...(identity.email === null ? {} : { email: identity.email }),
})

const bearerToken = (authorization: string | undefined): string | undefined => {
    const [scheme, token, extra] = authorization?.split(" ") ?? []
    return scheme?.toLowerCase() === "bearer" && token && extra === undefined ? token : undefined
}

@Injectable()
/**
 * The fourth app guard and default-deny gate: a credential door requires the matching principal from `CredentialGuard`,
 * a public door states its reason, and every other door requires a principal verified from the app's own access token whose
 * account still stands. The roles and name of the account are read from it afresh on every request. It never calls another guard.
 */
export class AuthGuard implements CanActivate {
    constructor(
        @InjectReflector() private readonly reflector: Reflector,
        @InjectAccessTokenVerifier() private readonly verifyAccessToken: VerifyAccessToken,
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
    ) {}

    /** Verifies session tokens only for doors without public or credential metadata, then applies the admission policy. */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const targets = [context.getHandler(), context.getClass()]
        const required = this.reflector.getAllAndOverride<CredentialMetadata | undefined>(CREDENTIAL_KEY, targets)
        const metadata = this.reflector.getAllAndOverride<PublicMetadata | undefined>(PUBLIC_KEY, targets)
        const credential =
            required === undefined ? undefined : { required, principal: requestOf(context).credentialPrincipal }
        if (metadata?.reason === PublicReason.GuestRead && required === undefined) {
            await this.admitGuestOrLearner(requestOf(context))
            return true
        }
        let principal: Principal | undefined
        if (metadata === undefined && required === undefined) {
            const request = requestOf(context)
            const token = bearerToken(request.headers.authorization)
            if (token !== undefined) {
                const verified = await this.verifyAccessToken(token)
                if (verified.kind === "ok") {
                    const identity = await this.standing(verified.value.id, verified.value.email)
                    principal = toPrincipalOf(identity)
                    request.principal = principal
                    request.identityPrincipal = identity
                }
            }
        }
        unwrapOutcome(admit(metadata, principal, credential), IdentityError)
        return true
    }

    /**
     * Sets the principal when the request carries a valid access token of a standing account; a missing, expired, forged or
     * unknown token is a guest. It never creates a session and never refuses.
     */
    private async admitGuestOrLearner(request: ReturnType<typeof requestOf>): Promise<void> {
        delete request.principal
        delete request.identityPrincipal
        const token = bearerToken(request.headers.authorization)
        if (token === undefined) return
        const verified = await this.verifyAccessToken(token)
        if (verified.kind !== "ok") return
        try {
            const identity = await this.standing(verified.value.id, verified.value.email)
            request.principal = toPrincipalOf(identity)
            request.identityPrincipal = identity
        } catch (error) {
            if (
                error instanceof IdentityError &&
                (error.code === IdentityErrorCode.Unauthenticated || error.code === IdentityErrorCode.AccountDisabled)
            )
                return
            throw error
        }
    }

    /** The account behind a verified token: refused when it is gone or disabled, else its roles, name and email. */
    private async standing(userId: string, tokenEmail: string | undefined): Promise<IdentityPrincipal> {
        const account = await accountDoors.userById(this.entityManager, userId)
        if (account === undefined) throw new IdentityError({ code: IdentityErrorCode.Unauthenticated })
        if (account.disabled) throw new IdentityError({ code: IdentityErrorCode.AccountDisabled })
        return {
            subject: account.id,
            roles: rolesOf(account.meta),
            displayName: fullNameOf(account.meta) ?? null,
            email: account.email ?? tokenEmail ?? null,
        }
    }
}
