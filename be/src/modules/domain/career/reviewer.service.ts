import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import { InjectCareerOptions } from "./career.decorators"
import type { ReviewerView, SetReviewerParams, Signer } from "./career.contracts"
import { toReviewerView } from "./career.mapper"
import type { CareerOptions } from "./career.options"
import { CareerError, CareerErrorCode } from "./errors/career.error"
import type { ReviewerRow } from "./persistence/career.rows"
import { END_REVIEWER, INSERT_REVIEWER, SELECT_REVIEWERS } from "./persistence/career.sql"
import { requireTeacher } from "./review-access.policy"
import { careerSettingsOf } from "./review-sla.policy"

@Injectable()
/**
 * The reviewer appointments (data.career.reviewer): only the teacher appoints, rescopes or ends a reviewer, and every change keeps
 * the ended appointment for the audit. A reviewer also needs the Keycloak role REVIEWER to sign; the appointment gives the scope.
 */
export class ReviewerService {
    private readonly defaultCapacity: number

    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectCareerOptions() options: CareerOptions,
    ) {
        this.defaultCapacity = careerSettingsOf(options).reviewerCapacity
    }

    /**
     * Appoints a reviewer with a scope, replacing an active appointment, or ends it; ending a subject with no active appointment is
     * refused CAREER_REVIEWER_NOT_FOUND, as is appointing the teacher themself.
     */
    async set(params: SetReviewerParams): Promise<ReviewerView> {
        requireTeacher(params.signer)
        if (params.reviewerId === params.signer.subject) {
            throw new CareerError({ code: CareerErrorCode.ReviewerNotFound })
        }
        const now = this.clock.now()
        return await this.entityManager.transaction(async (manager) => {
            const ended: Array<ReviewerRow> = await manager.query(END_REVIEWER, [params.reviewerId, now])
            if (params.end) {
                const row = ended[0]
                if (row === undefined) throw new CareerError({ code: CareerErrorCode.ReviewerNotFound })
                return toReviewerView(row)
            }
            const inserted: Array<ReviewerRow> = await manager.query(INSERT_REVIEWER, [
                params.reviewerId,
                JSON.stringify([...new Set(params.parts)]),
                params.capacity ?? this.defaultCapacity,
                JSON.stringify([...new Set(params.conflicts)]),
                params.signer.subject,
                now,
            ])
            const row = inserted[0]
            if (row === undefined) throw new CareerError({ code: CareerErrorCode.ItemNotSaved })
            return toReviewerView(row)
        })
    }

    /** The active appointments with their open items; only the teacher reads them. */
    async list(signer: Signer): Promise<ReadonlyArray<ReviewerView>> {
        requireTeacher(signer)
        const rows: Array<ReviewerRow> = await this.entityManager.query(SELECT_REVIEWERS, [LIST_ROWS_MAX])
        return rows.map((row) => toReviewerView(row))
    }
}
