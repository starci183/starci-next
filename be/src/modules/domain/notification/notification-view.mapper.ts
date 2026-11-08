import type { NotificationView } from "./notification.contracts"
import type { NotificationRow } from "./persistence/notification.rows"

/** Maps a stored row to the view a screen reads: the params ordered by key, the instants as ISO text, read as a flag. */
export const toNotificationView = (row: NotificationRow): NotificationView => ({
    id: row.id,
    kind: row.kind,
    params: Object.entries(row.params)
        .sort(([left], [right]) => (left < right ? -1 : 1))
        .map(([key, value]) => ({ key, value })),
    link: row.link,
    isRead: row.read_at !== null,
    createdAt: row.created_at.toISOString(),
})
