import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity("relay_lab_states")
/** The lab of one lesson for one learner as their machine last synced it: boot stages, the last test run, the files and the chaos on. */
export class RelayLabStateEntity {
    /** The learner. */
    @Column({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The course. */
    @Column({ name: "course_id", type: "text" })
    courseId!: string

    /** The lesson. */
    @Column({ name: "lesson_id", type: "text" })
    lessonId!: string

    /** The device that reported last. */
    @Column({ name: "device_id", type: "uuid" })
    deviceId!: string

    /** The boot stages by stage name. */
    @Column({ name: "boot", type: "jsonb" })
    boot!: Record<string, unknown>

    /** The last run of the visible tests, or null. */
    @Column({ name: "tests", type: "jsonb", nullable: true })
    tests!: Record<string, unknown> | null

    /** The mirrored files, or null. */
    @Column({ name: "files", type: "jsonb", nullable: true })
    files!: Record<string, unknown> | null

    /** The chaos switches that are on. */
    @Column({ name: "chaos_on", type: "jsonb" })
    chaosOn!: Array<string>

    /** When the machine last synced tests or files. */
    @Column({ name: "last_synced_at", type: "timestamptz", nullable: true })
    lastSyncedAt!: Date | null

    /** When the row last changed. */
    @Column({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date

    /** The surrogate key; the former key is the unique `<table>_natural_key`. */
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string
}
