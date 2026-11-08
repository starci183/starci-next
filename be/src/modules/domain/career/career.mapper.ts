import type {
    CareerSettings,
    ExperienceItemView,
    ReviewDecisionView,
    ReviewerView,
    ReviewQueueItemView,
    VerificationView,
    VerifiedExperienceView,
} from "./career.contracts"
import { catalogItemOf } from "./experience-catalog.policy"
import type { DecisionRow, ItemRow, ReviewerRow } from "./persistence/career.rows"
import { slaOf } from "./review-sla.policy"

/** The instant as ISO 8601, or null. */
const isoOrNull = (value: Date | null): string | null => (value === null ? null : value.toISOString())

/** The length of the learner handle the queue shows. */
const HANDLE_LENGTH = 6

/** Maps a stored item to the view its learner reads. */
export const toExperienceItemView = (row: ItemRow): ExperienceItemView => {
    const catalog = catalogItemOf(row.item_type)
    return {
        itemId: row.item_id,
        verificationCode: row.verification_code,
        itemType: row.item_type,
        part: row.part,
        output: catalog.output,
        subject: row.subject,
        projectId: row.project_id,
        state: row.state,
        line: row.line,
        draftLine: row.draft_line,
        evidence: row.evidence,
        grade: row.grade,
        returnNote: row.return_note,
        returnCount: row.return_count,
        dueAt: isoOrNull(row.due_at),
        signature:
            row.signer_role === null || row.signed_at === null
                ? null
                : { role: row.signer_role, signedAt: row.signed_at.toISOString() },
        revokedAt: isoOrNull(row.revoked_at),
        shownPublicly: row.shown_publicly,
        defenseQuestions: catalog.defenseQuestions,
        updatedAt: row.updated_at.toISOString(),
    }
}

/** A short handle of a learner: the last characters of the opaque subject, never a name or an email. */
export const learnerHandleOf = (learnerId: string): string => `HV-${learnerId.slice(-HANDLE_LENGTH).toUpperCase()}`

/** Maps a stored item to the row of the review queue, with where it stands against its deadline at `now`. */
export const toReviewQueueItemView = (row: ItemRow, now: Date, settings: CareerSettings): ReviewQueueItemView => ({
    ...toExperienceItemView(row),
    learnerHandle: learnerHandleOf(row.learner_id),
    assigneeId: row.assignee_id,
    teacherOnly: row.teacher_only,
    sla:
        row.submitted_at === null || row.due_at === null
            ? "on-time"
            : slaOf(row.submitted_at, row.due_at, now, settings),
})

/** Maps a row of the audit trail. */
export const toReviewDecisionView = (row: DecisionRow): ReviewDecisionView => ({
    action: row.action,
    actorRole: row.actor_role,
    fromState: row.from_state,
    toState: row.to_state,
    note: row.note,
    at: row.at.toISOString(),
})

/** Maps a signed item to the public verification view, or null when it was never signed. */
export const toVerificationView = (row: ItemRow): VerificationView | null => {
    if (row.line === null || row.signer_role === null || row.signed_at === null) return null
    return {
        code: row.verification_code,
        itemType: row.item_type,
        part: row.part,
        line: row.line,
        state: row.state === "revoked" ? "revoked" : "verified",
        signerRole: row.signer_role,
        signedAt: row.signed_at.toISOString(),
        revokedAt: isoOrNull(row.revoked_at),
        evidenceKinds: [...new Set(row.evidence.map((evidence) => evidence.kind))],
    }
}

/** Maps a verified item to what the path engine reads. */
export const toVerifiedExperienceView = (row: ItemRow): VerifiedExperienceView => ({
    itemId: row.item_id,
    itemType: row.item_type,
    part: row.part,
    subject: row.subject,
    projectId: row.project_id,
    signedAt: row.signed_at === null ? row.updated_at.toISOString() : row.signed_at.toISOString(),
})

/** Maps a reviewer appointment. */
export const toReviewerView = (row: ReviewerRow): ReviewerView => ({
    reviewerId: row.reviewer_id,
    parts: row.parts,
    capacity: row.capacity,
    conflicts: row.conflicts,
    appointedAt: row.appointed_at.toISOString(),
    endedAt: isoOrNull(row.ended_at),
    openItems: row.open_items,
})
