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

/** The CV link of one learner as the database answers it. */
export interface CvRow {
    /** The slug of the link, or null before it is made. */
    cv_slug: string | null
    /** Whether the CV is public. */
    cv_public: boolean
    /** The name the learner chose, or null. */
    display_name: string | null
    /** The name of the learner's account as last seen, or null. */
    account_name: string | null
}

/** The learner a public slug belongs to. */
export interface PublicCvRow {
    /** The learner. */
    learner_id: string
    /** The name the learner chose, or null. */
    display_name: string | null
    /** The name of the learner's account as last seen, or null. */
    account_name: string | null
    /** The storage key of the avatar, or null. */
    avatar_key: string | null
    /** The slug. */
    cv_slug: string
}
