/** What a mark takes: the ids to mark read, or all; exactly one of the two. */
export interface MarkNotificationsReadRequest {
    /** The ids of the notifications to mark, or null. */
    readonly ids: ReadonlyArray<string> | null
    /** True to mark every unread notification, or null. */
    readonly all: boolean | null
}
