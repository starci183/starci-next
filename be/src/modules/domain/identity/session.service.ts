import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectKeycloakGateway, type KeycloakGateway } from "@modules/integrations/keycloak"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { IdentityError, IdentityErrorCode } from "./errors/identity.error"
import { InjectIdentityOptions } from "./identity.decorators"
import { IdentityLogEvent } from "./identity.log-events"
import type { IdentityOptions } from "./identity.options"
import type { IdentitySessionRow, RevokedSessionRow, RotatedSessionRow } from "./persistence/sessions.rows"
import {
    FIND_IDENTITY_SESSION,
    INSERT_IDENTITY_SESSION,
    REVOKE_IDENTITY_SESSION,
    REVOKE_IDENTITY_SESSIONS_OF_SUBJECT,
    ROTATE_IDENTITY_SESSION,
} from "./persistence/sessions.sql"
import { toLearnerProfile } from "./learner-profile.policy"
import { providerUnreachable } from "./provider-failure.policy"
import { deriveKey, seal, unseal } from "./secret.policy"
import type {
    IdentitySessionView,
    OptionalIdentityReference,
    RenewOutcome,
    SessionIssued,
    SessionTokens,
} from "./session.contracts"
import { toSessionView } from "./session.mapper"
import { randomReference, referenceDigest, refreshDue, sessionExpiry, validReference } from "./session.policy"

@Injectable()
/** Owns durable opaque sessions: issue, read with server-side refresh, and revoke; the only writer of their table. */
export class SessionService {
    private readonly sealKey: Buffer
    private readonly refreshing = new Map<string, Promise<IdentitySessionRow>>()

    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectLogger() private readonly logger: Logger,
        @InjectKeycloakGateway() private readonly gateway: KeycloakGateway,
        @InjectIdentityOptions() private readonly options: IdentityOptions,
    ) {
        this.sealKey = deriveKey(options.sessionEncryptionKey, "seal")
    }

    /** Persists a session for verified provider tokens before the caller may hand out its reference. */
    async issue(tokens: SessionTokens): Promise<SessionIssued> {
        const now = this.clock.now()
        const expiresAt = sessionExpiry(tokens.refreshExpiresAt, now, this.options.sessionMaxSeconds)
        const maxAgeSeconds = Math.floor((expiresAt.getTime() - now.getTime()) / 1000)
        if (maxAgeSeconds <= 0) throw new IdentityError({ code: IdentityErrorCode.SessionUnavailable })
        const reference = randomReference()
        await this.entityManager
            .query(INSERT_IDENTITY_SESSION, [
                referenceDigest(reference),
                tokens.subject,
                JSON.stringify(tokens.roles),
                seal(tokens.refreshToken, this.sealKey),
                tokens.refreshExpiresAt,
                expiresAt,
                now,
                tokens.displayName,
                tokens.email,
            ])
            .catch((cause: unknown) => {
                throw new IdentityError({ code: IdentityErrorCode.SessionUnavailable, cause })
            })
        return { reference, expiresAt, maxAgeSeconds }
    }

    /** Reads durable expiry and revocation on every call, refreshing provider tokens first when they are closing. */
    async require(reference: OptionalIdentityReference): Promise<IdentitySessionView> {
        if (!validReference(reference)) throw new IdentityError({ code: IdentityErrorCode.SessionRequired })
        const digest = referenceDigest(reference)
        const now = this.clock.now()
        const row = await this.find(digest, now)
        const timing = { issuedAt: row.issued_at, expiresAt: row.expires_at, refreshExpiresAt: row.refresh_expires_at }
        return toSessionView(
            refreshDue(timing, now, this.options.sessionMaxSeconds) ? await this.coalesced(digest, row, now) : row,
        )
    }

    /** Commits local revocation first, then revokes the provider refresh token; absence is idempotent. */
    async signOut(reference: OptionalIdentityReference): Promise<void> {
        if (!validReference(reference)) return
        const rows = await this.revoke(referenceDigest(reference), this.clock.now())
        const sealed = rows[0]?.refresh_ciphertext
        if (sealed === undefined) return
        try {
            await this.gateway.revoke(unseal(sealed, this.sealKey))
        } catch (cause) {
            this.logger.error(IdentityLogEvent.ProviderRevokeFailed, cause)
        }
    }

    /** Revokes every live session of one learner, as a password reset requires. */
    async revokeAllOf(subject: string): Promise<void> {
        await this.entityManager
            .query(REVOKE_IDENTITY_SESSIONS_OF_SUBJECT, [subject, this.clock.now()])
            .catch((cause: unknown) => {
                throw new IdentityError({ code: IdentityErrorCode.SessionUnavailable, cause })
            })
    }

    private async find(digest: string, now: Date): Promise<IdentitySessionRow> {
        const rows = await this.entityManager
            .query<Array<IdentitySessionRow>>(FIND_IDENTITY_SESSION, [digest, now])
            .catch((cause: unknown) => {
                throw new IdentityError({ code: IdentityErrorCode.SessionUnavailable, cause })
            })
        const row = rows[0]
        if (row === undefined) throw new IdentityError({ code: IdentityErrorCode.SessionRequired })
        return row
    }

    private revoke(digest: string, now: Date): Promise<Array<RevokedSessionRow>> {
        return this.entityManager
            .query<Array<RevokedSessionRow>>(REVOKE_IDENTITY_SESSION, [digest, now])
            .catch((cause: unknown) => {
                throw new IdentityError({ code: IdentityErrorCode.SessionUnavailable, cause })
            })
    }

    private coalesced(digest: string, row: IdentitySessionRow, now: Date): Promise<IdentitySessionRow> {
        const running = this.refreshing.get(digest)
        if (running !== undefined) return running
        const started = this.refresh(digest, row, now).finally(() => {
            this.refreshing.delete(digest)
        })
        this.refreshing.set(digest, started)
        return started
    }

    private async refresh(digest: string, row: IdentitySessionRow, now: Date): Promise<IdentitySessionRow> {
        const renewed = await this.renew(row)
        if (renewed.kind === "failed") return this.afterFailedRefresh(digest, row, renewed.cause, now)
        const tokens = renewed.tokens
        const profile = toLearnerProfile(tokens)
        const sealed = seal(tokens.refreshToken, this.sealKey)
        const expiresAt = sessionExpiry(tokens.refreshExpiresAt, row.issued_at, this.options.sessionMaxSeconds)
        const rotated = await this.entityManager
            .query<Array<RotatedSessionRow>>(ROTATE_IDENTITY_SESSION, [
                digest,
                row.refresh_ciphertext,
                sealed,
                tokens.refreshExpiresAt,
                expiresAt,
                JSON.stringify(tokens.roles),
                now,
                profile.displayName,
                profile.email,
            ])
            .catch((cause: unknown) => {
                throw new IdentityError({ code: IdentityErrorCode.SessionUnavailable, cause })
            })
        if (rotated[0] === undefined) return this.find(digest, now)
        return {
            ...row,
            roles: [...tokens.roles],
            display_name: profile.displayName ?? row.display_name,
            email: profile.email ?? row.email,
            refresh_ciphertext: sealed,
            refresh_expires_at: tokens.refreshExpiresAt,
            expires_at: expiresAt,
        }
    }

    private async renew(row: IdentitySessionRow): Promise<RenewOutcome> {
        try {
            return { kind: "renewed", tokens: await this.gateway.refresh(unseal(row.refresh_ciphertext, this.sealKey)) }
        } catch (cause) {
            return { kind: "failed", cause }
        }
    }

    private async afterFailedRefresh(
        digest: string,
        row: IdentitySessionRow,
        cause: unknown,
        now: Date,
    ): Promise<IdentitySessionRow> {
        if (providerUnreachable(cause)) {
            this.logger.error(IdentityLogEvent.RefreshUnavailable, cause)
            return row
        }
        await this.revoke(digest, now)
        throw new IdentityError({ code: IdentityErrorCode.SessionRequired, cause })
    }
}
