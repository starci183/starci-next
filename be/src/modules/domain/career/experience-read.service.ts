import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import { InjectCareerOptions } from "./career.decorators"
import type {
    CareerSettings,
    MyExperienceView,
    ExperienceReviewItemView,
    MyExperienceParams,
    ReviewQueueItemView,
    ReviewQueueTab,
    ReviewQueueView,
    Signer,
    SignerRole,
    VerificationView,
    VerifiedExperienceView,
} from "./career.contracts"
import {
    toExperienceItemView,
    toReviewDecisionView,
    toReviewQueueItemView,
    toVerificationView,
    toVerifiedExperienceView,
} from "./career.mapper"
import type { CareerOptions } from "./career.options"
import { CareerError, CareerErrorCode } from "./errors/career.error"
import type { DecisionRow, ItemRow, ReviewerRow } from "./persistence/career.rows"
import {
    SELECT_ACTIVE_REVIEWER,
    SELECT_BY_CODE,
    SELECT_DECISIONS,
    SELECT_ITEM,
    SELECT_LEARNER_ITEMS,
    SELECT_PENDING_ITEMS,
    SELECT_VERIFIED_ITEMS,
} from "./persistence/career.sql"
import { CAREER_ROLES, maySign, requireSignerRole, type ReviewerScope } from "./review-access.policy"
import { careerSettingsOf } from "./review-sla.policy"

/** Whether a queue row belongs to a tab. */
const inTab = (item: ReviewQueueItemView, tab: ReviewQueueTab): boolean => {
    if (tab === "overdue") return item.sla === "overdue"
    return tab === "unassigned" ? item.assigneeId === null : true
}

@Injectable()
/**
 * The reads of the experience engine: a learner's own items, a signer's review queue and item, the public verification of a
 * code, and the verified items the path engine counts (data.learning-program.path-progress: a done check is met only by a
 * verified item, so a revoked one unmeets it on the next read).
 */
export class ExperienceReadService {
    private readonly settings: CareerSettings

    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectCareerOptions() options: CareerOptions,
    ) {
        this.settings = careerSettingsOf(options)
    }

    /** The items of a learner, newest change first, optionally of one state; pending items are shown to their learner only. */
    async mine(params: MyExperienceParams): Promise<MyExperienceView> {
        const rows: Array<ItemRow> = await this.entityManager.query(SELECT_LEARNER_ITEMS, [
            params.learnerId,
            params.state,
            LIST_ROWS_MAX,
        ])
        return {
            items: rows.map((row) => toExperienceItemView(row)),
            hiringMinVerified: this.settings.hiringMinVerified,
        }
    }

    /**
     * The queue of a signer, oldest due first: the teacher sees every pending item with the Overdue and Unassigned tabs; a reviewer
     * with an active appointment sees the items assigned to them. Anyone else is refused CAREER_REVIEW_FORBIDDEN.
     */
    async queue(signer: Signer, tab: ReviewQueueTab): Promise<ReviewQueueView> {
        const role = requireSignerRole(signer)
        if (role === CAREER_ROLES.reviewer) await this.scopeOf(signer)
        const assignee = role === CAREER_ROLES.teacher ? null : signer.subject
        const rows: Array<ItemRow> = await this.entityManager.query(SELECT_PENDING_ITEMS, [LIST_ROWS_MAX, assignee])
        const now = this.clock.now()
        const all = rows
            .filter((row) => row.learner_id !== signer.subject)
            .map((row) => toReviewQueueItemView(row, now, this.settings))
        return {
            role,
            items: all.filter((item) => inTab(item, tab)),
            counts: {
                pending: all.length,
                overdue: all.filter((item) => inTab(item, "overdue")).length,
                unassigned: all.filter((item) => inTab(item, "unassigned")).length,
            },
        }
    }

    /** One item with its audit trail, for a signer who may sign it; the teacher reads any item, verified and revoked included. */
    async item(signer: Signer, itemId: string): Promise<ExperienceReviewItemView> {
        const role = requireSignerRole(signer)
        const scope = role === CAREER_ROLES.reviewer ? await this.scopeOf(signer) : null
        const rows: Array<ItemRow> = await this.entityManager.query(SELECT_ITEM, [itemId])
        const row = rows[0]
        if (row === undefined) throw new CareerError({ code: CareerErrorCode.ItemNotFound })
        this.requireVisible(signer, role, scope, row)
        const decisions: Array<DecisionRow> = await this.entityManager.query(SELECT_DECISIONS, [itemId, LIST_ROWS_MAX])
        return {
            item: toReviewQueueItemView(row, this.clock.now(), this.settings),
            history: decisions.map((row) => toReviewDecisionView(row)),
        }
    }

    /** What /verify/{code} shows: the signed line, the signer role and date, or the revoked state; nothing else is public. */
    async verify(code: string): Promise<VerificationView> {
        const rows: Array<ItemRow> = await this.entityManager.query(SELECT_BY_CODE, [code.trim().toUpperCase()])
        const view = rows[0] === undefined ? null : toVerificationView(rows[0])
        if (view === null) throw new CareerError({ code: CareerErrorCode.ItemNotFound })
        return view
    }

    /** The verified items of a learner, the only items a path's done, the profile and the CV export count. */
    async verifiedItems(learnerId: string): Promise<ReadonlyArray<VerifiedExperienceView>> {
        const rows: Array<ItemRow> = await this.entityManager.query(SELECT_VERIFIED_ITEMS, [learnerId, LIST_ROWS_MAX])
        return rows.map((row) => toVerifiedExperienceView(row))
    }

    /** Refuses an item the signer may not see: their own, or one outside a reviewer's scope that is not assigned to them. */
    private requireVisible(signer: Signer, role: SignerRole, scope: ReviewerScope | null, row: ItemRow): void {
        if (row.learner_id === signer.subject) throw new CareerError({ code: CareerErrorCode.SelfReview })
        const target = { learnerId: row.learner_id, part: row.part, teacherOnly: row.teacher_only }
        const visible =
            maySign(signer, role, scope, target) ||
            (role === CAREER_ROLES.reviewer && row.assignee_id === signer.subject)
        if (!visible) throw new CareerError({ code: CareerErrorCode.ReviewForbidden })
    }

    /** The active appointment of a reviewer; a REVIEWER role without one is refused. */
    private async scopeOf(signer: Signer): Promise<ReviewerScope> {
        const rows: Array<ReviewerRow> = await this.entityManager.query(SELECT_ACTIVE_REVIEWER, [signer.subject])
        const row = rows[0]
        if (row === undefined) throw new CareerError({ code: CareerErrorCode.ReviewForbidden })
        return { parts: row.parts, conflicts: row.conflicts }
    }
}
