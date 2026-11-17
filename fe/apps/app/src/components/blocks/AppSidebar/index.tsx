"use client"

import { navigation } from "@starci-next/i18n/navigation"
import {
    AgentsGlyph,
    EssentialsGlyph,
    LearnGlyph,
    PracticeGlyph,
    ProfileGlyph,
    ProjectsGlyph,
    ReviewGlyph,
} from "@starci-next/ui"
import { useLocale, useTranslations } from "next-intl"
import { useSession } from "@/hooks/auth"
import { useViewerPlan } from "@/hooks/plan"
import { useQueryReviewTodaySwr } from "@/hooks/swr"
import { useRailCollapsed } from "@/hooks/rail"
import { useThemeSwitch } from "@/hooks/theme"
import { useLocaleSwitch, useLocalizedPathname } from "@/hooks/locale"
import { APP_ROUTES } from "@/modules/routes"
import type { AppSidebarEntry } from "@/modules/types"
import { AppSidebarBase } from "./component"

/** The drawing: the wide rail or the drawer. */
type AppSidebarProps = {
    readonly presentation: "rail" | "drawer"
}

/** One destination: its message key, the route it opens and the glyph that stands for it. */
type Destination = {
    readonly id: "learn" | "essentials" | "projects" | "harness" | "practice" | "review" | "profile"
    readonly route: string
    readonly source: AppSidebarEntry["source"]
}

const START: ReadonlyArray<Destination> = [{ id: "learn", route: APP_ROUTES.home, source: LearnGlyph }]

const AREAS: ReadonlyArray<Destination> = [
    { id: "essentials", route: APP_ROUTES.essentials, source: EssentialsGlyph },
    { id: "projects", route: APP_ROUTES.projects, source: ProjectsGlyph },
    { id: "harness", route: APP_ROUTES.harness, source: AgentsGlyph },
]

const DRILLS: ReadonlyArray<Destination> = [
    { id: "practice", route: APP_ROUTES.practice, source: PracticeGlyph },
    { id: "review", route: APP_ROUTES.review, source: ReviewGlyph },
]

const MINE: ReadonlyArray<Destination> = [{ id: "profile", route: APP_ROUTES.profile, source: ProfileGlyph }]

/** The pages that sit under Hồ sơ without being below its route: progress, verified experience, the Premium plan and the devices (the drawing's breadcrumb "Hồ sơ / …"). */
const PROFILE_PAGES: ReadonlyArray<string> = [
    APP_ROUTES.progress,
    APP_ROUTES.experience,
    APP_ROUTES.reviewQueue,
    APP_ROUTES.premium,
    APP_ROUTES.devices,
    APP_ROUTES.connect,
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
    const locale = useLocale()
    const session = useSession()
    const plan = useViewerPlan()
    const due = useQueryReviewTodaySwr(locale, true).data?.due
    const pathname = useLocalizedPathname()
    const router = navigation.useRouter()
    const language = useLocaleSwitch()
    const theme = useThemeSwitch()
    const rail = useRailCollapsed()
    if (isOnRoute(pathname, APP_ROUTES.signIn, false)) return null
    const all = [...START, ...AREAS, ...DRILLS, ...MINE]
    const isLocked = (d: Destination): boolean =>
        d.id === "projects" && session.status === "signed-in" && plan === "free"
    const entriesOf = (list: ReadonlyArray<Destination>): ReadonlyArray<AppSidebarEntry> =>
        list.map((d) => ({
            id: d.id,
            label: t(`nav.${d.id}`),
            source: d.source,
            ...(d.id === "review" && due !== undefined && due > 0
                ? { badge: due, badgeLabel: t("reviewDue", { count: due }) }
                : {}),
            ...(isLocked(d) ? { isLocked: true, lockedLabel: t("premiumLocked") } : {}),
        }))
    // A page that belongs to a destination without being below its route keeps that destination marked: Tiến độ, Kinh nghiệm, Premium and Máy của bạn are part of Hồ sơ.
    const belongsTo = PROFILE_PAGES.some((route) => isOnRoute(pathname, route, false)) ? "profile" : undefined
    const selected = belongsTo ?? all.find((d) => isOnRoute(pathname, d.route, d.id === "learn"))?.id
    return (
        <AppSidebarBase
            props={{
                label: t("sidebarLabel"),
                groups: [
                    { id: "start", items: entriesOf(START) },
                    { id: "areas", label: t("areasGroup"), items: entriesOf(AREAS) },
                    { id: "drills", label: t("drillsGroup"), items: entriesOf(DRILLS) },
                    { id: "mine", label: t("mineGroup"), items: entriesOf(MINE) },
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
