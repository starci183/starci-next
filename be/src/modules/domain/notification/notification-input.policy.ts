import { NotificationError, NotificationErrorCode } from "./errors/notification.error"
import {
    NOTIFICATION_KINDS,
    NOTIFICATION_LINK_MAX,
    NOTIFICATION_MARK_IDS_MAX,
    NOTIFICATION_PAGE_DEFAULT,
    NOTIFICATION_PAGE_MAX,
    NOTIFICATION_PARAMS_MAX,
    NOTIFICATION_PARAM_KEY_MAX,
    NOTIFICATION_PARAM_VALUE_MAX,
    type NotificationMark,
    type NotificationParams,
    type PreparedNotification,
} from "./notification.contracts"

const KEY_PATTERN = /^[a-z][A-Za-z0-9]*$/u

/** An internal path: one leading slash, then no second slash, no backslash and no whitespace anywhere. */
const LINK_PATTERN = /^\/(?!\/)[^\s\\]*$/u

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu

/** Whether the text is a uuid. */
export const isUuid = (text: string): boolean => UUID_PATTERN.test(text)

const invalidParams = (): NotificationError => new NotificationError({ code: NotificationErrorCode.ParamsInvalid })

const paramEntry = ([key, value]: readonly [string, string | number]): readonly [string, string] => {
    const text = String(value)
    if (
        (typeof value === "number" && !Number.isFinite(value)) ||
        key.length > NOTIFICATION_PARAM_KEY_MAX ||
        !KEY_PATTERN.test(key) ||
        text.length > NOTIFICATION_PARAM_VALUE_MAX
    )
        throw invalidParams()
    return [key, text]
}

const paramsOf = (params: NotificationParams): Readonly<Record<string, string>> => {
    const entries = Object.entries(params)
    if (entries.length > NOTIFICATION_PARAMS_MAX) throw invalidParams()
    return Object.fromEntries(entries.map((entry) => paramEntry(entry)))
}

/**
 * Checks what a part asks to notify and answers what is stored: the kind must be a known one, the params at most eight
 * short keys with a string or finite number each (stored as text), the link an internal path or absent (stored null).
 * Refuses with NOTIFICATION_KIND_UNKNOWN, NOTIFICATION_PARAMS_INVALID or NOTIFICATION_LINK_INVALID.
 */
export const preparedNotification = (
    kind: string,
    params: NotificationParams,
    link: string | undefined,
): PreparedNotification => {
    if (!NOTIFICATION_KINDS.includes(kind)) throw new NotificationError({ code: NotificationErrorCode.KindUnknown })
    const stored = paramsOf(params)
    if (link !== undefined && (link.length > NOTIFICATION_LINK_MAX || !LINK_PATTERN.test(link)))
        throw new NotificationError({ code: NotificationErrorCode.LinkInvalid })
    return { params: stored, link: link ?? null }
}

/** The rows a page holds: the default when none is asked, otherwise the ask within one and the maximum. */
export const pageLimit = (limit: number | null | undefined): number =>
    limit === null || limit === undefined || !Number.isFinite(limit)
        ? NOTIFICATION_PAGE_DEFAULT
        : Math.min(Math.max(Math.trunc(limit), 1), NOTIFICATION_PAGE_MAX)

/**
 * What a mark reads: the ids it names, or null for every unread notification. Exactly one of ids (one to a hundred
 * uuids) and `all: true` is allowed; anything else is NOTIFICATION_MARK_INVALID.
 */
export const markTarget = (mark: NotificationMark): ReadonlyArray<string> | null => {
    const ids = mark.ids ?? []
    if (mark.all === true) {
        if (ids.length > 0) throw new NotificationError({ code: NotificationErrorCode.MarkInvalid })
        return null
    }
    if (ids.length === 0 || ids.length > NOTIFICATION_MARK_IDS_MAX || !ids.every((id) => isUuid(id)))
        throw new NotificationError({ code: NotificationErrorCode.MarkInvalid })
    return ids
}
