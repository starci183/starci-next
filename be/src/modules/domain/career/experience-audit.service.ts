import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import type { ActorRole, ExperienceState, ReviewAction } from "./career.contracts"
import type { ItemRow } from "./persistence/career.rows"
import { INSERT_DECISION } from "./persistence/career.sql"

/** One audit row as a writer of the items hands it over, inside its own transaction. */
export interface AppendDecisionParams {
    /** The transaction of the state change. */
    readonly manager: EntityManager
    /** The item after the change. */
    readonly item: ItemRow
    /** What was done. */
    readonly action: ReviewAction
    /** Who did it, or null for the system. */
    readonly actorId: string | null
    /** The role it was done with. */
    readonly actorRole: ActorRole
    /** The state before, or null for a new item. */
    readonly fromState: ExperienceState | null
    /** The note of a return or a revoke, or null. */
    readonly note: string | null
    /** When. */
    readonly at: Date
}

@Injectable()
/**
 * The only writer of the audit trail: one append-only row per state change, written in the transaction of the change, with the
 * line, the evidence references and the assignee of that moment. Nothing is ever updated or deleted.
 */
export class ExperienceAuditService {
    /** Appends the row of one change. */
    async append(params: AppendDecisionParams): Promise<void> {
        const snapshot = {
            line: params.item.line,
            evidence: params.item.evidence.map((evidence) => ({ kind: evidence.kind, ref: evidence.ref })),
            assigneeId: params.item.assignee_id,
        }
        await params.manager.query(INSERT_DECISION, [
            params.item.item_id,
            params.action,
            params.actorId,
            params.actorRole,
            params.fromState,
            params.item.state,
            params.note,
            JSON.stringify(snapshot),
            params.at,
        ])
    }
}
