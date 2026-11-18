import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { ExperienceReadService } from "@modules/domain/career"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { eachInOrder } from "@modules/platform/primitives"
import { ProfileError, ProfileErrorCode } from "./errors/profile.error"
import { CV_SLUG_ATTEMPTS, cvPathOf, cvSlugBaseOf, cvSlugCandidateOf, isUniqueViolation } from "./profile-cv.policy"
import type { CvLinkParams, CvLinkView, CvVisibilityParams, PublicCvParams, PublicCvView } from "./profile.contracts"
import type { CvRow, PublicCvRow } from "./persistence/profile.rows"
import { SELECT_CV, SELECT_PUBLIC_CV, SET_CV_PUBLIC, UPSERT_CV_SLUG } from "./persistence/profile.sql"
import { ProfileService } from "./profile.service"

@Injectable()
/**
 * The CV link of a learner: a slug made once from the display name or the account name (ASCII-folded, kebab-case, a numeric
 * suffix when taken), a switch that makes the CV public, and the public read of the verified lines the learner shows. A CV is
 * private until its learner makes it public; the public read answers the lines only, never a score, a reviewer or an e-mail.
 */
export class ProfileCvService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        private readonly profiles: ProfileService,
        private readonly experience: ExperienceReadService,
    ) {}

    /** The CV link of a learner; the first read makes the slug. */
    async link(params: CvLinkParams): Promise<CvLinkView> {
        const row = await this.ensureSlug(params)
        return this.viewOf(params.learnerId, row)
    }

    /** Makes the CV public or private and answers the link. */
    async setVisibility(params: CvVisibilityParams): Promise<CvLinkView> {
        await this.ensureSlug(params)
        await this.entityManager.query(SET_CV_PUBLIC, [params.learnerId, params.isPublic, this.clock.now()])
        const row = await this.ensureSlug(params)
        return this.viewOf(params.learnerId, row)
    }

    /** The public CV of a slug: the person and the verified lines they show; a private or unknown CV is PROFILE_CV_NOT_FOUND. */
    async publicCv(params: PublicCvParams): Promise<PublicCvView> {
        const rows: Array<PublicCvRow> = await this.entityManager.query(SELECT_PUBLIC_CV, [params.slug])
        const row = rows[0]
        if (row === undefined) throw new ProfileError({ code: ProfileErrorCode.CvNotFound })
        const lines = await this.experience.publicLines(row.learner_id, params.locale)
        return {
            displayName: row.display_name ?? row.account_name ?? row.cv_slug,
            avatarUrl: row.avatar_key === null ? null : await this.profiles.avatarUrlOf(row.avatar_key),
            lines: lines.map((line) => ({
                line: line.line,
                source: line.part,
                verificationCode: line.verificationCode,
                signedAt: line.signedAt,
                signerRole: line.signerRole,
                subject: line.subject,
                evidence: line.evidence.map((entry) => ({ kind: entry.kind, count: entry.count })),
            })),
        }
    }

    /** The row of the learner with a slug: made now from the name when there is none, kept when there is one. */
    private async ensureSlug(params: CvLinkParams): Promise<CvRow & { readonly cv_slug: string }> {
        const held = await this.rowOf(params.learnerId)
        if (held?.cv_slug !== undefined && held.cv_slug !== null) {
            if (params.accountName !== null && params.accountName !== held.account_name)
                await this.entityManager.query(UPSERT_CV_SLUG, [
                    params.learnerId,
                    held.cv_slug,
                    params.accountName,
                    this.clock.now(),
                ])
            return { ...held, cv_slug: held.cv_slug }
        }
        const base = cvSlugBaseOf(held?.display_name ?? params.accountName ?? "")
        await this.storeSlug(params, base)
        const stored = await this.rowOf(params.learnerId)
        if (stored?.cv_slug === undefined || stored.cv_slug === null)
            throw new ProfileError({ code: ProfileErrorCode.CvNotFound })
        return { ...stored, cv_slug: stored.cv_slug }
    }

    /** Tries the base, then the base with suffix 2, 3 and so on until the unique index accepts one. */
    private async storeSlug(params: CvLinkParams, base: string): Promise<void> {
        const attempts = Array.from({ length: CV_SLUG_ATTEMPTS }, (_unused, index) => index + 1)
        let stored = false
        await eachInOrder(attempts, async (attempt) => {
            if (stored) return
            try {
                await this.entityManager.query(UPSERT_CV_SLUG, [
                    params.learnerId,
                    cvSlugCandidateOf(base, attempt),
                    params.accountName,
                    this.clock.now(),
                ])
                stored = true
            } catch (cause) {
                if (!isUniqueViolation(cause)) throw cause
            }
        })
        if (!stored) throw new ProfileError({ code: ProfileErrorCode.CvNotFound })
    }

    private async viewOf(learnerId: string, row: CvRow & { readonly cv_slug: string }): Promise<CvLinkView> {
        const verified = await this.experience.verifiedItems(learnerId)
        return {
            slug: row.cv_slug,
            path: cvPathOf(row.cv_slug),
            isPublic: row.cv_public,
            verifiedCount: verified.length,
        }
    }

    private async rowOf(learnerId: string): Promise<CvRow | null> {
        const rows: Array<CvRow> = await this.entityManager.query(SELECT_CV, [learnerId])
        return rows[0] ?? null
    }
}
