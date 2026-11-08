import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity("notifications")
/** One notification of a learner: a kind and its params for the front end to word, an optional in-app link, read or not. */
export class NotificationEntity {
    /** The notification id. */
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string

    /** The learner who receives it. */
    @Column({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The kind, one of the closed list; the front end maps it to its i18n keys. */
    @Column({ name: "kind", type: "text" })
    kind!: string

    /** The facts for the text, a flat object of short text values. */
    @Column({ name: "params", type: "jsonb" })
    params!: Record<string, string>

    /** The in-app path it opens, or null. */
    @Column({ name: "link", type: "text", nullable: true })
    link!: string | null

    /** When it was created, from the injected clock. */
    @Column({ name: "created_at", type: "timestamptz" })
    createdAt!: Date

    /** When the learner read it, or null while unread. */
    @Column({ name: "read_at", type: "timestamptz", nullable: true })
    readAt!: Date | null
}
