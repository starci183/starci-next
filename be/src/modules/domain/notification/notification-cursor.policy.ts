import { NotificationError, NotificationErrorCode } from "./errors/notification.error"
import type { NotificationCursor } from "./notification.contracts"
import { isUuid } from "./notification-input.policy"

const INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u

/** The opaque cursor of the page that ends at a notification: its creation instant and id, as base64url text. */
export const encodedCursor = (cursor: NotificationCursor): string =>
    Buffer.from(`${cursor.createdAt}|${cursor.id}`, "utf8").toString("base64url")

/** Reads a cursor this list handed out; anything else is NOTIFICATION_CURSOR_INVALID. */
export const decodedCursor = (text: string): NotificationCursor => {
    const [createdAt = "", id = "", ...rest] = Buffer.from(text, "base64url").toString("utf8").split("|")
    if (rest.length > 0 || !INSTANT_PATTERN.test(createdAt) || Number.isNaN(Date.parse(createdAt)) || !isUuid(id))
        throw new NotificationError({ code: NotificationErrorCode.CursorInvalid })
    return { createdAt, id }
}
