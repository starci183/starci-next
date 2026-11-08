import { Column, Entity, PrimaryColumn } from "typeorm"
import type {
    ExperienceEvidence,
    ExperienceGrade,
    ExperiencePart,
    ExperienceState,
    LocalizedLine,
    SignerRole,
    SlotValues,
} from "../../career.contracts"

@Entity("career_experience_items")
/** One experience item of a learner: its evidence, the grader's draft, the submitted line and where its review stands. */
export class CareerExperienceItemEntity {
    /** The item id. */
    @PrimaryColumn({ name: "item_id", type: "uuid" })
    itemId!: string

    /** The public code of /verify/{code}. */
    @Column({ name: "verification_code", type: "text", unique: true })
    verificationCode!: string

    /** The learner. */
    @Column({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The catalog item type. */
    @Column({ name: "item_type", type: "text" })
    itemType!: string

    /** The part that grants it. */
    @Column({ name: "part", type: "text" })
    part!: ExperiencePart

    /** What it is about. */
    @Column({ name: "subject", type: "text" })
    subject!: string

    /** The project of the evidence, or null. */
    @Column({ name: "project_id", type: "text", nullable: true })
    projectId!: string | null

    /** The evidence. */
    @Column({ name: "evidence", type: "jsonb" })
    evidence!: Array<ExperienceEvidence>

    /** Bumped whenever a producer brings new evidence. */
    @Column({ name: "evidence_revision", type: "integer", default: 1 })
    evidenceRevision!: number

    /** The slot values taken from the evidence. */
    @Column({ name: "slot_values", type: "jsonb" })
    slotValues!: SlotValues

    /** The grade, or null. */
    @Column({ name: "grade", type: "jsonb", nullable: true })
    grade!: ExperienceGrade | null

    /** The drafted line, or null. */
    @Column({ name: "draft_line", type: "jsonb", nullable: true })
    draftLine!: LocalizedLine | null

    /** The submitted line, or null. */
    @Column({ name: "line", type: "jsonb", nullable: true })
    line!: LocalizedLine | null

    /** Where it stands. */
    @Column({ name: "state", type: "text" })
    state!: ExperienceState

    /** The reviewer it is assigned to, or null. */
    @Column({ name: "assignee_id", type: "uuid", nullable: true })
    assigneeId!: string | null

    /** Whether only the teacher may decide it. */
    @Column({ name: "teacher_only", type: "boolean", default: false })
    teacherOnly!: boolean

    /** When it was last submitted. */
    @Column({ name: "submitted_at", type: "timestamptz", nullable: true })
    submittedAt!: Date | null

    /** The review deadline. */
    @Column({ name: "due_at", type: "timestamptz", nullable: true })
    dueAt!: Date | null

    /** Who signed it. */
    @Column({ name: "signer_id", type: "uuid", nullable: true })
    signerId!: string | null

    /** The role the signer signed with. */
    @Column({ name: "signer_role", type: "text", nullable: true })
    signerRole!: SignerRole | null

    /** When it was signed. */
    @Column({ name: "signed_at", type: "timestamptz", nullable: true })
    signedAt!: Date | null

    /** When it was revoked. */
    @Column({ name: "revoked_at", type: "timestamptz", nullable: true })
    revokedAt!: Date | null

    /** The note of the last return. */
    @Column({ name: "return_note", type: "text", nullable: true })
    returnNote!: string | null

    /** How many times it was returned. */
    @Column({ name: "return_count", type: "integer", default: 0 })
    returnCount!: number

    /** The line at the last return. */
    @Column({ name: "returned_line", type: "jsonb", nullable: true })
    returnedLine!: LocalizedLine | null

    /** The evidence revision at the last return. */
    @Column({ name: "returned_evidence_revision", type: "integer", nullable: true })
    returnedEvidenceRevision!: number | null

    /** Whether it shows on the public profile. */
    @Column({ name: "shown_publicly", type: "boolean", default: false })
    shownPublicly!: boolean

    /** The concurrency revision of the row. */
    @Column({ name: "revision", type: "integer", default: 1 })
    revision!: number

    /** When it was created. */
    @Column({ name: "created_at", type: "timestamptz" })
    createdAt!: Date

    /** When it last changed. */
    @Column({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date
}
