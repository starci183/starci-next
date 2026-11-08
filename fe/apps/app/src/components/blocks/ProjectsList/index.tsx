"use client"

import { useLocale, useTranslations } from "next-intl"
import { projectRowsOf } from "@/hooks/projects"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryProjectsSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { APP_ROUTES } from "@/modules/routes"
import { PROJECTS_LIST_PLACEHOLDER, ProjectsListBase } from "./component"

/** The connected projects screen: reads the learner's projects with their progress and words every row. */
export const ProjectsList = () => {
    const t = useTranslations("app.projects")
    const read = useQueryProjectsSwr({ locale: useLocale() })
    useDocumentTitle(t("pageTitle"))
    return (
        <ProjectsListBase
            props={{
                slot: mapSlot(slotOfSwr(read), (projects) => ({
                    rows: projectRowsOf(projects, {
                        kind: { app: t("kind.app"), agent: t("kind.agent") },
                        open: t("list.open"),
                        meta: (done, total, proved, count) => t("list.meta", { done, total, proved, count }),
                    }),
                })),
                placeholder: PROJECTS_LIST_PLACEHOLDER,
                slotLabels: useSlotLabels()(t("empty")),
                labels: {
                    eyebrow: t("list.eyebrow"),
                    title: t("list.title"),
                    description: t("list.description"),
                    create: t("list.create"),
                    createHref: APP_ROUTES.projectsNew,
                    listLabel: t("list.listLabel"),
                    emptyTitle: t("list.emptyTitle"),
                    emptyText: t("list.emptyText"),
                    device: {
                        title: t("device.title"),
                        badge: t("device.badge"),
                        text: t("device.text"),
                        practice: t("device.practice"),
                        practiceNote: t("device.practiceNote"),
                        proof: t("device.proof"),
                        proofNote: t("device.proofNote"),
                    },
                },
            }}
            on={{ retry: () => void read.mutate() }}
        />
    )
}
