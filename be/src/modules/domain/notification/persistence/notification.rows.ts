import type { NotificationKind } from "../notification.contracts"

/** One stored notification as a page reads it. */
export interface NotificationRow {
    /** The notification id. */
    id: string
    /** The kind. */
    kind: NotificationKind
    /** The params as text. */
    params: Record<string, string>
    /** The in-app path, or null. */
    link: string | null
    /** When it was created. */
    created_at: Date
    /** When it was read, or null. */
    read_at: Date | null
}

/** A count the statements answer: the unread notifications or the notifications a mark changed. */
export interface CountRow {
    /** The counted notifications. */
    total: number
}
