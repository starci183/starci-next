"use client"

import { useTranslations } from "next-intl"
import type { LessonStudyLabels } from "@/modules/types"
import { useLessonCardLabels } from "./useLessonCardLabels"
import { useLessonPhaseWords } from "./useLessonPhaseWords"

/** Resolves every word of the study screen once: the phases, the rail, the overview, the locked notice and the activity cards. */
export const useLessonStudyLabels = (): LessonStudyLabels => {
    const t = useTranslations("app.essentials")
    const cards = useLessonCardLabels()
    const phases = useLessonPhaseWords()
    return {
        pageTitle: t("study.pageTitle"),
        breadcrumbs: t("study.breadcrumbs"),
        review: t("study.review"),
        tabs: t("study.tabs"),
        diagram: t("study.diagram"),
        diagramError: t("study.diagramError"),
        lockedTitle: t("locked.title"),
        lockedDescription: t("locked.description"),
        plans: t("locked.plans"),
        phases,
        rail: {
            phases: t("study.railLabel"),
            outcomes: t("study.outcomes"),
            outcomesLocked: t("study.outcomesLocked"),
            empty: t("study.railEmpty"),
            locked: t("study.locked"),
        },
        compare: {
            title: t("compare.title"),
            before: t("compare.before"),
            after: t("compare.after"),
            none: t("compare.none"),
            levels: [t("levels.none"), t("levels.half"), t("levels.reached")],
            empty: t("compare.empty"),
        },
        overview: {
            title: t("phases.overview.title"),
            outcomes: t("overview.outcomes"),
            prerequisites: t("overview.prerequisites"),
            phases: t("overview.phases"),
            start: t("overview.start"),
            scope: t("study.scope"),
            references: t("study.references"),
            empty: t("overview.empty"),
        },
        ...cards,
    }
}
