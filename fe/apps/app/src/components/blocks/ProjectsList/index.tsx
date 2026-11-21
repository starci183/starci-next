"use client"

import { useLocale, useTranslations } from "next-intl"
import { projectRowsOf, projectsFiguresOf } from "@/hooks/projects"
import { loadingSlot, mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { type ProjectsRead, useQueryProjectCatalogSwr, useQueryProjectsSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { staticsBase } from "@/modules/config"
import { APP_ROUTES } from "@/modules/routes"
import type { DataSlot } from "@/modules/types"
import { PROJECTS_LIST_PLACEHOLDER, ProjectsListBase, type ProjectsListView } from "./component"

/** The states of the latest CI run a project can be in. */
const CI_STATES = ["none", "passed", "failed"] as const

/** The connected projects screen: reads the learner's projects and the milestone titles, and words the ribbon and every row. */
export const ProjectsList = () => {
    const t = useTranslations("app.projects")
    const locale = useLocale()
    const read = useQueryProjectsSwr({ locale })
    const catalog = useQueryProjectCatalogSwr({ locale })
    useDocumentTitle(t("pageTitle"))
    const titles = Object.fromEntries(
        (catalog.data?.milestones ?? []).map((milestone) => [milestone.id, milestone.title]),
    )
    // The milestone names come from the catalog read: a row is drawn once it has arrived, never with the raw milestone code in its place.
    const settled =
        catalog.data === undefined && catalog.error === undefined ? loadingSlot<ProjectsRead>() : slotOfSwr(read)
    const mapped = mapSlot(settled, (projects) => ({
        figures: projectsFiguresOf(projects),
        rows: projectRowsOf(projects, titles, {
            kind: { app: t("kind.app"), agent: t("kind.agent") },
            noMilestone: t("list.noMilestone"),
            ci: Object.fromEntries(CI_STATES.map((state) => [state, t(`list.ci.${state}`)])),
            progress: (proved, count) => t("list.progress", { proved, count }),
        }),
    }))
    const slot: DataSlot<ProjectsListView> =
        "isEmpty" in mapped ? { items: { figures: PROJECTS_LIST_PLACEHOLDER.figures, rows: [] } } : mapped
    return (
        <ProjectsListBase
            props={{
                slot,
                placeholder: PROJECTS_LIST_PLACEHOLDER,
                slotLabels: useSlotLabels()(t("empty")),
                labels: {
                    pageTitle: t("list.title"),
                    pageDescription: t("list.description"),
                    create: t("list.create"),
                    createHref: APP_ROUTES.projectsNew,
                    ribbonLabel: t("list.ribbonLabel"),
                    figures: {
                        proved: t("list.figures.proved"),
                        practising: t("list.figures.practising"),
                        milestones: t("list.figures.milestones"),
                        cv: t("list.figures.cv"),
                    },
                    listLabel: t("list.listLabel"),
                    columns: {
                        project: t("list.columns.project"),
                        kind: t("list.columns.kind"),
                        milestone: t("list.columns.milestone"),
                        progress: t("list.columns.progress"),
                        ci: t("list.columns.ci"),
                    },
                    progressLabel: t("list.progressLabel"),
                    emptyTitle: t("list.emptyTitle"),
                    emptyText: t("list.emptyText"),
                    note: t("list.note"),
                    addTitle: t("list.addTitle"),
                    addText: t("list.addText"),
                },
                staticsBaseUrl: staticsBase(),
            }}
            on={{ retry: () => void read.mutate() }}
        />
    )
}
