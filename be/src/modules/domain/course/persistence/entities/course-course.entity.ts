import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm"

@Entity("course_courses")
@Unique("course_courses_natural_key", ["courseId", "version"])
/** One version of a course record: the course as json, its content hash and whether it is the live one. */
export class CourseCourseEntity {
    /** The course id. */
    @Column({ name: "course_id", type: "text" })
    courseId!: string

    /** The version label: the head of the content hash. */
    @Column({ name: "version", type: "text" })
    version!: string

    /** The SHA-256 (hex) of the canonical record. */
    @Column({ name: "content_hash", type: "text" })
    contentHash!: string

    /** The course record. */
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
