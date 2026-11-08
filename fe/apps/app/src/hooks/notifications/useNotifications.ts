"use client"

import { DEFAULT_LOCALE } from "@starci-next/i18n/routing"
import { useFormatter, useLocale, useTranslations } from "next-intl"
import { useSession } from "@/hooks/auth"
import { useMutateMarkNotificationsReadSwr, useQueryMyNotificationsSwr, type MyNotifications } from "@/hooks/swr"

/** One notification as the bell's list draws it: its worded message, where it leads (undefined for none) and whether it was read. */
type NotificationRow = {
    readonly id: string
    readonly text: string
    readonly href: string | undefined
    readonly isRead: boolean
}

/** What the bell needs: the unread count, the rows, and the command that marks them all read. */
export type NotificationsView = {
    readonly unreadCount: number
    readonly rows: ReadonlyArray<NotificationRow>
    readonly isPending: boolean
    /** True while the first read runs. */
    readonly isLoading: boolean
    readonly markAllRead: () => void
}

/** The translator of the notifications catalog namespace. */
type NoticeTranslator = ReturnType<typeof useTranslations<"app.notifications">>

/** The value of one param of a notification, or an empty string when it carries none. */
const paramOf = (params: MyNotifications["items"][number]["params"], key: string): string =>
    params.find((param) => param.key === key)?.value ?? ""

/** The message of a notification: its kind's sentence from the catalog with its params, never stored prose. */
const textOf = (
    item: MyNotifications["items"][number],
    t: NoticeTranslator,
    formatDate: (value: string) => string,
): string => {
    const { kind, params } = item
    if (kind === "premium.activated") return t("kind.premiumActivated", { until: formatDate(paramOf(params, "until")) })
    if (kind === "premium.revoked") return t("kind.premiumRevoked", { until: formatDate(paramOf(params, "until")) })
    if (kind === "experience.verified") {
        return t("kind.experienceVerified", { itemType: paramOf(params, "itemType"), part: paramOf(params, "part") })
    }
    if (kind === "experience.returned") {
        return t("kind.experienceReturned", { itemType: paramOf(params, "itemType"), part: paramOf(params, "part") })
    }
    if (kind === "project.milestone-proved")
        return t("kind.projectMilestoneProved", { project: paramOf(params, "project") })
    if (kind === "project.deployed") return t("kind.projectDeployed", { project: paramOf(params, "project") })
    if (kind === "review.due") return t("kind.reviewDue", { count: Number(paramOf(params, "count")) })
    return t("kind.other")
}

/** The notifications of the signed-in reader, worded in the reader's locale, with the command that marks them read. */
export const useNotifications = (): NotificationsView => {
    const t = useTranslations("app.notifications")
    const format = useFormatter()
    const locale = useLocale()
    const session = useSession()
    const read = useQueryMyNotificationsSwr(session.status === "signed-in")
    const mark = useMutateMarkNotificationsReadSwr()
    const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`
    const formatDate = (value: string): string =>
        value === "" ? "" : format.dateTime(new Date(value), { dateStyle: "medium" })
    const { mutate } = read
    const { trigger } = mark
    return {
        unreadCount: read.data?.unreadCount ?? 0,
        rows: (read.data?.items ?? []).map((item) => ({
            id: item.id,
            text: textOf(item, t, formatDate),
            href: item.link === null ? undefined : `${prefix}${item.link}`,
            isRead: item.isRead,
        })),
        isPending: mark.isMutating,
        isLoading: read.isLoading,
        markAllRead: () => void trigger({ all: true }).then(() => mutate()),
    }
}
