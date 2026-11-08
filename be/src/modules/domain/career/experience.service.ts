import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectEntitlementService, type EntitlementService } from "@modules/domain/entitlement"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { InjectCareerOptions } from "./career.decorators"
import type {
    CareerSettings,
    ExperienceItemView,
    ProduceExperienceParams,
    ShowExperienceParams,
    SubmitExperienceParams,
} from "./career.contracts"
import { toExperienceItemView } from "./career.mapper"
import type { CareerOptions } from "./career.options"
import { acceptLine, draftLineOf, sameLine } from "./cv-line.policy"
import { CareerError, CareerErrorCode } from "./errors/career.error"
import { ExperienceAuditService, type AppendDecisionParams } from "./experience-audit.service"
import { catalogItemOf } from "./experience-catalog.policy"
import type { ExperienceProducer } from "./experience-producer.port"
import type { ItemRow, PickedReviewerRow } from "./persistence/career.rows"
import {
    INSERT_ITEM,
    PICK_REVIEWER,
    REGRADE_ITEM,
    SELECT_ITEM_FOR_UPDATE,
    SELECT_LEARNER_ITEM,
    SELECT_OPEN_ITEM_FOR_UPDATE,
    SHOW_ITEM,
    SUBMIT_ITEM,
} from "./persistence/career.sql"
import { careerSettingsOf, dueAtOf } from "./review-sla.policy"

/** The audit fields of a grading row: the system grades, with no note. */
type SystemActor = Pick<AppendDecisionParams, "manager" | "actorId" | "actorRole" | "note" | "at">

/** The system actor of a grading row in the transaction of the change. */
const systemActorOf = (manager: EntityManager, at: Date): SystemActor => ({
    manager,
    actorId: null,
    actorRole: "system",
    note: null,
    at,
})

@Injectable()
/**
 * The learner side of the experience engine (sds.career.experience-engine): it turns proved evidence from a producer into an
 * item, drafts its line from the catalog template with every slot filled from the evidence, submits it to pending review with
 * an assignee and a deadline, and shows a verified item on the public profile. Every state change writes its audit row in the
 * same transaction.
 */
export class ExperienceService implements ExperienceProducer {
    private readonly settings: CareerSettings

    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectEntitlementService() private readonly entitlement: EntitlementService,
        @InjectCareerOptions() options: CareerOptions,
        private readonly audit: ExperienceAuditService,
    ) {
        this.settings = careerSettingsOf(options)
    }

    /**
     * Creates or regrades the item of a learner, type and subject from proved evidence: a passing grade drafts the line and puts it
     * in ai-graded, a failing one keeps it practising. The evidence of a pending, verified or revoked item is frozen, so new evidence
     * leaves it as it is. An item type that needs a project is refused without one.
     */
    produce(params: ProduceExperienceParams): Promise<ExperienceItemView> {
        const catalog = catalogItemOf(params.itemType)
        if (catalog.requiresProject && params.projectId === null) {
            return Promise.reject(new CareerError({ code: CareerErrorCode.ItemTypeUnknown }))
        }
        const passed = params.grade.result === "pass" && params.evidence.length > 0
        const draft = passed ? draftLineOf(catalog, params.slotValues) : null
        const state = passed ? "ai-graded" : "practising"
        const now = this.clock.now()
        return this.entityManager.transaction(async (manager) => {
            const inserted: Array<ItemRow> = await manager.query(INSERT_ITEM, [
                params.learnerId,
                params.itemType,
                catalog.part,
                params.subject,
                params.projectId,
                JSON.stringify(params.evidence),
                JSON.stringify(params.slotValues),
                JSON.stringify(params.grade),
                draft === null ? null : JSON.stringify(draft),
                state,
                now,
            ])
            const created = inserted[0]
            if (created !== undefined) {
                await this.audit.append({
                    ...systemActorOf(manager, now),
                    item: created,
                    action: "grade",
                    fromState: null,
                })
                return toExperienceItemView(created)
            }
            const current = await this.lockOpen(manager, params)
            const changed: Array<ItemRow> = await manager.query(REGRADE_ITEM, [
                current.item_id,
                JSON.stringify(params.evidence),
                JSON.stringify(params.slotValues),
                JSON.stringify(params.grade),
                draft === null ? null : JSON.stringify(draft),
                state,
                now,
            ])
            const regraded = changed[0]
            if (regraded === undefined) return toExperienceItemView(current)
            await this.audit.append({
                ...systemActorOf(manager, now),
                item: regraded,
                action: "grade",
                fromState: current.state,
            })
            return toExperienceItemView(regraded)
        })
    }

    /**
     * Sends an ai-graded or returned item to pending review with the learner's line, which may reword the draft but never change a
     * value from the evidence. It needs Premium. A returned item resubmitted with the line it was returned with is refused; after
     * the configured number of returns it goes to the teacher only, with the teacher's calendar hold as its deadline.
     */
    async submit(params: SubmitExperienceParams): Promise<ExperienceItemView> {
        if (!(await this.entitlement.isPremium(params.learnerId))) {
            throw new CareerError({ code: CareerErrorCode.PremiumRequired })
        }
        const now = this.clock.now()
        return this.entityManager.transaction(async (manager) => {
            const row = await this.lockOwn(manager, params.learnerId, params.itemId)
            if ((row.state !== "ai-graded" && row.state !== "returned") || row.draft_line === null) {
                throw new CareerError({ code: CareerErrorCode.StateConflict })
            }
            const line = acceptLine(params.line, row.draft_line, row.slot_values)
            const unchanged =
                row.returned_evidence_revision === row.evidence_revision && sameLine(row.returned_line, line)
            if (row.return_count > 0 && unchanged) throw new CareerError({ code: CareerErrorCode.ResubmitUnchanged })
            const teacherOnly = row.return_count >= this.settings.returnsBeforeTeacher
            const assignee = teacherOnly ? null : await this.pickReviewer(manager, row)
            const changed: Array<ItemRow> = await manager.query(SUBMIT_ITEM, [
                row.item_id,
                row.revision,
                JSON.stringify(line),
                assignee,
                teacherOnly,
                now,
                dueAtOf(now, teacherOnly, this.settings),
            ])
            const submitted = changed[0]
            if (submitted === undefined) throw new CareerError({ code: CareerErrorCode.StateConflict })
            await this.audit.append({
                manager,
                item: submitted,
                action: row.return_count > 0 ? "resubmit" : "submit",
                actorId: params.learnerId,
                actorRole: "learner",
                fromState: row.state,
                note: null,
                at: now,
            })
            return toExperienceItemView(submitted)
        })
    }

    /** Shows a verified item of the learner on the public profile, or hides it; any other item is refused CAREER_NOT_VERIFIED. */
    async show(params: ShowExperienceParams): Promise<ExperienceItemView> {
        const rows: Array<ItemRow> = await this.entityManager.query(SHOW_ITEM, [
            params.learnerId,
            params.itemId,
            params.shownPublicly,
            this.clock.now(),
        ])
        const row = rows[0]
        if (row !== undefined) return toExperienceItemView(row)
        const found: Array<ItemRow> = await this.entityManager.query(SELECT_LEARNER_ITEM, [
            params.learnerId,
            params.itemId,
        ])
        if (found[0] === undefined) throw new CareerError({ code: CareerErrorCode.ItemNotFound })
        throw new CareerError({ code: CareerErrorCode.NotVerified })
    }

    /** Locks the open item a producer's insert met. */
    private async lockOpen(manager: EntityManager, params: ProduceExperienceParams): Promise<ItemRow> {
        const rows: Array<ItemRow> = await manager.query(SELECT_OPEN_ITEM_FOR_UPDATE, [
            params.learnerId,
            params.itemType,
            params.subject,
        ])
        const row = rows[0]
        if (row === undefined) throw new CareerError({ code: CareerErrorCode.ItemNotSaved })
        return row
    }

    /** Locks an item of the learner; another learner's item is not found. */
    private async lockOwn(manager: EntityManager, learnerId: string, itemId: string): Promise<ItemRow> {
        const rows: Array<ItemRow> = await manager.query(SELECT_ITEM_FOR_UPDATE, [itemId])
        const row = rows[0]
        if (row?.learner_id !== learnerId) throw new CareerError({ code: CareerErrorCode.ItemNotFound })
        return row
    }

    /** The reviewer the item goes to, or null for the teacher's queue (Unassigned). */
    private async pickReviewer(manager: EntityManager, row: ItemRow): Promise<string | null> {
        const rows: Array<PickedReviewerRow> = await manager.query(PICK_REVIEWER, [row.part, row.learner_id])
        return rows[0]?.reviewer_id ?? null
    }
}
