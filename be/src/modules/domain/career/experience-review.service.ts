import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX, type sql } from "@modules/platform/database"
import { eachInOrder } from "@modules/platform/primitives"
import type {
    AssignExperienceParams,
    DecideExperienceParams,
    DecisionResultView,
    ExperienceItemView,
    ReviewDecisionInput,
    RevokeExperienceParams,
    Signer,
    SignerRole,
} from "./career.contracts"
import { toExperienceItemView } from "./career.mapper"
import { CareerError, CareerErrorCode } from "./errors/career.error"
import { ExperienceAuditService } from "./experience-audit.service"
import { InjectExperienceNotifier, type ExperienceNotifier } from "./experience-notifier.port"
import type { ItemRow, ReviewerRow } from "./persistence/career.rows"
import {
    APPROVE_ITEM,
    ASSIGN_ITEM,
    ESCALATE_OVERDUE,
    RETURN_ITEM,
    REVOKE_ITEM,
    SELECT_ACTIVE_REVIEWER,
    SELECT_ITEM_FOR_UPDATE,
} from "./persistence/career.sql"
import { maySign, requireSignerRole, requireTeacher, type ReviewerScope } from "./review-access.policy"

/** A note with something in it, or null. */
const noteOf = (note: string | null): string | null => {
    const trimmed = note?.trim() ?? ""
    return trimmed === "" ? null : trimmed
}

/** What one decision needs besides its input: the signer, the role and the scope it acts with. */
interface SignerContext {
    readonly signer: Signer
    readonly role: SignerRole
    readonly scope: ReviewerScope | null
}

@Injectable()
/**
 * The signer side of the experience engine: the teacher or an appointed reviewer approves or returns pending items, the teacher
 * revokes a verified item and reassigns a pending one, and overdue items escalate to the teacher. Each item is decided in its own
 * transaction with its audit row; a decision another signer made first is refused CAREER_REVIEW_CONFLICT.
 */
export class ExperienceReviewService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        private readonly audit: ExperienceAuditService,
        @InjectExperienceNotifier() private readonly notifier: ExperienceNotifier,
    ) {}

    /**
     * Applies a batch of decisions, each on its own: one refusal (scope, own item, missing note, a concurrent decision) answers
     * that item's code and leaves the others applied. A caller with neither role is refused the whole batch.
     */
    async decide(params: DecideExperienceParams): Promise<ReadonlyArray<DecisionResultView>> {
        const role = requireSignerRole(params.signer)
        const context: SignerContext = { signer: params.signer, role, scope: await this.scopeOf(params.signer, role) }
        const results: Array<DecisionResultView> = []
        await eachInOrder(params.decisions, async (decision) => {
            results.push(await this.decideOne(context, decision))
        })
        return results
    }

    /** Revokes a verified item with a reason; only the teacher revokes, and the verification page shows it revoked at once. */
    async revoke(params: RevokeExperienceParams): Promise<ExperienceItemView> {
        requireTeacher(params.signer)
        const note = noteOf(params.reason)
        if (note === null) throw new CareerError({ code: CareerErrorCode.ReviewNoteRequired })
        const now = this.clock.now()
        return await this.entityManager.transaction(async (manager) => {
            const row = await this.lock(manager, params.itemId)
            if (row.state !== "verified") throw new CareerError({ code: CareerErrorCode.NotVerified })
            const revoked = await this.change(manager, REVOKE_ITEM, [row.item_id, row.revision, now])
            await this.audit.append({
                manager,
                item: revoked,
                action: "revoke",
                actorId: params.signer.subject,
                actorRole: "TEACHER",
                fromState: row.state,
                note,
                at: now,
            })
            return toExperienceItemView(revoked)
        })
    }

    /** Assigns a pending item to a reviewer, or back to the teacher's queue; only the teacher reassigns. */
    async assign(params: AssignExperienceParams): Promise<ExperienceItemView> {
        requireTeacher(params.signer)
        if (params.reviewerId !== null) await this.requireReviewer(params.reviewerId)
        const now = this.clock.now()
        return this.entityManager.transaction(async (manager) => {
            const row = await this.lock(manager, params.itemId)
            if (row.state !== "pending-review") throw new CareerError({ code: CareerErrorCode.StateConflict })
            if (row.learner_id === params.reviewerId) throw new CareerError({ code: CareerErrorCode.SelfReview })
            const assigned = await this.change(manager, ASSIGN_ITEM, [
                row.item_id,
                row.revision,
                params.reviewerId,
                now,
            ])
            await this.audit.append({
                manager,
                item: assigned,
                action: "assign",
                actorId: params.signer.subject,
                actorRole: "TEACHER",
                fromState: row.state,
                note: null,
                at: now,
            })
            return toExperienceItemView(assigned)
        })
    }

    /**
     * Moves the assigned items past their deadline to the teacher's queue, one bounded batch, and answers how many moved; the SLA
     * job (sds.career.experience-engine `tick`) calls it, and the queue already shows them overdue before it runs.
     */
    escalateOverdue(): Promise<number> {
        const now = this.clock.now()
        return this.entityManager.transaction(async (manager) => {
            const rows: Array<ItemRow> = await manager.query(ESCALATE_OVERDUE, [now, LIST_ROWS_MAX])
            await eachInOrder(rows, (row) =>
                this.audit.append({
                    manager,
                    item: row,
                    action: "escalate",
                    actorId: null,
                    actorRole: "system",
                    fromState: row.state,
                    note: null,
                    at: now,
                }),
            )
            return rows.length
        })
    }

    /** Decides one item and answers its new state, or the code that refused it. */
    private async decideOne(context: SignerContext, decision: ReviewDecisionInput): Promise<DecisionResultView> {
        try {
            const row = await this.apply(context, decision)
            await this.notify(row)
            return { itemId: decision.itemId, state: row.state, refusal: null }
        } catch (error: unknown) {
            if (error instanceof CareerError) return { itemId: decision.itemId, state: null, refusal: error.code }
            throw error
        }
    }

    /** Approves or returns one pending item the signer may sign, with its audit row, in one transaction. */
    private apply(context: SignerContext, decision: ReviewDecisionInput): Promise<ItemRow> {
        const note = noteOf(decision.note)
        if (decision.verdict === "return" && note === null) {
            return Promise.reject(new CareerError({ code: CareerErrorCode.ReviewNoteRequired }))
        }
        const now = this.clock.now()
        return this.entityManager.transaction(async (manager) => {
            const row = await this.lock(manager, decision.itemId)
            const target = { learnerId: row.learner_id, part: row.part, teacherOnly: row.teacher_only }
            if (row.learner_id === context.signer.subject) throw new CareerError({ code: CareerErrorCode.SelfReview })
            if (!maySign(context.signer, context.role, context.scope, target)) {
                throw new CareerError({ code: CareerErrorCode.ReviewForbidden })
            }
            if (row.state !== "pending-review") throw new CareerError({ code: CareerErrorCode.ReviewConflict })
            const changed =
                decision.verdict === "approve"
                    ? await this.change(manager, APPROVE_ITEM, [
                          row.item_id,
                          row.revision,
                          context.signer.subject,
                          context.role,
                          now,
                      ])
                    : await this.change(manager, RETURN_ITEM, [row.item_id, row.revision, note, now])
            await this.audit.append({
                manager,
                item: changed,
                action: decision.verdict,
                actorId: context.signer.subject,
                actorRole: context.role,
                fromState: row.state,
                note,
                at: now,
            })
            return changed
        })
    }

    /** Tells the learner about a committed verification or return; the link opens their experience list. */
    private notify(row: ItemRow): Promise<void> {
        const kind = row.state === "verified" ? "experience.verified" : "experience.returned"
        return this.notifier.notify(row.learner_id, kind, { itemType: row.item_type, part: row.part }, "/experience")
    }

    /** The active appointment of a reviewer, or null for the teacher, who needs none. */
    private async scopeOf(signer: Signer, role: SignerRole): Promise<ReviewerScope | null> {
        if (role === "TEACHER") return null
        const rows: Array<ReviewerRow> = await this.entityManager.query(SELECT_ACTIVE_REVIEWER, [signer.subject])
        const row = rows[0]
        if (row === undefined) throw new CareerError({ code: CareerErrorCode.ReviewForbidden })
        return { parts: row.parts, conflicts: row.conflicts }
    }

    /** Refuses CAREER_REVIEWER_NOT_FOUND for a subject with no active appointment. */
    private async requireReviewer(reviewerId: string): Promise<void> {
        const rows: Array<ReviewerRow> = await this.entityManager.query(SELECT_ACTIVE_REVIEWER, [reviewerId])
        if (rows[0] === undefined) throw new CareerError({ code: CareerErrorCode.ReviewerNotFound })
    }

    /** Locks an item; an unknown id is not found. */
    private async lock(manager: EntityManager, itemId: string): Promise<ItemRow> {
        const rows: Array<ItemRow> = await manager.query(SELECT_ITEM_FOR_UPDATE, [itemId])
        const row = rows[0]
        if (row === undefined) throw new CareerError({ code: CareerErrorCode.ItemNotFound })
        return row
    }

    /** Runs a guarded change and answers the changed row; no row means another signer changed it first. */
    private async change(
        manager: EntityManager,
        statement: ReturnType<typeof sql>,
        values: ReadonlyArray<unknown>,
    ): Promise<ItemRow> {
        const rows: Array<ItemRow> = await manager.query(statement, [...values])
        const row = rows[0]
        if (row === undefined) throw new CareerError({ code: CareerErrorCode.ReviewConflict })
        return row
    }
}
