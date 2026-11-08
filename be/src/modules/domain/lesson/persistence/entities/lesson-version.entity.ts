import { Column, Entity, PrimaryColumn } from "typeorm"
import type { LessonContent } from "../../lesson.contracts"

@Entity("lesson_versions")
/** One immutable version of a lesson: its parsed content, its hashes and whether it is the live one. */
export class LessonVersionEntity {
    /** The lesson id. */
    @PrimaryColumn({ name: "lesson_id", type: "text" })
    lessonId!: string

    /** The version: the source ref the content was imported from. */
    @PrimaryColumn({ name: "version", type: "text" })
    version!: string

    /** The SHA-256 over the path and hash of every source file. */
    @Column({ name: "content_hash", type: "text" })
    contentHash!: string

    /** `published` for the live version, `superseded` for an older one. */
    @Column({ name: "status", type: "varchar", length: 16 })
    status!: string

    /** The category. */
    @Column({ name: "category", type: "text" })
    category!: string

    /** The catalog group the lesson is listed under. */
    @Column({ name: "lesson_group", type: "text" })
    group!: string

    /** The topic the lesson belongs to. */
    @Column({ name: "topic", type: "text" })
    topic!: string

    /** The V1 content folder the lesson was converted from, when it names one. */
    @Column({ name: "source_key", type: "text", nullable: true })
    sourceKey!: string | null

    /** The difficulty. */
    @Column({ name: "difficulty", type: "varchar", length: 16 })
    difficulty!: string

    /** The minutes a learner needs. */
    @Column({ name: "minutes_read", type: "integer" })
    minutesRead!: number

    /** The implementation language, or `agnostic`. */
    @Column({ name: "implementation", type: "text" })
    implementation!: string

    /** The position in the catalog. */
    @Column({ name: "sort_index", type: "integer" })
    sortIndex!: number

    /** The titles by locale. */
    @Column({ name: "titles", type: "jsonb" })
    titles!: Record<string, string>

    /** The descriptions by locale. */
    @Column({ name: "descriptions", type: "jsonb" })
    descriptions!: Record<string, string>

    /** The SHA-256 of every source file by path. */
    @Column({ name: "source_hashes", type: "jsonb" })
    sourceHashes!: Record<string, string>

    /** The whole parsed content, answers included; never sent to a browser as stored. */
    @Column({ name: "content", type: "jsonb" })
    content!: LessonContent

    /** When the version was imported. */
    @Column({ name: "imported_at", type: "timestamptz" })
    importedAt!: Date
}
