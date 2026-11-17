/** The profile of one learner as the database answers it. */
export interface ProfileRow {
    /** The name the learner chose, or null. */
    display_name: string | null
    /** The storage key of the avatar, or null. */
    avatar_key: string | null
    /** The content type of the avatar, or null. */
    avatar_content_type: string | null
    /** The size of the avatar in bytes, or null. */
    avatar_size: number | null
    /** When the avatar was set, an ISO instant, or null. */
    avatar_updated_at: string | null
}
