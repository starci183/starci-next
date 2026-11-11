"use client"

import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { projectRowsOf } from "@/hooks/projects"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryProjectsSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { APP_ROUTES } from "@/modules/routes"
import type { DataSlot } from "@/modules/types"
import {
    PROJECTS_LIST_PLACEHOLDER,
    ProjectsListBase,
    type ProjectsListView,
    type ProjectsTab,
} from "./component"

/** The connected projects screen: reads the learner's projects with their progress and words every row. */
export const ProjectsList = () => {
    const t = useTranslations("app.projects")
    const read = useQueryProjectsSwr({ locale: useLocale() })
    const [tab, setTab] = useState<ProjectsTab>("all")
    const [query, setQuery] = useState("")
    useDocumentTitle(t("pageTitle"))
    const settled = slotOfSwr(read)
    const failed = "isError" in settled || "isForbidden" in settled
    const mapped = mapSlot(settled, (projects) => ({
        outcome: "ready" as const,
        rows: projectRowsOf(projects, {
            state: { practicing: t("list.state.practicing"), proved: t("list.state.proved") },
            concepts: (proved, count) => t("list.concepts", { proved, count }),
        }),
    }))
    const slot: DataSlot<ProjectsListView> =
        failed || "isEmpty" in mapped ? { items: { outcome: failed ? "failed" : "ready", rows: [] } } : mapped
    return (
        <ProjectsListBase
            props={{
                slot,
                placeholder: PROJECTS_LIST_PLACEHOLDER,
                slotLabels: useSlotLabels()(t("empty")),
                tab,
                query,
                labels: {
                    pageTitle: t("list.title"),
                    pageDescription: t("list.description"),
                    create: t("list.create"),
                    createHref: APP_ROUTES.projectsNew,
                    listLabel: t("list.listLabel"),
                    tabsLabel: t("list.tabsLabel"),
                    tabs: {
                        all: t("list.tabs.all"),
                        practicing: t("list.tabs.practicing"),
                        proved: t("list.tabs.proved"),
                    },
                    searchLabel: t("list.searchLabel"),
                    searchPlaceholder: t("list.searchPlaceholder"),
                    searchClear: t("list.searchClear"),
                    emptyTitle: t("list.emptyTitle"),
                    emptyText: t("list.emptyText"),
                    emptyFilteredTitle: t("list.emptyFilteredTitle"),
                    errorTitle: t("list.errorTitle"),
                    progressLabel: t("list.progressLabel"),
                    device: {
                        title: t("device.title"),
                        status: t("device.badge"),
                        text: t("device.text"),
                        connect: t("device.connect"),
                        connectHref: APP_ROUTES.devices,
                    },
                    levels: {
                        title: t("levels.title"),
                        practice: t("levels.practice"),
                        practiceNote: t("levels.practiceNote"),
                        proof: t("levels.proof"),
                        proofNote: t("levels.proofNote"),
                    },
                    asideLabel: t("levels.asideLabel"),
                },
            }}
            on={{ retry: () => void read.mutate(), tabChange: setTab, queryChange: setQuery }}
        />
    )
}
