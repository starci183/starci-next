"use client"

import { useTranslations } from "next-intl"
import type { LessonStudyLabels } from "@/modules/types"
import { useLessonJourneyLabels } from "./useLessonJourneyLabels"
import { useLessonCardLabels } from "./useLessonCardLabels"
import { useLessonPhaseWords } from "./useLessonPhaseWords"

/** Resolves every word of the study screen once: the phases, the rail, the overview, the locked notice and the activity cards. */
export const useLessonStudyLabels = (): LessonStudyLabels => {
    const t = useTranslations("app.essentials")
    const cards = useLessonCardLabels()
    const journey = useLessonJourneyLabels()
    const phases = useLessonPhaseWords()
    return {
        pageTitle: t("study.pageTitle"),
        breadcrumbs: t("study.breadcrumbs"),
        review: t("study.review"),
        tabs: t("study.tabs"),
        diagram: t("study.diagram"),
        diagramError: t("study.diagramError"),
        filesLabel: t("study.filesLabel"),
        languageLabel: t("study.languageLabel"),
        lockedTitle: t("locked.title"),
        lockedDescription: t("locked.description"),
        plans: t("locked.plans"),
        phases,
        rail: {
            phases: t("study.railLabel"),
            outcomes: t("study.outcomes"),
            outcomesLocked: t("study.outcomesLocked"),
            outcomeStates: [t("study.outcomeNone"), t("study.outcomeUnderstood"), t("study.outcomeProved")] as const,
            seePremium: t("study.seePremium"),
            review: phases.review.title,
            empty: t("study.railEmpty"),
            locked: t("study.locked"),
            references: t("study.references"),
            reviewAfter: (days) => t("study.reviewAfter", { days }),
            reviewState: t("study.reviewState"),
            close: t("study.close"),
        },
        compare: {
            title: t("compare.title"),
            criterion: t("compare.criterion"),
            before: t("compare.before"),
            after: t("compare.after"),
            none: t("compare.none"),
            levels: [t("levels.none"), t("levels.half"), t("levels.reached")],
            empty: t("compare.empty"),
        },
        overview: {
            title: t("phases.overview.title"),
            about: t("overview.about"),
            scope: t("study.scope"),
            scopeShow: t("overview.scopeShow"),
            outcomes: t("overview.outcomes"),
            prerequisites: t("overview.prerequisites"),
            phases: t("overview.phases"),
            open: t("overview.phaseOpen"),
            done: t("overview.phaseDone"),
            locked: t("study.locked"),
            empty: t("overview.empty"),
            start: t("overview.start"),
        },
        ...cards,
        ...journey,
    }
}
