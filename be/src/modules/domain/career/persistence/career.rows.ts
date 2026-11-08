import type {
    ActorRole,
    ExperienceEvidence,
    ExperienceGrade,
    ExperiencePart,
    ExperienceState,
    LocalizedLine,
    ReviewAction,
    SignerRole,
    SlotValues,
} from "../career.contracts"

/** One experience item as the item statements answer it. */
export interface ItemRow {
    /** The item id. */
    readonly item_id: string
    /** The public code of /verify/{code}. */
    readonly verification_code: string
    /** The learner. */
    readonly learner_id: string
    /** The catalog item type. */
    readonly item_type: string
    /** The part that grants it. */
    readonly part: ExperiencePart
    /** What it is about. */
    readonly subject: string
    /** The project of the evidence, or null. */
    readonly project_id: string | null
    /** The evidence. */
    readonly evidence: ReadonlyArray<ExperienceEvidence>
    /** Bumped whenever a producer brings new evidence. */
    readonly evidence_revision: number
    /** The slot values taken from the evidence. */
    readonly slot_values: SlotValues
    /** The grade, or null. */
    readonly grade: ExperienceGrade | null
    /** The drafted line, or null. */
    readonly draft_line: LocalizedLine | null
    /** The submitted line, or null. */
    readonly line: LocalizedLine | null
    /** Where it stands. */
    readonly state: ExperienceState
    /** The reviewer it is assigned to, or null. */
    readonly assignee_id: string | null
    /** Whether only the teacher may decide it. */
    readonly teacher_only: boolean
    /** When it was last submitted. */
    readonly submitted_at: Date | null
    /** The review deadline, or null. */
    readonly due_at: Date | null
    /** The role the signer signed with, or null. */
    readonly signer_role: SignerRole | null
    /** When it was signed, or null. */
    readonly signed_at: Date | null
    /** When it was revoked, or null. */
    readonly revoked_at: Date | null
    /** The note of the last return, or null. */
    readonly return_note: string | null
    /** How many times it was returned. */
    readonly return_count: number
    /** The line at the last return, or null. */
    readonly returned_line: LocalizedLine | null
    /** The evidence revision at the last return, or null. */
    readonly returned_evidence_revision: number | null
    /** Whether it shows on the public profile. */
    readonly shown_publicly: boolean
    /** The concurrency revision of the row. */
    readonly revision: number
    /** When it last changed. */
    readonly updated_at: Date
}

/** One row of the audit trail as SELECT_DECISIONS answers it. */
export interface DecisionRow {
    /** What was done. */
    readonly action: ReviewAction
    /** Who did it. */
    readonly actor_role: ActorRole
    /** The state before, or null. */
    readonly from_state: ExperienceState | null
    /** The state after. */
    readonly to_state: ExperienceState
    /** The note of a return or revoke, or null. */
    readonly note: string | null
    /** When. */
    readonly at: Date
}

/** One reviewer appointment, with the pending items assigned to the reviewer. */
export interface ReviewerRow {
    /** The reviewer subject. */
    readonly reviewer_id: string
    /** The parts the reviewer may sign. */
    readonly parts: ReadonlyArray<ExperiencePart>
    /** The most open items at once. */
    readonly capacity: number
    /** The learners the reviewer must not review. */
    readonly conflicts: ReadonlyArray<string>
    /** When appointed. */
    readonly appointed_at: Date
    /** When ended, or null. */
    readonly ended_at: Date | null
    /** How many pending items are assigned to the reviewer. */
    readonly open_items: number
}

/** The reviewer PICK_REVIEWER chose. */
export interface PickedReviewerRow {
    /** The reviewer subject. */
    readonly reviewer_id: string
}
