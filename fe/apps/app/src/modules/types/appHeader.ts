import type { TopBarCustomButton } from "@starci/grammar/common"

/** One language the header's switch offers: its code, short mark and spoken name. */
export interface AppHeaderLanguageOption {
    readonly value: string
    readonly label: string
    readonly name: string
}

/** The words, options and state of the language switch. */
export interface AppHeaderLanguage {
    readonly label: string
    readonly locale: string
    readonly isPending: boolean
    readonly options: ReadonlyArray<AppHeaderLanguageOption>
}

/** The theme switch: its accessible name and whether the dark theme is on. */
export interface AppHeaderTheme {
    readonly label: string
    readonly isDark: boolean
}

/** The drawings of the account area: nothing yet (the session is unknown), the signed-in reader, or the way to sign in. */
export type AppHeaderAccountShape = "unknown" | "signedIn" | "signedOut"

/** One round button before the locale, theme and avatar cluster: Grammar's TopBar `customButtons` entry (0.37.15), a glyph name, an accessible name, an optional attention dot and a destination or a command. */
export type AppHeaderCustomButton = TopBarCustomButton

/** Copy, state and actions supplied by the connected header block. */
export interface AppHeaderBaseProps {
    readonly shape: AppHeaderAccountShape
    readonly props: {
        /** The brand lockup at the bar's start (logo, wordmark over a muted role and plan line), as the NIVO console bar. */
        readonly brand: { readonly name: string; readonly logoSrc: string; readonly roleLine: string }
        /** Round buttons before the language cluster; empty while the app has no notifications page for the bell to open. */
        readonly customButtons: ReadonlyArray<AppHeaderCustomButton>
        readonly language: AppHeaderLanguage
        readonly theme: AppHeaderTheme
        readonly accountName: string
        readonly accountLabel: string
        /** The identity row at the head of the account menu: the reader's email over the plan line. */
        readonly identity: { readonly title: string; readonly subtitle: string }
        /** The plan command after the identity: upgrade when the reader has no Premium, the plan page when they have it. */
        readonly plan: { readonly label: string; readonly href: string }
        readonly profileLabel: string
        readonly profileHref: string
        readonly signOutLabel: string
        readonly signInLabel: string
        readonly signOutPending: boolean
    }
    readonly on: {
        readonly chooseLanguage: (locale: string) => void
        readonly themeChange: (isDark: boolean) => void
        readonly goHome: () => void
        readonly signOut: () => void
        readonly signIn: () => void
    }
}
