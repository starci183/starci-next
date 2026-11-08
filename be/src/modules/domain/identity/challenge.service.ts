import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import type {
    ChallengePurpose,
    ClaimedChallenge,
    IssueChallengeParams,
    IssuedChallenge,
    RotatedChallenge,
} from "./challenge.contracts"
import { toRotatedChallenge } from "./challenge.mapper"
import { challengeExpiry, codeDigest, generateCode } from "./challenge.policy"
import { IdentityError, IdentityErrorCode } from "./errors/identity.error"
import { InjectIdentityOptions } from "./identity.decorators"
import type { IdentityOptions } from "./identity.options"
import type { ChallengeAttemptRow, ChallengeRotatedRow } from "./persistence/challenges.rows"
import { ATTEMPT_CHALLENGE, INSERT_CHALLENGE, ROTATE_CHALLENGE_CODE } from "./persistence/challenges.sql"
import { deriveKey, seal, unseal } from "./secret.policy"
import { randomReference, referenceDigest, validReference } from "./session.policy"

@Injectable()
/** Owns emailed-code challenges: opens them, judges codes atomically and rotates codes; the only writer of their table. */
export class ChallengeService {
    private readonly sealKey: Buffer
    private readonly codeKey: Buffer

    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectIdentityOptions() private readonly options: IdentityOptions,
    ) {
        this.sealKey = deriveKey(options.sessionEncryptionKey, "seal")
        this.codeKey = deriveKey(options.sessionEncryptionKey, "code")
    }

    /** Opens a challenge: only the digests of its reference and code are stored, its payload sealed. */
    async issue(params: IssueChallengeParams): Promise<IssuedChallenge> {
        const now = this.clock.now()
        const challenge = randomReference()
        const digest = referenceDigest(challenge)
        const code = generateCode()
        const expiresAt = challengeExpiry(now, this.options.challengeTtlSeconds)
        await this.entityManager
            .query(INSERT_CHALLENGE, [
                digest,
                params.purpose,
                params.email,
                params.locale,
                codeDigest(this.codeKey, digest, code),
                this.options.challengeMaxAttempts,
                params.deliver,
                seal(JSON.stringify(params.payload), this.sealKey),
                expiresAt,
                now,
            ])
            .catch((cause: unknown) => {
                throw new IdentityError({ code: IdentityErrorCode.SessionUnavailable, cause })
            })
        return { challenge, code, expiresAt }
    }

    /**
     * Judges one code in one statement: a right code consumes the challenge and releases its payload, a wrong one spends
     * an attempt and refuses with the attempts left, and an unknown, consumed, expired or exhausted challenge refuses.
     */
    async attempt(purpose: ChallengePurpose, challenge: string, code: string): Promise<ClaimedChallenge> {
        if (!validReference(challenge)) throw new IdentityError({ code: IdentityErrorCode.ChallengeExpired })
        const digest = referenceDigest(challenge)
        const rows = await this.entityManager
            .query<Array<ChallengeAttemptRow>>(ATTEMPT_CHALLENGE, [
                digest,
                purpose,
                codeDigest(this.codeKey, digest, code),
                this.clock.now(),
            ])
            .catch((cause: unknown) => {
                throw new IdentityError({ code: IdentityErrorCode.SessionUnavailable, cause })
            })
        const row = rows[0]
        if (row === undefined) throw new IdentityError({ code: IdentityErrorCode.ChallengeExpired })
        if (!row.matched)
            throw new IdentityError({
                code: IdentityErrorCode.CodeMismatch,
                params: { attemptsLeft: row.attempts_left },
            })
        if (row.payload === null) throw new IdentityError({ code: IdentityErrorCode.SessionUnavailable })
        return { email: row.email, payload: unseal(row.payload, this.sealKey) }
    }

    /** Replaces the code of a live challenge, restores its attempts and keeps its expiry. */
    async rotate(challenge: string): Promise<RotatedChallenge> {
        if (!validReference(challenge)) throw new IdentityError({ code: IdentityErrorCode.ChallengeExpired })
        const digest = referenceDigest(challenge)
        const code = generateCode()
        const rows = await this.entityManager
            .query<Array<ChallengeRotatedRow>>(ROTATE_CHALLENGE_CODE, [
                digest,
                codeDigest(this.codeKey, digest, code),
                this.options.challengeMaxAttempts,
                this.clock.now(),
            ])
            .catch((cause: unknown) => {
                throw new IdentityError({ code: IdentityErrorCode.SessionUnavailable, cause })
            })
        const row = rows[0]
        if (row === undefined) throw new IdentityError({ code: IdentityErrorCode.ChallengeExpired })
        return toRotatedChallenge(row, code)
    }
}
