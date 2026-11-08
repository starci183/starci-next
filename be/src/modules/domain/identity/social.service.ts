import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import type { ClaimedSocialBundle, OptionalReturnTo, SocialBundle } from "./challenge.contracts"
import { challengeExpiry } from "./challenge.policy"
import { IdentityError, IdentityErrorCode } from "./errors/identity.error"
import { InjectIdentityOptions } from "./identity.decorators"
import type { IdentityOptions } from "./identity.options"
import type { SocialBundleRow } from "./persistence/challenges.rows"
import { CLAIM_SOCIAL_BUNDLE, INSERT_SOCIAL_BUNDLE } from "./persistence/challenges.sql"
import { safeReturnTo } from "./return-to.policy"
import { pkceChallenge, randomReference, referenceDigest, validReference } from "./session.policy"

@Injectable()
/** Owns the one-use PKCE bundles of social sign-ins in flight; the only writer of their table. */
export class SocialService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectIdentityOptions() private readonly options: IdentityOptions,
    ) {}

    /** Mints state, nonce and verifier, stores them with the validated return path and answers the public half. */
    async begin(returnTo: OptionalReturnTo): Promise<SocialBundle> {
        const now = this.clock.now()
        const state = randomReference()
        const nonce = randomReference()
        const verifier = randomReference()
        await this.entityManager
            .query(INSERT_SOCIAL_BUNDLE, [
                referenceDigest(state),
                nonce,
                verifier,
                safeReturnTo(returnTo),
                challengeExpiry(now, this.options.challengeTtlSeconds),
                now,
            ])
            .catch((cause: unknown) => {
                throw new IdentityError({ code: IdentityErrorCode.SessionUnavailable, cause })
            })
        return { state, nonce, codeChallenge: pkceChallenge(verifier), maxAgeSeconds: this.options.challengeTtlSeconds }
    }

    /** Consumes a bundle exactly once; a malformed, unknown, replayed or expired state refuses. */
    async claim(state: string): Promise<ClaimedSocialBundle> {
        if (!validReference(state)) throw new IdentityError({ code: IdentityErrorCode.SocialStateInvalid })
        const rows = await this.entityManager
            .query<Array<SocialBundleRow>>(CLAIM_SOCIAL_BUNDLE, [referenceDigest(state), this.clock.now()])
            .catch((cause: unknown) => {
                throw new IdentityError({ code: IdentityErrorCode.SessionUnavailable, cause })
            })
        const row = rows[0]
        if (row === undefined) throw new IdentityError({ code: IdentityErrorCode.SocialStateInvalid })
        return { nonce: row.nonce, codeVerifier: row.code_verifier, returnTo: safeReturnTo(row.return_to) }
    }
}
