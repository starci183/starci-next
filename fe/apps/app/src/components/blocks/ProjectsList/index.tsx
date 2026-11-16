"use client"

import { useLocale, useTranslations } from "next-intl"
import { projectRowsOf, projectsFiguresOf } from "@/hooks/projects"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryProjectCatalogSwr, useQueryProjectsSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { APP_ROUTES } from "@/modules/routes"
import type { DataSlot } from "@/modules/types"
import { PROJECTS_LIST_PLACEHOLDER, ProjectsListBase, type ProjectsListView } from "./component"

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
    const settled = slotOfSwr(read)
    const failed = "isError" in settled || "isForbidden" in settled
    const mapped = mapSlot(settled, (projects) => ({
        outcome: "ready" as const,
        figures: projectsFiguresOf(projects),
        rows: projectRowsOf(projects, titles, {
            kind: { app: t("kind.app"), agent: t("kind.agent") },
            noMilestone: t("list.noMilestone"),
            noDeploy: t("list.noDeploy"),
            progress: (proved, count) => t("list.progress", { proved, count }),
        }),
    }))
    const slot: DataSlot<ProjectsListView> =
        failed || "isEmpty" in mapped
            ? {
                  items: {
                      outcome: failed ? "failed" : "ready",
                      figures: PROJECTS_LIST_PLACEHOLDER.figures,
                      rows: [],
                  },
              }
            : mapped
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
                        remaining: t("list.figures.remaining"),
                        milestones: t("list.figures.milestones"),
                        cv: t("list.figures.cv"),
                    },
                    listLabel: t("list.listLabel"),
                    columns: {
                        project: t("list.columns.project"),
                        kind: t("list.columns.kind"),
                        milestone: t("list.columns.milestone"),
                        progress: t("list.columns.progress"),
                        deploy: t("list.columns.deploy"),
                    },
                    progressLabel: t("list.progressLabel"),
                    emptyTitle: t("list.emptyTitle"),
                    emptyText: t("list.emptyText"),
                    errorTitle: t("list.errorTitle"),
                    note: t("list.note"),
                },
            }}
            on={{ retry: () => void read.mutate() }}
        />
    )
}
