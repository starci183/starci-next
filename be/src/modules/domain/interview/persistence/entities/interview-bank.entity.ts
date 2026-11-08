import { Column, Entity, PrimaryColumn } from "typeorm"
import type { Localized } from "../../interview.contracts"

@Entity("interview_banks")
/** One immutable version of an interview bank: its metadata, its hash and whether it is the live one. */
export class InterviewBankEntity {
    /** The bank id: `<course folder>/<bank folder>` or `eq/<bank folder>`. */
    @PrimaryColumn({ name: "bank_id", type: "text" })
    bankId!: string

    /** The version: the source ref the bank was imported from. */
    @PrimaryColumn({ name: "version", type: "text" })
    version!: string

    /** The SHA-256 over the path and hash of every source file. */
    @Column({ name: "content_hash", type: "text" })
    contentHash!: string

    /** `validated`, `published` for the live version, or `superseded`. */
    @Column({ name: "status", type: "varchar", length: 16 })
    status!: string

    /** `technical` or `behavioral`. */
    @Column({ name: "family", type: "varchar", length: 16 })
    family!: string

    /** The course folder of a technical bank. */
    @Column({ name: "course", type: "text", nullable: true })
    course!: string | null

    /** The position of the bank. */
    @Column({ name: "sort_index", type: "integer" })
    sortIndex!: number

    /** The overall difficulty. */
    @Column({ name: "difficulty", type: "varchar", length: 16 })
    difficulty!: string

    /** The title per locale. */
    @Column({ name: "titles", type: "jsonb" })
    titles!: Localized<string>

    /** The description per locale. */
    @Column({ name: "descriptions", type: "jsonb" })
    descriptions!: Localized<string>

    /** The module slugs of a technical bank. */
    @Column({ name: "module_refs", type: "text", array: true })
    moduleRefs!: Array<string>

    /** How many questions the version holds. */
    @Column({ name: "question_count", type: "integer" })
    questionCount!: number

    /** What the calibration pre-check measured, or how the dev seed published it. */
    @Column({ name: "calibration", type: "jsonb", nullable: true })
    calibration!: Record<string, unknown> | null

    /** When the version was imported. */
    @Column({ name: "imported_at", type: "timestamptz" })
    importedAt!: Date

    /** When the version went live. */
    @Column({ name: "published_at", type: "timestamptz", nullable: true })
    publishedAt!: Date | null
}
