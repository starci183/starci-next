import type { IconSource } from "@starci/grammar/common"

/** One destination of the sidebar: its id, words and glyph. */
export interface AppSidebarEntry {
    readonly id: string
    readonly label: string
    readonly source: IconSource
}

/** One group of destinations, with its small label when it has one. */
export interface AppSidebarGroupShape {
    readonly id: string
    readonly label?: string
    readonly items: ReadonlyArray<AppSidebarEntry>
}

/** The sidebar's collapse command and words (the wide rail collapses to icons only; the drawer never does). */
export interface AppSidebarCollapse {
    readonly isCollapsed: boolean
    readonly collapseLabel: string
    readonly expandLabel: string
    readonly onChange: (collapsed: boolean) => void
}

/** The language and appearance controls the drawer carries above the destinations, as the NIVO console drawer. */
export interface AppSidebarControls {
    readonly languageLabel: string
    readonly locale: string
    readonly isLocalePending: boolean
    readonly localeOptions: ReadonlyArray<{ readonly value: string; readonly label: string; readonly name: string }>
    readonly themeLabel: string
    readonly isDark: boolean
    readonly onChooseLocale: (locale: string) => void
    readonly onChooseDark: (isDark: boolean) => void
}

/** Copy, state and actions supplied by the connected sidebar block. */
export interface AppSidebarBaseProps {
    readonly props: {
        readonly label: string
        readonly groups: ReadonlyArray<AppSidebarGroupShape>
        readonly selectedKey: string | undefined
        readonly presentation: "rail" | "drawer"
        /** The rail collapse (rail only). */
        readonly collapse?: AppSidebarCollapse
        /** The drawer language and appearance controls (drawer only). */
        readonly controls?: AppSidebarControls
    }
    readonly on: {
        readonly go: (id: string) => void
    }
}
