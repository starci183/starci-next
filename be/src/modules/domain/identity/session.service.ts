import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectKeycloak } from "@modules/integrations/keycloak"
import type { KeycloakClient } from "@modules/integrations/keycloak"
import { InjectClock } from "@modules/platform/clock"
import type { Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { IdentityError, IdentityErrorCode } from "./errors/identity.error"
import { InjectIdentityOptions } from "./identity.decorators"
import type { IdentityOptions } from "./identity.options"
import type {
    IdentityCallback,
    IdentityCallbackResult,
    IdentitySessionView,
    IdentitySignOut,
    IdentityStart,
    OptionalIdentityReference,
} from "./session.contracts"
import type { IdentitySessionRow, LoginTransactionRow } from "./persistence/sessions.rows"
import {
    CLAIM_LOGIN_TRANSACTION,
    FIND_IDENTITY_SESSION,
    INSERT_IDENTITY_SESSION,
    INSERT_LOGIN_TRANSACTION,
    REVOKE_IDENTITY_SESSION,
} from "./persistence/sessions.sql"
import { pkceChallenge, randomReference, referenceDigest, validReference } from "./session.policy"

@Injectable()
/** Owns browser-bound one-use login and durable opaque session authority; no provider token is retained. */
export class SessionService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectKeycloak() private readonly keycloak: KeycloakClient,
        @InjectIdentityOptions() private readonly options: IdentityOptions,
    ) {}

    /** Persists a browser-bound transaction before permitting navigation to the provider. */
    async start(): Promise<IdentityStart> {
        const now = this.clock.now()
        const state = randomReference()
        const binding = randomReference()
        const nonce = randomReference()
        const verifier = randomReference()
        const authorizationUrl = await this.keycloak
            .authorization({ state, nonce, challenge: pkceChallenge(verifier) })
            .catch((cause: unknown) => {
                throw new IdentityError({ code: IdentityErrorCode.ProviderUnavailable, cause })
            })
        await this.entityManager
            .query(INSERT_LOGIN_TRANSACTION, [
                referenceDigest(state),
                referenceDigest(binding),
                nonce,
                verifier,
                new Date(now.getTime() + this.options.transactionTtlSeconds * 1000),
            ])
            .catch((cause: unknown) => {
                throw new IdentityError({ code: IdentityErrorCode.ProviderUnavailable, cause })
            })
        return { authorizationUrl, binding, maxAgeSeconds: this.options.transactionTtlSeconds }
    }

    /** Consumes state before a single exchange; every failure is an internal fixed-redirect outcome. */
    async callback(input: IdentityCallback): Promise<IdentityCallbackResult> {
        try {
            const now = this.clock.now()
            await this.revoke(input.sessionReference, now)
            if (!validReference(input.state) || !validReference(input.binding)) return { kind: "error" }
            const rows = await this.entityManager.query<Array<LoginTransactionRow>>(CLAIM_LOGIN_TRANSACTION, [
                referenceDigest(input.state),
                referenceDigest(input.binding),
                now,
            ])
            const transaction = rows[0]
            if (
                transaction === undefined ||
                input.error !== undefined ||
                input.code === undefined ||
                input.code.length === 0 ||
                input.code.length > 4096
            )
                return { kind: "error" }
            const identity = await this.keycloak.exchange({
                code: input.code,
                nonce: transaction.nonce,
                verifier: transaction.verifier,
                ...(input.issuer === undefined ? {} : { issuer: input.issuer }),
            })
            const issuedAt = this.clock.now()
            const expiresAt = new Date(
                Math.min(identity.expiresAt.getTime(), issuedAt.getTime() + this.options.sessionMaxSeconds * 1000),
            )
            const maxAgeSeconds = Math.floor((expiresAt.getTime() - issuedAt.getTime()) / 1000)
            if (maxAgeSeconds <= 0) return { kind: "error" }
            const reference = randomReference()
            await this.entityManager.query(INSERT_IDENTITY_SESSION, [
                referenceDigest(reference),
                identity.issuer,
                identity.subject,
                JSON.stringify(identity.roles),
                expiresAt,
            ])
            return { kind: "success", reference, maxAgeSeconds }
        } catch (cause) {
            return { kind: "error", cause }
        }
    }

    /** Reads durable expiry and revocation on every call; absence always refuses authentication. */
    async require(reference: OptionalIdentityReference): Promise<IdentitySessionView> {
        if (!validReference(reference)) throw new IdentityError({ code: IdentityErrorCode.SessionRequired })
        const rows = await this.entityManager
            .query<Array<IdentitySessionRow>>(FIND_IDENTITY_SESSION, [referenceDigest(reference), this.clock.now()])
            .catch((cause: unknown) => {
                throw new IdentityError({ code: IdentityErrorCode.SessionUnavailable, cause })
            })
        const row = rows[0]
        if (row === undefined) throw new IdentityError({ code: IdentityErrorCode.SessionRequired })
        return {
            identity: { issuer: row.issuer, subject: row.subject, roles: row.roles },
            expiresAt: row.expires_at.toISOString(),
        }
    }

    /** Commits local revocation before asking for the provider logout destination; absence is idempotent. */
    async signOut(reference: OptionalIdentityReference): Promise<IdentitySignOut> {
        await this.revoke(reference, this.clock.now()).catch((cause: unknown) => {
            throw new IdentityError({ code: IdentityErrorCode.SessionUnavailable, cause })
        })
        try {
            return { redirectUrl: await this.keycloak.logout() }
        } catch (cause) {
            return { redirectUrl: "/sign-in?auth=error", cause }
        }
    }

    private async revoke(reference: string | undefined, now: Date): Promise<void> {
        if (validReference(reference))
            await this.entityManager.query(REVOKE_IDENTITY_SESSION, [referenceDigest(reference), now])
    }
}
