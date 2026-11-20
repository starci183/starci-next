import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity("profile_learners")
/** The profile of one learner: the name they chose and the avatar they uploaded. */
export class ProfileLearnerEntity {
    /** The learner. */
    @Column({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The name the learner chose, or null to show the name of their account. */
    @Column({ name: "display_name", type: "text", nullable: true })
    displayName!: string | null

    /** The storage key of the avatar, or null. */
    @Column({ name: "avatar_key", type: "text", nullable: true })
    avatarKey!: string | null

    /** The content type the avatar was stored with, or null. */
    @Column({ name: "avatar_content_type", type: "text", nullable: true })
    avatarContentType!: string | null

    /** The size of the avatar in bytes, or null. */
    @Column({ name: "avatar_size", type: "integer", nullable: true })
    avatarSize!: number | null

    /** When the avatar was last set, or null. */
    @Column({ name: "avatar_updated_at", type: "timestamptz", nullable: true })
    avatarUpdatedAt!: Date | null

    /** The slug of the CV link, or null before it is made. */
    @Column({ name: "cv_slug", type: "text", nullable: true })
    cvSlug!: string | null

    /** Whether anyone with the link can open the CV. */
    @Column({ name: "cv_public", type: "boolean", default: false })
    cvPublic!: boolean

    /** The name of the learner's account as last seen, shown on the public CV when no display name is chosen. */
    @Column({ name: "account_name", type: "text", nullable: true })
    accountName!: string | null

    /** When the profile last changed. */
    @Column({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date

    /** The surrogate key; the former key is the unique `<table>_natural_key`. */
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string
}
