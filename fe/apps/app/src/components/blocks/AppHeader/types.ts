import type { BadgeTone } from "@starci/grammar/common"

/** One main destination: its words, its address and whether the reader is on it. */
export interface AppHeaderLink {
    readonly id: string
    readonly label: string
    readonly href: string
    readonly isCurrent: boolean
}

/** One language the header's switch offers: its code, short mark and spoken name. */
export interface AppHeaderLanguageOption {
    readonly value: string
    readonly label: string
    readonly name: string
}

/** The plan badge words and tone. */
export interface AppHeaderPlan {
    readonly label: string
    readonly tone: BadgeTone
}

/** The words, options and state of the language switch. */
export interface AppHeaderLanguage {
    readonly label: string
    readonly locale: string
    readonly isPending: boolean
    readonly options: ReadonlyArray<AppHeaderLanguageOption>
}

/** The streak chip: its words and whether a streak is running (amber) or not (neutral). */
export interface AppHeaderStreak {
    readonly label: string
    readonly isActive: boolean
}

/** The theme switch: its accessible name and whether the dark theme is on. */
export interface AppHeaderTheme {
    readonly label: string
    readonly isDark: boolean
}

/** One notification of the bell's list: its worded message, where it leads (undefined for none) and whether it was read. */
export interface AppHeaderNotification {
    readonly id: string
    readonly text: string
    readonly href: string | undefined
    readonly isRead: boolean
}

/** The words and state of the notifications popover. */
export interface AppHeaderNotifications {
    readonly label: string
    readonly title: string
    /** The count worded for assistive technology ("3 unread"). */
    readonly unreadLabel: string
    readonly emptyLabel: string
    readonly markAllLabel: string
    readonly unreadCount: number
    readonly rows: ReadonlyArray<AppHeaderNotification>
    readonly isPending: boolean
}

/** The drawings of the account area: nothing yet (the session is unknown), the signed-in reader, or the way to sign in. */
export type AppHeaderAccountShape = "unknown" | "signedIn" | "signedOut"

/** Copy, state and actions supplied by the connected header block. */
export interface AppHeaderBaseProps {
    readonly shape: AppHeaderAccountShape
    readonly props: {
        readonly brand: string
        readonly logoSrc: string
        readonly homeHref: string
        readonly navLabel: string
        readonly links: ReadonlyArray<AppHeaderLink>
        /** The plan badge words and tone, or undefined while the entitlement is unknown. */
        readonly plan: AppHeaderPlan | undefined
        /** The streak chip words ("3 days"), or undefined while the streak is unknown. */
        readonly streak: AppHeaderStreak | undefined
        readonly language: AppHeaderLanguage
        readonly theme: AppHeaderTheme
        readonly notifications: AppHeaderNotifications
        readonly accountName: string
        readonly accountLabel: string
        readonly premiumLabel: string
        readonly premiumHref: string
        readonly signOutLabel: string
        readonly signInLabel: string
        readonly signOutPending: boolean
        readonly menuOpenLabel: string
        readonly menuCloseLabel: string
        readonly menuTitle: string
        readonly isMenuOpen: boolean
    }
    readonly on: {
        readonly chooseLanguage: (locale: string) => void
        readonly themeChange: (isDark: boolean) => void
        readonly markAllRead: () => void
        readonly signOut: () => void
        readonly signIn: () => void
        readonly menuOpenChange: (isOpen: boolean) => void
    }
}
