import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Codes of the notification capability. */
export enum NotificationErrorCode {
    /** The kind is not one of the notification kinds. */
    KindUnknown = "NOTIFICATION_KIND_UNKNOWN",
    /** The params are too many, or a key or a value is outside its bounds. */
    ParamsInvalid = "NOTIFICATION_PARAMS_INVALID",
    /** The link is not an internal path. */
    LinkInvalid = "NOTIFICATION_LINK_INVALID",
    /** The cursor is not one this list handed out. */
    CursorInvalid = "NOTIFICATION_CURSOR_INVALID",
    /** The mark names neither notification ids nor all. */
    MarkInvalid = "NOTIFICATION_MARK_INVALID",
}

/** How each notification code travels. */
export const NOTIFICATION_ERROR_KINDS: Record<NotificationErrorCode, ErrorKind> = {
    [NotificationErrorCode.KindUnknown]: "invalid",
    [NotificationErrorCode.ParamsInvalid]: "invalid",
    [NotificationErrorCode.LinkInvalid]: "invalid",
    [NotificationErrorCode.CursorInvalid]: "invalid",
    [NotificationErrorCode.MarkInvalid]: "invalid",
}

/** The one error class of the notification capability. */
export class NotificationError extends DomainError<NotificationErrorCode> {}
