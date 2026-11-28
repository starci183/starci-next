"use client"

import { useTranslations } from "next-intl"
import type { CourseIntroLabels, CoursePatternLabels, CourseProductionLabels } from "@starci-next/ui"
import { useCourseArchitectureLabels, type CourseArchitecturePageLabels } from "./useCourseArchitectureLabels"
import { useCourseNarrationWords } from "./useCourseNarrationWords"
import type { CourseIntroWords, CoursePatternWords, CourseProductionWords } from "@/modules/course-lesson"

/** The words of the intro, the naming and the comparison: what each draws with and what its builder needs. */
export type CoursePageLabels = {
    readonly intro: { readonly labels: CourseIntroLabels; readonly words: CourseIntroWords }
    readonly pattern: { readonly labels: CoursePatternLabels; readonly words: CoursePatternWords }
    readonly production: { readonly labels: CourseProductionLabels; readonly words: CourseProductionWords }
    readonly architecture: CourseArchitecturePageLabels
}

/** Resolves every word of the intro page, of the recap page (page 6) and of the gift repos of the submit page once. */
export const useCoursePageLabels = (): CoursePageLabels => {
    const t = useTranslations("app.courseLesson")
    const architecture = useCourseArchitectureLabels()
    const narration = useCourseNarrationWords()
    return {
        architecture,
        intro: {
            labels: {
                architectureTitle: t("intro.architectureTitle"),
                diagramLabel: t("intro.diagramLabel"),
                diagramError: t("intro.diagramError"),
                diagramCaption: t("intro.diagramCaption"),
                diagramCalls: t("intro.diagramCalls"),
                diagramData: t("intro.diagramData"),
                diagramEdit: t("intro.diagramEdit"),
                diagramTo: t("intro.diagramTo"),
                servicesTitle: t("intro.servicesTitle"),
                outcomesTitle: t("intro.outcomesTitle"),
                requiresTitle: t("intro.requiresTitle"),
                requiresNote: t("intro.requiresNote"),
                empty: t("intro.empty"),
            },
            words: {
                entry: t("intro.entry"),
                frame: t("intro.frame"),
                outcomeCase: (title) => t("intro.outcomeCase", { title }),
                explainerAlt: (title) => t("intro.explainerAlt", { title }),
                labTitle: t("intro.labTitle"),
                labFigure: (green, total) => t("intro.labFigure", { green, total }),
                labMeta: (counts) => t("intro.labMeta", counts),
                labMore: (count) => t("intro.labMore", { count }),
                labStart: t("intro.labStart"),
                labCaption: (total) => t("intro.labCaption", { total }),
                narration,
            },
        },
        pattern: {
            labels: {
                conceptTitle: t("pattern.conceptTitle"),
                conceptNote: t("pattern.conceptNote"),
                stepsTitle: t("pattern.stepsTitle"),
                stepsNote: t("pattern.stepsNote"),
                englishNote: t("pattern.englishNote"),
                stepsEmpty: t("pattern.stepsEmpty"),
                answerTitle: t("pattern.answerTitle"),
            },
            words: {
                lead: t("pattern.lead"),
                greenLabel: t("pattern.green"),
                openLabel: t("pattern.open"),
                labTitle: t("pattern.labTitle"),
                labStart: t("pattern.labStart"),
                labCaption: (total) => t("pattern.labCaption", { total }),
                narration,
            },
        },
        production: {
            labels: {
                title: t("production.title"),
                lead: t("production.lead"),
                standardTitle: t("production.standardTitle"),
                commandLabel: t("production.commandLabel"),
                reposTitle: t("production.reposTitle"),
                reposNote: t("production.reposNote"),
                reposEmpty: t("production.reposEmpty"),
                beyondTitle: t("production.beyondTitle"),
                externalHint: t("production.externalHint"),
                copy: t("copy.copy"),
                copied: t("copy.copied"),
                copyFailed: t("copy.failed"),
            },
            words: {
                repoMeta: (lang, checked) => t("production.repoMeta", { lang, checked: checked ?? "none" }),
                referenceMeta: (checked) => t("production.referenceMeta", { checked }),
            },
        },
    }
}
