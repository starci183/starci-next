import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm"

@Entity("course_labs")
@Unique("course_labs_natural_key", ["lessonId", "version"])
/** One version of a lab record of a lesson: the lab@2 record as json, its content hash and whether it is the live one. */
export class CourseLabEntity {
    /** The lesson id. */
    @Column({ name: "lesson_id", type: "text" })
    lessonId!: string

    /** The version label: the head of the content hash. */
    @Column({ name: "version", type: "text" })
    version!: string

    /** The SHA-256 (hex) of the canonical record. */
    @Column({ name: "content_hash", type: "text" })
    contentHash!: string

    /** The lab record. */
    @Column({ name: "record", type: "jsonb" })
    record!: Record<string, unknown>

    /** True for the live version. */
    @Column({ name: "published", type: "boolean" })
    published!: boolean

    /** When the version was stored. */
    @Column({ name: "created_at", type: "timestamptz" })
    createdAt!: Date

    /** The surrogate key; the former key is the unique `<table>_natural_key`. */
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string
}
