import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("lesson_content_versions")
/** One immutable published lesson version: the public/projection source payload, keyed by content id and version. */
export class LessonContentVersionEntity {
    /** The Academy content id. */
    @PrimaryColumn({ name: "content_id", type: "text" })
    contentId!: string

    /** The immutable version string the manifest declared. */
    @PrimaryColumn({ name: "version", type: "text" })
    version!: string

    /** The manifest SHA-256 the version was imported from; the unchanged/conflict check compares it. */
    @Column({ name: "source_hash", type: "text" })
    sourceHash!: string

    /** The serialized PublishedLesson (raw body bytes base64, indexes and public definitions). */
    @Column({ name: "payload", type: "jsonb" })
    payload!: unknown

    /** When the version was published, from the injected clock. */
    @Column({ name: "created_at", type: "timestamptz" })
    createdAt!: Date
}

@Entity("lesson_content_grading")
/** The server-only grading of one published version: rubrics, interviewer points and sample answers. */
export class LessonContentGradingEntity {
    /** The Academy content id. */
    @PrimaryColumn({ name: "content_id", type: "text" })
    contentId!: string

    /** The immutable version string the grading belongs to. */
    @PrimaryColumn({ name: "version", type: "text" })
    version!: string

    /** The serialized ProtectedGrading. */
    @Column({ name: "payload", type: "jsonb" })
    payload!: unknown

    /** When the grading was stored, from the injected clock. */
    @Column({ name: "created_at", type: "timestamptz" })
    createdAt!: Date
}
