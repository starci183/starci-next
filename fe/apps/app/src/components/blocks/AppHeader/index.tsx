"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"
import { useSession, useSignOut } from "@/hooks/auth"
import { useLocaleSwitch, useLocalizedPathname } from "@/hooks/locale"
import { useNotifications, type NotificationsView } from "@/hooks/notifications"
import { useViewerPlan, type ViewerPlan } from "@/hooks/plan"
import { slotOfSwr } from "@/hooks/slot"
import { useQueryStreakSwr, type StreakSummary } from "@/hooks/swr"
import { useThemeSwitch } from "@/hooks/theme"
import { useSignInModalStore } from "@/hooks/zustand/signInModal"
import type { DataSlot } from "@/modules/types"
import { signInSearch } from "@/modules/routes"
import {
    AppHeaderBase,
    type AppHeaderAccountShape,
    type AppHeaderLink,
    type AppHeaderNotifications,
    type AppHeaderPlan,
    type AppHeaderStreak,
} from "./component"

/** The addresses the server resolves in the reader locale (the locale prefix is part of them) and the brand's logo file. */
type AppHeaderProps = {
    readonly brand: string
    readonly logoSrc: string
    readonly homeHref: string
    readonly essentialsHref: string
    readonly reviewHref: string
    readonly practiceHref: string
    readonly projectsHref: string
    readonly interviewHref: string
    readonly agentsHref: string
    readonly premiumHref: string
    /** The profile, current also on its experience list and on the experience review queue (canvas nav). */
    readonly profileHref: string
    readonly experienceHref: string
    readonly reviewQueueHref: string
    readonly signInHref: string
}

/** The words of the two plan badges. */
type PlanWords = { readonly premium: string; readonly free: string }

/** The translator of the shell catalog namespace. */
type ShellTranslator = ReturnType<typeof useTranslations<"app.shell">>

/** True when the reader is on `href` or below it. */
const isOn = (pathname: string, href: string): boolean => pathname === href || pathname.startsWith(`${href}/`)

/** The streak chip of a settled streak slot, or undefined while the streak is unknown. */
const streakOf = (slot: DataSlot<StreakSummary>, t: ShellTranslator): AppHeaderStreak | undefined =>
    "items" in slot
        ? { label: t("streakChip", { count: slot.items.current }), isActive: slot.items.current > 0 }
        : undefined

/** The drawing the session selects. */
const shapeOf = (status: "unknown" | "signed-in" | "signed-out"): AppHeaderAccountShape => {
    if (status === "unknown") return "unknown"
    return status === "signed-in" ? "signedIn" : "signedOut"
}

/** The plan badge the entitlement selects: none while it is unknown, else Premium or Free in their words and tones. */
const planBadgeOf = (plan: ViewerPlan, words: PlanWords): AppHeaderPlan | undefined => {
    if (plan === "unknown") return undefined
    return plan === "premium" ? { label: words.premium, tone: "accent" } : { label: words.free, tone: "muted" }
}

/** The main destinations in the site map's order, the page the reader is on marked. */
const navLinksOf = (props: AppHeaderProps, pathname: string, t: ShellTranslator): ReadonlyArray<AppHeaderLink> => [
    { id: "learn", label: t("learn"), href: props.homeHref, isCurrent: pathname === props.homeHref },
    {
        id: "essentials",
        label: t("essentials"),
        href: props.essentialsHref,
        isCurrent: isOn(pathname, props.essentialsHref),
    },
    { id: "review", label: t("review"), href: props.reviewHref, isCurrent: isOn(pathname, props.reviewHref) },
    {
        id: "interview",
        label: t("interview"),
        href: props.interviewHref,
        isCurrent: isOn(pathname, props.interviewHref),
    },
    {
        id: "practice",
        label: t("practice"),
        href: props.practiceHref,
        isCurrent: isOn(pathname, props.practiceHref),
    },
    {
        id: "projects",
        label: t("projects"),
        href: props.projectsHref,
        isCurrent: isOn(pathname, props.projectsHref),
    },
    { id: "agents", label: t("agents"), href: props.agentsHref, isCurrent: isOn(pathname, props.agentsHref) },
    {
        id: "profile",
        label: t("profile"),
        href: props.profileHref,
        isCurrent: [props.profileHref, props.experienceHref, props.reviewQueueHref].some((href) =>
            isOn(pathname, href),
        ),
    },
]

/** The translator of the notifications catalog namespace. */
type NoticeTranslator = ReturnType<typeof useTranslations<"app.notifications">>

/** The words and state of the notifications popover. */
const notificationsOf = (n: NoticeTranslator, notices: NotificationsView): AppHeaderNotifications => ({
    label: n("label"),
    title: n("title"),
    unreadLabel: n("unread", { count: notices.unreadCount }),
    emptyLabel: n("empty"),
    markAllLabel: n("markAll"),
    unreadCount: notices.unreadCount,
    rows: notices.rows,
    isPending: notices.isPending,
})

/**
 * The app header: the main navigation with the page the reader is on marked, the plan badge from the entitlement read, the
 * language switch, and the account menu (sign out) or, for a signed-out reader, the way to sign in that returns here. Hidden on
 * the sign-in screens, which draw their own centred brand.
 */
export const AppHeader = (props: AppHeaderProps) => {
    const pathname = useLocalizedPathname()
    const session = useSession()
    const language = useLocaleSwitch()
    const plan = useViewerPlan()
    const theme = useThemeSwitch()
    const notices = useNotifications()
    const streak = slotOfSwr(useQueryStreakSwr())
    const t = useTranslations("app.shell")
    const out = useTranslations("app.signOut")
    const n = useTranslations("app.notifications")
    const { pending, signOut } = useSignOut()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const setSignInOpen = useSignInModalStore((state) => state.setOpen)
    if (isOn(pathname, props.signInHref)) return null
    const links = navLinksOf(props, pathname, t)
    return (
        <AppHeaderBase
            shape={shapeOf(session.status)}
            props={{
                brand: props.brand,
                logoSrc: props.logoSrc,
                homeHref: props.homeHref,
                navLabel: t("navLabel"),
                links,
                streak: streakOf(streak, t),
                plan: planBadgeOf(plan, { premium: t("planPremium"), free: t("planFree") }),
                language: {
                    label: language.label,
                    locale: language.locale,
                    isPending: language.isPending,
                    options: language.options,
                },
                theme: { label: theme.label, isDark: theme.isDark },
                notifications: notificationsOf(n, notices),
                accountName: session.session?.displayName ?? session.session?.email ?? t("account"),
                accountLabel: t("account"),
                premiumLabel: t("premium"),
                premiumHref: props.premiumHref,
                signOutLabel: pending ? out("working") : out("submit"),
                signInLabel: out("signIn"),
                signOutPending: pending,
                menuOpenLabel: t("menuOpen"),
                menuCloseLabel: t("menuClose"),
                menuTitle: t("menuTitle"),
                isMenuOpen,
            }}
            on={{
                chooseLanguage: language.choose,
                themeChange: theme.change,
                markAllRead: notices.markAllRead,
                signOut: () => signOut(props.signInHref + signInSearch({ signedOut: true })),
                signIn: () => setSignInOpen(true),
                menuOpenChange: setIsMenuOpen,
            }}
        />
    )
}
