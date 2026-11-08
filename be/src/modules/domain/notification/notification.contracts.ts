/** One notification kind, closed: the front end maps each one to its own i18n keys, so no prose is stored. */
export type NotificationKind =
    | "premium.activated"
    | "premium.revoked"
    | "experience.verified"
    | "experience.returned"
    | "review.due"
    | "project.milestone-proved"
    | "project.deployed"

/** Every notification kind, the list a kind is checked against. */
export const NOTIFICATION_KINDS: ReadonlyArray<string> = [
    "premium.activated",
    "premium.revoked",
    "experience.verified",
    "experience.returned",
    "review.due",
    "project.milestone-proved",
    "project.deployed",
]

/** The facts a notification carries for its i18n text: short keys with a string or a number each. */
export interface NotificationParams {
    /** One fact: a string or a number. */
    readonly [key: string]: string | number
}

/** The notifications a page holds when the caller names no limit. */
export const NOTIFICATION_PAGE_DEFAULT = 20

/** The most notifications a page holds. */
export const NOTIFICATION_PAGE_MAX = 50

/** The most params one notification carries. */
export const NOTIFICATION_PARAMS_MAX = 8

/** The longest param key. */
export const NOTIFICATION_PARAM_KEY_MAX = 40

/** The longest param value, once written as text. */
export const NOTIFICATION_PARAM_VALUE_MAX = 200

/** The longest link. */
export const NOTIFICATION_LINK_MAX = 200

/** The most notification ids one mark names. */
export const NOTIFICATION_MARK_IDS_MAX = 100

/** One param of a stored notification. */
export interface NotificationParamView {
    /** The param key. */
    readonly key: string
    /** The param value as text. */
    readonly value: string
}

/** One notification of a learner as the screens show it. */
export interface NotificationView {
    /** The notification id. */
    readonly id: string
    /** The kind the front end maps to its i18n keys. */
    readonly kind: NotificationKind
    /** The facts for the text, ordered by key. */
    readonly params: ReadonlyArray<NotificationParamView>
    /** The internal path the notification opens, or null when it opens nothing. */
    readonly link: string | null
    /** Whether the learner has read it. */
    readonly isRead: boolean
    /** When it was created, an ISO instant. */
    readonly createdAt: string
}

/** What a page is asked for. */
export interface NotificationPageRequest {
    /** The cursor of the page before, or absent for the first page. */
    readonly after?: string | null
    /** The most notifications wanted; absent, the default; above the maximum, the maximum. */
    readonly limit?: number | null
}

/** One page of the notifications of a learner, newest first. */
export interface NotificationPage {
    /** The notifications of the page. */
    readonly items: ReadonlyArray<NotificationView>
    /** The notifications the learner has not read, across all pages. */
    readonly unreadCount: number
    /** The cursor of the next page, or null on the last page. */
    readonly next: string | null
}

/** Which notifications a mark reads. */
export interface NotificationMark {
    /** The ids to mark; ids of another learner match nothing. */
    readonly ids?: ReadonlyArray<string> | null
    /** True to mark every unread notification of the learner. */
    readonly all?: boolean | null
}

/** A notification as it is stored, once checked. */
export interface PreparedNotification {
    /** The params as text, ready for the jsonb column. */
    readonly params: Readonly<Record<string, string>>
    /** The internal path, or null. */
    readonly link: string | null
}

/** The position after which the next page starts: the last item of the page before. */
export interface NotificationCursor {
    /** The creation instant of the last item, an ISO instant. */
    readonly createdAt: string
    /** The id of the last item. */
    readonly id: string
}
