"use client"

import { navigation } from "@starci-next/i18n/navigation"
import {
    AgentsGlyph,
    EssentialsGlyph,
    ExperienceGlyph,
    IncidentsGlyph,
    InterviewGlyph,
    LearnGlyph,
    PracticeGlyph,
    ProfileGlyph,
    ProjectsGlyph,
    ReviewGlyph,
} from "@starci-next/ui"
import { useTranslations } from "next-intl"
import { useRailCollapsed } from "@/hooks/rail"
import { useThemeSwitch } from "@/hooks/theme"
import { useLocaleSwitch, useLocalizedPathname } from "@/hooks/locale"
import { APP_ROUTES } from "@/modules/routes"
import { AppSidebarBase, type AppSidebarEntry } from "./component"

/** The drawing: the wide rail or the drawer. */
type AppSidebarProps = {
    readonly presentation: "rail" | "drawer"
}

/** One destination: its message key, the route it opens and the glyph that stands for it. */
type Destination = {
    readonly id: "learn" | "essentials" | "review" | "interview" | "practice" | "incidents" | "projects" | "agents" | "experience" | "profile"
    readonly route: string
    readonly source: AppSidebarEntry["source"]
}

const MAIN: ReadonlyArray<Destination> = [
    { id: "learn", route: APP_ROUTES.home, source: LearnGlyph },
    { id: "essentials", route: APP_ROUTES.essentials, source: EssentialsGlyph },
    { id: "review", route: APP_ROUTES.review, source: ReviewGlyph },
    { id: "interview", route: APP_ROUTES.interview, source: InterviewGlyph },
    { id: "practice", route: APP_ROUTES.practice, source: PracticeGlyph },
    { id: "incidents", route: APP_ROUTES.incidents, source: IncidentsGlyph },
    { id: "projects", route: APP_ROUTES.projects, source: ProjectsGlyph },
    { id: "agents", route: APP_ROUTES.agents, source: AgentsGlyph },
]

const EXPERIENCE: ReadonlyArray<Destination> = [
    { id: "experience", route: APP_ROUTES.experience, source: ExperienceGlyph },
    { id: "profile", route: APP_ROUTES.profile, source: ProfileGlyph },
]

/** True when the localized pathname is the route (or, unless exact, below it); the locale prefix is dropped first. */
const isOnRoute = (pathname: string, route: string, exact: boolean): boolean => {
    const bare = pathname.replace(/^\/(vi|en)(?=\/|$)/u, "") || "/"
    return exact ? bare === route : bare === route || bare.startsWith(`${route}/`)
}

/**
 * The sidebar: the destinations of the whole product with the page the reader is on marked; navigation only (the plan is in the top bar). Hidden on the
 * sign-in screens, which draw their own centred brand.
 */
export const AppSidebar = (props: AppSidebarProps) => {
    const t = useTranslations("app.shell")
    const pathname = useLocalizedPathname()
    const router = navigation.useRouter()
    const language = useLocaleSwitch()
    const theme = useThemeSwitch()
    const rail = useRailCollapsed()
    if (isOnRoute(pathname, APP_ROUTES.signIn, false)) return null
    const all = [...MAIN, ...EXPERIENCE]
    const entriesOf = (list: ReadonlyArray<Destination>): ReadonlyArray<AppSidebarEntry> =>
        list.map((d) => ({ id: d.id, label: t(`nav.${d.id}`), source: d.source }))
    const selected = all.find((d) => isOnRoute(pathname, d.route, d.id === "learn"))?.id
    return (
        <AppSidebarBase
            props={{
                label: t("sidebarLabel"),
                groups: [
                    { id: "main", items: entriesOf(MAIN) },
                    { id: "experience", label: t("experienceGroup"), items: entriesOf(EXPERIENCE) },
                ],
                selectedKey: selected,
                presentation: props.presentation,
                ...(props.presentation === "rail"
                    ? {
                          collapse: {
                              isCollapsed: rail.isCollapsed,
                              collapseLabel: t("collapseRail"),
                              expandLabel: t("expandRail"),
                              onChange: rail.setCollapsed,
                          },
                      }
                    : {
                          controls: {
                              languageLabel: language.label,
                              locale: language.locale,
                              isLocalePending: language.isPending,
                              localeOptions: language.options,
                              themeLabel: theme.label,
                              isDark: theme.isDark,
                              onChooseLocale: language.choose,
                              onChooseDark: theme.change,
                          },
                      }),
            }}
            on={{
                go: (id) => {
                    const destination = all.find((d) => d.id === id)
                    if (destination !== undefined) router.push(destination.route)
                },
            }}
        />
    )
}
