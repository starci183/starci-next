"use client"

import { useTranslations } from "next-intl"
import type { CourseArchitectureLabels } from "@starci-next/ui"
import type { CourseArchitectureWords } from "@/modules/course-lesson"

/** The words of the Kiến trúc page: what the composite draws with, what its builder needs, and the tab and next-page words around it. */
export type CourseArchitecturePageLabels = {
    readonly labels: CourseArchitectureLabels
    readonly words: CourseArchitectureWords
    /** The tab of the page. */
    readonly tab: string
    /** The name of the header's tabs, now seven. */
    readonly tabsLabel: string
    /** The command on the setup page that opens this one. */
    readonly nextFromSetup: string
}

/**
 * Resolves every word of the Kiến trúc page once, from its own namespace (`app.courseArchitecture`, apart from `app.courseLesson` so the
 * page's copy merges on its own). The copy follows lessons.md §8: Vietnamese sentences, English engineering terms.
 */
export const useCourseArchitectureLabels = (): CourseArchitecturePageLabels => {
    const t = useTranslations("app.courseArchitecture")
    return {
        tab: t("tab"),
        tabsLabel: t("tabsLabel"),
        nextFromSetup: t("nextFromSetup"),
        labels: {
            diagramTitle: t("diagramTitle"),
            diagramLabel: t("diagramLabel"),
            diagramError: t("diagramError"),
            diagramCaption: t("diagramCaption"),
            diagramCalls: t("diagramCalls"),
            diagramData: t("diagramData"),
            diagramEdit: t("diagramEdit"),
            diagramTo: t("diagramTo"),
            whyTitle: t("whyTitle"),
            requestsLabel: t("requestsLabel"),
            numberColumn: t("numberColumn"),
            callColumn: t("callColumn"),
            endpointColumn: t("endpointColumn"),
            doesColumn: t("doesColumn"),
            situationsTitle: t("situationsTitle"),
            situationsNote: t("situationsNote"),
            situationsHappy: t("situationsHappy"),
            situationsUnhappy: t("situationsUnhappy"),
            empty: t("empty"),
        },
        words: {
            entry: t("entry"),
            frame: t("frame"),
            flowTitle: (services) => t("flowTitle", { services }),
            codeTitle: (method, path) => t("codeTitle", { method, path }),
            codeTitlePlain: t("codeTitlePlain"),
            codeLeadOne: (params) => t("codeLeadOne", params),
            codeLeadMany: (params) => t("codeLeadMany", params),
            mark: (line, request) => t("mark", { line, request }),
            noChaos: t("noChaos"),
        },
    }
}
