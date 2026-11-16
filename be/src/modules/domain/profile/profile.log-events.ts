/** Events the profile records; fields are keys and ids, never a body or an address. */
export enum ProfileLogEvent {
    /** The store could not sign a read of an avatar, so the profile shows none. */
    AvatarReadFailed = "profile.avatar_read_failed",
    /** The store could not delete an avatar that is no longer wanted; the object stays orphaned. */
    AvatarRemoveFailed = "profile.avatar_remove_failed",
}
